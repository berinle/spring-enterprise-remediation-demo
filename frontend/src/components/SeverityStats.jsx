const CELLS = [
  { key: 'CRITICAL', label: 'Critical', cls: 'crit', countKey: 'critical' },
  { key: 'HIGH', label: 'High', cls: 'high', countKey: 'high' },
  { key: 'MEDIUM', label: 'Medium', cls: 'med', countKey: 'medium' },
  { key: 'LOW', label: 'Low', cls: 'low', countKey: 'low' },
]

export default function SeverityStats({ counts, active, onSelect, remediated }) {
  return (
    <section className={`stats ${remediated ? 'ok' : ''}`}>
      {CELLS.map((c) => {
        const isActive = active === c.key
        const n = counts[c.countKey] ?? 0
        return (
          <button
            key={c.key}
            className={`stat ${c.cls} ${isActive ? 'active' : ''} ${remediated ? 'ok' : ''}`}
            onClick={() => onSelect(isActive ? 'ALL' : c.key)}
            aria-pressed={isActive}
          >
            <div className="stat-num">
              {remediated ? <span className="was">0</span> : n}
            </div>
            <div className="stat-label">
              {c.label}
              {remediated && n > 0 && <span className="resolved-tag">{n} resolved</span>}
            </div>
            <div className="stat-hint">
              {remediated
                ? 'patched'
                : isActive
                ? 'filtering'
                : 'click to filter'}
            </div>
          </button>
        )
      })}
    </section>
  )
}
