# Demo cinematic

A self-running, recordable walkthrough of the remediation story: vulnerable →
patched from the Broadcom Spring Enterprise repo → modernised to Boot 4.1 with
Spring App Advisor.

Open `index.html` in a browser (also published as a Claude Artifact).

A rendered 1080p MP4 sits at `spring-enterprise-remediation-demo.mp4`
(181s, H.264, ~57MB). It is gitignored - rebuild it with the two scripts below.

**Controls** — `space` play/pause · `←`/`→` scene · `R` replay · `F` fullscreen.
Scrolling a scene auto-pauses for 4s. Full run is about 3.5 minutes.

## Assets

| Path | What it is |
|------|------------|
| `apps/app-vulnerable.jpg` | `tanzu-vuln-demo-b2caca` — 12 CVEs, max CVSS 10.0 |
| `apps/app-patched.jpg` | `vuln-demo-patched` — all 12 closed, 0.0 exposure, Boot 2.7.33 |
| `apps/app-oss4x.jpg` | `tanzu-vuln-demo-oss4x` — Boot 4.1.0, 0.0 exposure |
| `shots/hub-*.jpg` | Tanzu Hub views for the same three apps |

## Refreshing the app screenshots

The dashboards animate their counters on load, so a plain headless screenshot
catches them mid-count. `capture-app-screenshots.mjs` drives Chrome over CDP and
waits on the wall clock instead:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --hide-scrollbars \
  --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-shots about:blank &

node demo/capture-app-screenshots.mjs demo/apps
# then: sips -s format jpeg -s formatOptions 82 --resampleWidth 2200 x.png --out x.jpg
```

## Rebuilding the MP4

The deck is real-time and rAF-driven, so it is recorded rather than rendered.
`record-demo.mjs` drives Chrome's screencast over CDP at 2x device scale and
delivers frames downscaled to 1080p (supersampled, so the code and terminal
type stay crisp). `encode-mp4.swift` turns those frames into H.264 with
AVFoundation - no ffmpeg needed, since the ffmpeg that ships with Playwright is
a VP8/WebM-only build.

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --hide-scrollbars \
  --disable-background-timer-throttling --disable-renderer-backgrounding \
  --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-rec about:blank &

node demo/record-demo.mjs "file://$PWD/demo/index.html" /tmp/frames 192

swiftc -O -o /tmp/encode demo/encode-mp4.swift
/tmp/encode /tmp/frames demo/spring-enterprise-remediation-demo.mp4 30 181
```

The trailing `181` is the cut point: one full pass of the nine scenes runs
187s, but the recorder starts a few seconds after page load, so cutting at 181
lands on the last frame of the scorecard instead of looping back to scene 1.
