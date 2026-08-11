const CELLS = [
  { key: 'CRITICAL', label: 'Critical', cls: 'crit', countKey: 'critical' },
  { key: 'HIGH', label: 'High', cls: 'high', countKey: 'high' },
  { key: 'MEDIUM', label: 'Medium', cls: 'med', countKey: 'medium' },
  { key: 'LOW', label: 'Low', cls: 'low', countKey: 'low' },
]

export default function SeverityStats({ counts, active, onSelect }) {
  return (
    <section className="stats">
      {CELLS.map((c) => {
        const isActive = active === c.key
        return (
          <button
            key={c.key}
            className={`stat ${c.cls} ${isActive ? 'active' : ''}`}
            onClick={() => onSelect(isActive ? 'ALL' : c.key)}
            aria-pressed={isActive}
          >
            <div className="stat-num">{counts[c.countKey] ?? 0}</div>
            <div className="stat-label">{c.label}</div>
            <div className="stat-hint">{isActive ? 'filtering' : 'click to filter'}</div>
          </button>
        )
      })}
    </section>
  )
}
