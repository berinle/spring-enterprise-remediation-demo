import { writeFileSync } from 'node:fs';

const PORT = 9222;
const OUT = process.argv[2];
const TARGETS = [
  ['https://tanzu-vuln-demo-b2caca.apps.tas-ndc.kuhn-labs.com', 'app-vulnerable.png'],
  ['https://vuln-demo-patched.apps.tas-ndc.kuhn-labs.com',      'app-patched.png'],
  ['https://tanzu-vuln-demo-oss4x.apps.tas-ndc.kuhn-labs.com',  'app-oss4x.png'],
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

function cdp(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let id = 0;
    const pending = new Map();
    ws.addEventListener('message', e => {
      const m = JSON.parse(e.data);
      if (m.id && pending.has(m.id)) {
        const { res, rej } = pending.get(m.id);
        pending.delete(m.id);
        m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result);
      }
    });
    ws.addEventListener('error', reject);
    ws.addEventListener('open', () => resolve({
      send: (method, params = {}) => new Promise((res, rej) => {
        const n = ++id;
        pending.set(n, { res, rej });
        ws.send(JSON.stringify({ id: n, method, params }));
      }),
      close: () => ws.close(),
    }));
  });
}

for (const [url, file] of TARGETS) {
  const t = await (await fetch(`http://localhost:${PORT}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' })).json();
  const c = await cdp(t.webSocketDebuggerUrl);
  await c.send('Page.enable');
  await c.send('Emulation.setDeviceMetricsOverride', {
    width: 1440, height: 960, deviceScaleFactor: 2, mobile: false,
  });
  // real wall-clock wait so count-up / ring animations finish
  await sleep(9000);
  const top = await c.send('Runtime.evaluate', {
    expression: 'document.querySelector("h1")?.innerText || "(no h1)"', returnByValue: true,
  });
  const shot = await c.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(`${OUT}/${file}`, Buffer.from(shot.data, 'base64'));
  console.log(`${file.padEnd(22)} ${JSON.stringify(top.result.value).slice(0, 72)}`);
  await c.send('Page.close').catch(() => {});
  c.close();
}
