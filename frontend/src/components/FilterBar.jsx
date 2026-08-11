export default function FilterBar({ query, onQuery, shown, total, severity, onClear }) {
  const filtered = severity !== 'ALL' || query.trim() !== ''
  return (
    <section className="filterbar">
      <div className="filter-left">
        <h2>Detected vulnerabilities</h2>
        <span className="dim">
          showing <b>{shown}</b> of {total} · sorted by CVSS
        </span>
      </div>
      <div className="filter-right">
        <div className="search">
          <span className="search-icon">⌕</span>
          <input
            type="text"
            placeholder="Filter by CVE, title or component…"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
          />
        </div>
        {filtered && (
          <button className="clear-btn" onClick={onClear}>
            Clear
          </button>
        )}
      </div>
    </section>
  )
}
