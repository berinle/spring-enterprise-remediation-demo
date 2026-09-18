# Demo cinematic

A self-running, recordable walkthrough of the remediation story: vulnerable →
patched from the Broadcom Spring Enterprise repo → modernised to Boot 4.1 with
Spring App Advisor.

Open `index.html` in a browser (also published as a Claude Artifact).

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
