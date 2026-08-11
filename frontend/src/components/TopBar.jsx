export default function TopBar({ build }) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark">T</div>
        <div>
          <div className="brand-name">
            Tanzu Platform <span>· Vulnerability Demo</span>
          </div>
          <div className="brand-sub">
            Broadcom Spring Enterprise · supply-chain remediation showcase
          </div>
        </div>
      </div>

      <div className="build-chip">
        <span className="dot" />
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
