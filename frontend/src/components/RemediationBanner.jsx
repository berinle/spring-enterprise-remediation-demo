export default function RemediationBanner({ remediated }) {
  if (remediated) {
    return (
      <section className="remediation is-patched">
        <div className="rem-icon">✓</div>
        <div className="rem-body">
          <h2>Remediated — 0 active CVEs</h2>
          <p>
            This build was rebuilt against the{' '}
            <strong>Broadcom Spring Enterprise</strong> repository. Every pinned
            artifact now resolves to a patched, commercially-supported release —
            including <strong>Spring Boot 2.7.33</strong>, which is past OSS
            end-of-life and available only through the enterprise entitlement. The
            board is clear, with no change to application code.
          </p>
        </div>
        <div className="rem-badge mono">git diff = pom.xml only</div>
      </section>
    )
  }

  return (
    <section className="remediation">
      <div className="rem-icon">↺</div>
      <div className="rem-body">
        <h2>Future state — one-command remediation</h2>
        <p>
          A companion worktree will rebuild this exact application against the{' '}
          <strong>Broadcom Spring Enterprise</strong> repository, swapping every
          pinned artifact for a patched, commercially-supported release — clearing
          the board without touching a line of application code.
        </p>
      </div>
    </section>
  )
}
