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

export default function Hero({ total, maxCvss, remediated, repository }) {
  const animatedTotal = Math.round(useCountUp(total))
  const animatedScore = useCountUp(maxCvss)

  return (
    <section className={`hero ${remediated ? 'remediated' : ''}`}>
      <div className="hero-left">
        {remediated ? (
          <div className="risk-pill ok">
            <span className="check">✓</span> 0 CVEs — OSS LATEST, SPRING BOOT 4.1.0
          </div>
        ) : (
          <div className="risk-pill">
            <span className="pulse" /> ACTIVE RISK — UNPATCHED BUILD
          </div>
        )}

        {remediated ? (
          <>
            <h1>
              All <span className="count ok">{animatedTotal}</span> CVEs closed —
              the hard way.
            </h1>
            <p className="lede">
              This is the pure open-source path: <strong>Spring Boot 4.1.0</strong>{' '}
              with every version pin deleted. It does reach zero — but it crossed
              four major versions, needed a new JDK and Maven, and forced an
              application-code rewrite. The same twelve CVEs close on{' '}
              <strong>Spring Boot 2.7.33</strong> from the Broadcom Spring
              Enterprise repository with a dependency-only diff.
            </p>
          </>
        ) : (
          <>
            <h1>
              This application ships with{' '}
              <span className="count">{animatedTotal}</span> known CVEs.
            </h1>
            <p className="lede">
              Every dependency below is intentionally pinned to a vulnerable
              version. Point your scanner — or the{' '}
              <strong>Tanzu Application Catalog</strong> — at this build to watch
              the findings light up, then rebuild against the{' '}
              <strong>Broadcom Spring Enterprise</strong> repository to clear them.
            </p>
          </>
        )}

        {remediated && repository && (
          <div className="repo-chip mono">↳ {repository}</div>
        )}

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

      <div className={`score-card ${remediated ? 'ok' : ''}`}>
        <div className="score-label">
          {remediated ? 'Active exposure' : 'Max CVSS on this build'}
        </div>
        <div
          className={`score-ring ${remediated ? 'ok' : ''}`}
          style={{ '--score': animatedScore.toFixed(2) }}
          role="img"
          aria-label={
            remediated
              ? 'No active exposure'
              : `Maximum CVSS score ${maxCvss.toFixed(1)} out of 10`
          }
        >
          <div className="score-inner">
            <div className="score-num">{animatedScore.toFixed(1)}</div>
            <div className="score-of">/ 10</div>
          </div>
        </div>
        <div className={`score-note ${remediated ? 'ok' : ''}`}>
          {remediated ? 'NO ACTIVE EXPOSURE' : 'CRITICAL EXPOSURE'}
        </div>
      </div>
    </section>
  )
}
