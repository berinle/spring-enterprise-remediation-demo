import { useState } from 'react'

export default function RemediationBanner() {
  const [patched, setPatched] = useState(false)

  return (
    <section className={`remediation ${patched ? 'is-patched' : ''}`}>
      <div className="rem-icon">{patched ? '✓' : '↺'}</div>
      <div className="rem-body">
        <h2>{patched ? 'Remediated build — 0 known CVEs' : 'Future state — one-command remediation'}</h2>
        <p>
          {patched ? (
            <>
              Rebuilt against the <strong>Broadcom Spring Enterprise</strong> repository:
              every pinned artifact is replaced with a patched, commercially-supported
              release — the board is clear, with no change to application code.
            </>
          ) : (
            <>
              A companion worktree will rebuild this exact application against the{' '}
              <strong>Broadcom Spring Enterprise</strong> repository, swapping every
              pinned artifact for a patched, commercially-supported release — clearing
              the board without touching a line of application code.
            </>
          )}
        </p>
      </div>
      <button
        className="rem-toggle"
        onClick={() => setPatched((p) => !p)}
      >
        {patched ? 'Show vulnerable state' : 'Preview patched state'}
      </button>
    </section>
  )
}
