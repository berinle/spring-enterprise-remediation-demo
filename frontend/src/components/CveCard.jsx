import { useState } from 'react'
import { EXPLOITS, runExploit } from '../exploits.js'

const SEV_CLASS = {
  CRITICAL: 'sev-crit',
  HIGH: 'sev-high',
  MEDIUM: 'sev-med',
  LOW: 'sev-low',
}

export default function CveCard({ vuln, remediated }) {
  const [open, setOpen] = useState(false)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState(null)
  const [errored, setErrored] = useState(false)

  const exploit = EXPLOITS[vuln.cveId]

  async function fire() {
    setRunning(true)
    setErrored(false)
    setResult(null)
    try {
      const r = await runExploit(vuln.cveId)
      setResult(r)
    } catch (e) {
      setErrored(true)
      setResult({ body: String(e), status: 0, statusText: 'network error', request: '', elapsed: 0 })
    } finally {
      setRunning(false)
    }
  }

  return (
    <article
      className={`cve-card ${remediated ? 'sev-patched' : SEV_CLASS[vuln.severity]} ${
        open ? 'open' : ''
      }`}
    >
      <div className="cve-top">
        <a
          className="cve-id"
          href={vuln.nvdUrl}
          target="_blank"
          rel="noopener"
        >
          {vuln.cveId} ↗
        </a>
        {remediated ? (
          <span className="sev-badge ok">✓ Remediated</span>
        ) : (
          <span
            className="sev-badge"
            style={{ background: vuln.severity && sevColor(vuln.severity) }}
          >
            {sevLabel(vuln.severity)}
          </span>
        )}
      </div>

      <h3 className="cve-title">{vuln.title}</h3>
      <p className="cve-desc">{vuln.description}</p>

      <div className="cve-meta">
        <div className="meta-row">
          <span className="k">Component</span>
          <span className="v mono">{vuln.component}</span>
        </div>
        <div className="meta-row">
          <span className="k">Was</span>
          <span className="v mono bad struck">{vuln.affectedVersion}</span>
        </div>
        <div className="meta-row">
          <span className="k">{remediated ? 'Installed' : 'Fixed in'}</span>
          <span className="v mono good">
            {remediated ? vuln.installedVersion : vuln.fixedVersion}
            {remediated && ' ✓'}
          </span>
        </div>
      </div>

      <div className="cve-foot">
        <span className="cvss">
          {remediated ? (
            <>
              was CVSS <b className="struck">{vuln.cvss.toFixed(1)}</b>
            </>
          ) : (
            <>
              CVSS <b>{vuln.cvss.toFixed(1)}</b>
            </>
          )}
        </span>
        {exploit ? (
          <button
            className={`demo-toggle ${remediated ? 'ok' : ''}`}
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
          >
            {open
              ? remediated
                ? 'Hide check'
                : 'Hide exploit'
              : remediated
              ? '▸ Verify patch'
              : '▸ Live exploit'}
          </button>
        ) : (
          <span className="no-demo">
            {remediated ? 'patched (no probe)' : 'no live demo'}
          </span>
        )}
      </div>

      {open && exploit && (
        <div className="console">
          <div className="console-hint">
            {remediated
              ? 'Replaying the original attack against the patched build — it should now be refused or handled safely.'
              : exploit.hint}
          </div>
          <div className="console-cmd mono">
            <span className="method">{exploit.method}</span> {exploit.path}
          </div>
          <button className="run-btn" onClick={fire} disabled={running}>
            {running
              ? 'running…'
              : remediated
              ? 'Replay attack (expect safe result)'
              : `Run ${exploit.label.split('—')[0].trim()}`}
          </button>

          {result && (
            <div className={`console-out ${errored && !remediated ? 'err' : ''}`}>
              <div className="console-status">
                {remediated ? (
                  <span className="status-pill ok">🛡 attack neutralized</span>
                ) : (
                  <span
                    className={`status-pill ${
                      result.status >= 200 && result.status < 400 ? 'ok' : 'warn'
                    }`}
                  >
                    {result.status} {result.statusText}
                  </span>
                )}
                <span className="mono dim">
                  {result.request} · {result.status} {result.statusText}
                </span>
                {result.elapsed > 0 && <span className="dim">{result.elapsed}ms</span>}
              </div>
              <pre className="mono">{result.body}</pre>
            </div>
          )}
        </div>
      )}
    </article>
  )
}

function sevColor(sev) {
  return {
    CRITICAL: '#f43f5e',
    HIGH: '#fb7139',
    MEDIUM: '#f5b13d',
    LOW: '#84cc16',
  }[sev]
}

function sevLabel(sev) {
  return { CRITICAL: 'Critical', HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' }[sev]
}
