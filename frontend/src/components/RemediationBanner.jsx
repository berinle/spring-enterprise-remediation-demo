export default function RemediationBanner({ remediated, cost = [] }) {
  if (!remediated) {
    return (
      <section className="remediation">
        <div className="rem-icon">↺</div>
        <div className="rem-body">
          <h2>Future state — one-command remediation</h2>
          <p>
            A companion worktree will rebuild this exact application against the{' '}
            <strong>Broadcom Spring Enterprise</strong> repository, swapping every
            pinned artifact for a patched, commercially-supported release.
          </p>
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="remediation is-patched">
        <div className="rem-icon">✓</div>
        <div className="rem-body">
          <h2>0 active CVEs — via the open-source upgrade path</h2>
          <p>
            Spring Boot <strong>4.1.0</strong> with every removable version pin
            deleted closes all twelve findings. Ten closed because a version moved;{' '}
            <strong>commons-text</strong> is outside the Boot BOM so its pin could
            not be removed at all, and <strong>commons-collections</strong> was
            closed by deleting an unused dependency.
          </p>
        </div>
        <div className="rem-badge mono">12 / 12 closed</div>
      </section>

      {cost.length > 0 && (
        <section className="cost-panel">
          <div className="cost-head">
            <span className="cost-icon">⚠</span>
            <div>
              <h2>What this upgrade cost</h2>
              <p className="cost-sub">
                None of the following was required on the enterprise path — that
                build stays on 2.7.x and changes no application code.
              </p>
            </div>
          </div>
          <ul className="cost-list">
            {cost.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
          <div className="cost-foot mono">
            Boot 2→4 · Spring 5→7 · Security 5→7 · Jackson 2→3 · Cloud 2021→2025
          </div>
        </section>
      )}
    </>
  )
}
