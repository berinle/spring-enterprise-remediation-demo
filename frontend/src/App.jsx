import { useEffect, useMemo, useState } from 'react'
import TopBar from './components/TopBar.jsx'
import Hero from './components/Hero.jsx'
import SeverityStats from './components/SeverityStats.jsx'
import FilterBar from './components/FilterBar.jsx'
import CveCard from './components/CveCard.jsx'
import RemediationBanner from './components/RemediationBanner.jsx'

export default function App() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [severityFilter, setSeverityFilter] = useState('ALL')
  const [query, setQuery] = useState('')

  useEffect(() => {
    let cancelled = false
    fetch('/api/dashboard')
      .then((r) => {
        if (!r.ok) throw new Error(`API returned ${r.status}`)
        return r.json()
      })
      .then((json) => !cancelled && setData(json))
      .catch((e) => !cancelled && setError(e.message))
    return () => {
      cancelled = true
    }
  }, [])

  const visible = useMemo(() => {
    if (!data) return []
    const q = query.trim().toLowerCase()
    return data.vulnerabilities.filter((v) => {
      const matchesSeverity = severityFilter === 'ALL' || v.severity === severityFilter
      const matchesQuery =
        !q ||
        v.cveId.toLowerCase().includes(q) ||
        v.title.toLowerCase().includes(q) ||
        v.component.toLowerCase().includes(q)
      return matchesSeverity && matchesQuery
    })
  }, [data, severityFilter, query])

  if (error) {
    return (
      <div className="state-screen">
        <div className="state-card error">
          <div className="state-icon">!</div>
          <h2>Could not load the CVE feed</h2>
          <p className="mono">{error}</p>
          <p className="dim">Is the Spring Boot app running on port 8080?</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="state-screen">
        <div className="state-card">
          <div className="spinner" />
          <h2>Scanning dependency graph…</h2>
          <p className="dim">Reading the vulnerability registry</p>
        </div>
      </div>
    )
  }

  const remediated = !!data.remediated

  return (
    <>
      <div className={`scanlines ${remediated ? 'ok' : ''}`} aria-hidden="true" />
      <TopBar build={data.build} remediated={remediated} />
      <main className="wrap">
        <Hero
          total={data.total}
          maxCvss={data.maxCvss}
          remediated={remediated}
          repository={data.build.repository}
        />
        <SeverityStats
          counts={data.counts}
          active={severityFilter}
          onSelect={setSeverityFilter}
          remediated={remediated}
        />
        <FilterBar
          query={query}
          onQuery={setQuery}
          shown={visible.length}
          total={data.total}
          severity={severityFilter}
          remediated={remediated}
          onClear={() => {
            setSeverityFilter('ALL')
            setQuery('')
          }}
        />
        <section className="cve-grid">
          {visible.map((v) => (
            <CveCard key={v.cveId} vuln={v} remediated={remediated} />
          ))}
        </section>
        {visible.length === 0 && (
          <div className="empty">No CVEs match the current filter.</div>
        )}
        <RemediationBanner remediated={remediated} />
      </main>
      <footer className="foot">
        <span>Tanzu Platform capability demo</span>
        <span className="dim">
          {remediated
            ? 'Remediated build · rebuilt against Broadcom Spring Enterprise'
            : 'Intentionally vulnerable · do not expose to untrusted networks'}
        </span>
      </footer>
    </>
  )
}
