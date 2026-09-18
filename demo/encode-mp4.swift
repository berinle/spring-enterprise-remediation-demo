import Foundation
import AVFoundation
import CoreGraphics
import ImageIO

struct Frame: Decodable { let name: String; let t: Double }

let args = CommandLine.arguments
guard args.count >= 3 else { FileHandle.standardError.write("usage: encode <frameDir> <out.mp4> [fps] [maxSeconds]\n".data(using:.utf8)!); exit(2) }
let dir = args[1], outPath = args[2]
let fps = args.count > 3 ? Int32(args[3])! : 30
let maxSecs = args.count > 4 ? Double(args[4])! : Double.greatestFiniteMagnitude

let data = try Data(contentsOf: URL(fileURLWithPath: "\(dir)/manifest.json"))
let frames = try JSONDecoder().decode([Frame].self, from: data)
guard !frames.isEmpty else { print("no frames"); exit(1) }

// probe dimensions from the first frame
func loadCG(_ path: String) -> CGImage? {
    guard let src = CGImageSourceCreateWithURL(URL(fileURLWithPath: path) as CFURL, nil) else { return nil }
    return CGImageSourceCreateImageAtIndex(src, 0, nil)
}
guard let first = loadCG("\(dir)/\(frames[0].name)") else { print("cannot read first frame"); exit(1) }
let W = first.width, H = first.height
print("frames: \(frames.count)  size: \(W)x\(H)  fps: \(fps)")

try? FileManager.default.removeItem(atPath: outPath)
let writer = try AVAssetWriter(outputURL: URL(fileURLWithPath: outPath), fileType: .mp4)
let settings: [String: Any] = [
    AVVideoCodecKey: AVVideoCodecType.h264,
    AVVideoWidthKey: W,
    AVVideoHeightKey: H,
    AVVideoCompressionPropertiesKey: [
        AVVideoAverageBitRateKey: 9_000_000,
        AVVideoMaxKeyFrameIntervalKey: fps * 2,
        AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
        AVVideoAllowFrameReorderingKey: true,
    ],
]
let input = AVAssetWriterInput(mediaType: .video, outputSettings: settings)
input.expectsMediaDataInRealTime = false
let attrs: [String: Any] = [
    kCVPixelBufferPixelFormatTypeKey as String: Int(kCVPixelFormatType_32BGRA),
    kCVPixelBufferWidthKey as String: W,
    kCVPixelBufferHeightKey as String: H,
    kCVPixelBufferIOSurfacePropertiesKey as String: [:],
]
let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: attrs)
writer.add(input)
writer.startWriting()
writer.startSession(atSourceTime: .zero)

var currentTick = 0
let cs = CGColorSpaceCreateDeviceRGB()
func pixelBuffer(_ img: CGImage) -> CVPixelBuffer? {
    guard let pool = adaptor.pixelBufferPool else { return nil }
    var pb: CVPixelBuffer?
    guard CVPixelBufferPoolCreatePixelBuffer(nil, pool, &pb) == kCVReturnSuccess, let buf = pb else { return nil }
    CVPixelBufferLockBaseAddress(buf, [])
    defer { CVPixelBufferUnlockBaseAddress(buf, []) }
    guard let ctx = CGContext(data: CVPixelBufferGetBaseAddress(buf), width: W, height: H,
                              bitsPerComponent: 8, bytesPerRow: CVPixelBufferGetBytesPerRow(buf),
                              space: cs, bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue
                                  | CGBitmapInfo.byteOrder32Little.rawValue) else { return nil }
    ctx.draw(img, in: CGRect(x: 0, y: 0, width: W, height: H))
    return buf
}

let endT = min(frames.last!.t, maxSecs)
let total = Int(endT * Double(fps))
var srcIdx = 0
var cached: (Int, CVPixelBuffer)? = nil
let sem = DispatchSemaphore(value: 0)
let q = DispatchQueue(label: "enc")

input.requestMediaDataWhenReady(on: q) {
    var i = cached?.0 ?? 0
    _ = i
    while input.isReadyForMoreMediaData {
        let tick = Int(currentTick)
        if tick >= total { input.markAsFinished(); sem.signal(); return }
        let t = Double(tick) / Double(fps)
        while srcIdx + 1 < frames.count && frames[srcIdx + 1].t <= t { srcIdx += 1 }
        var buf: CVPixelBuffer
        if let c = cached, c.0 == srcIdx { buf = c.1 }
        else {
            guard let img = loadCG("\(dir)/\(frames[srcIdx].name)"), let b = pixelBuffer(img) else {
                currentTick += 1; continue
            }
            cached = (srcIdx, b); buf = b
        }
        adaptor.append(buf, withPresentationTime: CMTime(value: CMTimeValue(tick), timescale: fps))
        currentTick += 1
        if tick % (Int(fps) * 20) == 0 { print("  \(t.rounded())s / \(endT.rounded())s") }
    }
}
sem.wait()
writer.finishWriting { sem.signal() }
sem.wait()
if writer.status == .completed {
    let sz = (try? FileManager.default.attributesOfItem(atPath: outPath)[.size] as? Int) ?? 0
    print("wrote \(outPath)  \(String(format: "%.1f", Double(sz ?? 0)/1_048_576))MB  \(String(format: "%.1f", endT))s")
} else {
    print("FAILED: \(String(describing: writer.error))"); exit(1)
}
