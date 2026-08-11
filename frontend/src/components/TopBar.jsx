export default function TopBar({ build, remediated }) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className={`brand-mark ${remediated ? 'ok' : ''}`}>T</div>
        <div>
          <div className="brand-name">
            Tanzu Platform{' '}
            <span>· {remediated ? 'Remediated Build' : 'Vulnerability Demo'}</span>
          </div>
          <div className="brand-sub">
            Broadcom Spring Enterprise · supply-chain remediation showcase
          </div>
        </div>
      </div>

      <div className={`build-chip ${remediated ? 'ok' : ''}`}>
        <span className={`dot ${remediated ? 'ok' : ''}`} />
        <span className="mono">{build.appVersion}</span>
        <span className="sep">|</span>
        <span className="mono">Boot {build.springBootVersion}</span>
        <span className="sep">|</span>
        <span className="mono">Spring {build.springFrameworkVersion}</span>
        <span className="sep">|</span>
        <span className="mono">JDK {build.javaVersion}</span>
      </div>
    </header>
  )
}
