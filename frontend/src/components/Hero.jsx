import { useEffect, useState } from 'react'

/** Counts up to `value` once on mount — small bit of polish for the demo. */
function useCountUp(value, ms = 900) {
  const [n, setN] = useState(0)
  useEffect(() => {
    let raf
    const start = performance.now()
    const tick = (now) => {
      const p = Math.min(1, (now - start) / ms)
      const eased = 1 - Math.pow(1 - p, 3)
      setN(value * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, ms])
  return n
}

export default function Hero({ total, maxCvss }) {
  const animatedTotal = Math.round(useCountUp(total))
  const animatedScore = useCountUp(maxCvss)

  return (
    <section className="hero">
      <div className="hero-left">
        <div className="risk-pill">
          <span className="pulse" /> ACTIVE RISK — UNPATCHED BUILD
        </div>
        <h1>
          This application ships with{' '}
          <span className="count">{animatedTotal}</span> known CVEs.
        </h1>
        <p className="lede">
          Every dependency below is intentionally pinned to a vulnerable version.
          Point your scanner — or the <strong>Tanzu Application Catalog</strong> —
          at this build to watch the findings light up, then rebuild against the{' '}
          <strong>Broadcom Spring Enterprise</strong> repository to clear them.
        </p>
        <div className="cta-row">
          <a className="btn" href="/api/dashboard" target="_blank" rel="noopener">
            CVE feed (JSON)
          </a>
          <a className="btn" href="/actuator" target="_blank" rel="noopener">
            Actuator
          </a>
          <a className="btn" href="/h2-console" target="_blank" rel="noopener">
            H2 console
          </a>
        </div>
      </div>

      <div className="score-card">
        <div className="score-label">Max CVSS on this build</div>
        <div
          className="score-ring"
          style={{ '--score': animatedScore.toFixed(2) }}
          role="img"
          aria-label={`Maximum CVSS score ${maxCvss.toFixed(1)} out of 10`}
        >
          <div className="score-inner">
            <div className="score-num">{animatedScore.toFixed(1)}</div>
            <div className="score-of">/ 10</div>
          </div>
        </div>
        <div className="score-note">CRITICAL EXPOSURE</div>
      </div>
    </section>
  )
}
