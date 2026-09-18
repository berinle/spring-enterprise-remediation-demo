import { writeFile, mkdir, rm } from 'node:fs/promises';
import { writeFileSync } from 'node:fs';

const PORT = 9222;
const PAGE  = process.argv[2];              // file:// url
const OUT   = process.argv[3];              // frame dir
const SECS  = Number(process.argv[4] || 190);

const sleep = ms => new Promise(r => setTimeout(r, ms));

function cdp(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let id = 0;
    const pending = new Map();
    const handlers = new Map();
    ws.addEventListener('message', e => {
      const m = JSON.parse(e.data);
      if (m.id && pending.has(m.id)) {
        const { res, rej } = pending.get(m.id); pending.delete(m.id);
        m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result);
      } else if (m.method && handlers.has(m.method)) {
        handlers.get(m.method)(m.params);
      }
    });
    ws.addEventListener('error', reject);
    ws.addEventListener('open', () => resolve({
      send: (method, params = {}) => new Promise((res, rej) => {
        const n = ++id; pending.set(n, { res, rej });
        ws.send(JSON.stringify({ id: n, method, params }));
      }),
      on: (m, fn) => handlers.set(m, fn),
      close: () => ws.close(),
    }));
  });
}

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

const t = await (await fetch(`http://localhost:${PORT}/json/new?${encodeURIComponent(PAGE)}`, { method: 'PUT' })).json();
const c = await cdp(t.webSocketDebuggerUrl);
await c.send('Page.enable');
await c.send('Runtime.enable');
// render at 2x, deliver frames downscaled to 1080p => supersampled, crisp text
await c.send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 2, mobile: false });

console.log('waiting for fonts + images…');
await sleep(6000);
const ready = await c.send('Runtime.evaluate', {
  expression: `(async () => { await document.fonts.ready;
     const imgs=[...document.images]; await Promise.all(imgs.map(i=>i.complete?0:new Promise(r=>{i.onload=i.onerror=r})));
     return document.images.length + " images, fonts " + document.fonts.status; })()`,
  awaitPromise: true, returnByValue: true,
});
console.log('ready:', ready.result.value);

const frames = [];
let n = 0, t0 = 0;
const writes = [];

c.on('Page.screencastFrame', p => {
  const ts = p.metadata.timestamp;
  if (!t0) t0 = ts;
  const rel = ts - t0;
  const name = `f${String(n++).padStart(6, '0')}.jpg`;
  frames.push({ name, t: rel });
  writes.push(writeFile(`${OUT}/${name}`, Buffer.from(p.data, 'base64')));
  c.send('Page.screencastFrameAck', { sessionId: p.sessionId }).catch(() => {});
});

await c.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 });
// restart the deck from scene 1 so capture begins exactly at the cold open
await c.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'r', text: 'r', windowsVirtualKeyCode: 82 });
await c.send('Input.dispatchKeyEvent', { type: 'keyUp',   key: 'r', text: 'r', windowsVirtualKeyCode: 82 });

const started = Date.now();
let last = 0;
while ((Date.now() - started) / 1000 < SECS) {
  await sleep(1000);
  const el = Math.round((Date.now() - started) / 1000);
  if (el !== last && el % 15 === 0) { console.log(`  ${el}s / ${SECS}s · ${n} frames`); last = el; }
}

await c.send('Page.stopScreencast');
await Promise.all(writes);
writeFileSync(`${OUT}/manifest.json`, JSON.stringify(frames));
console.log(`captured ${frames.length} frames over ${frames.at(-1).t.toFixed(1)}s`);
await c.send('Page.close').catch(() => {});
c.close();
process.exit(0);
