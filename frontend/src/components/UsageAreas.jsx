import { useState, useEffect } from 'react';
import { getUsageAreas } from '../api.js';

function areaLabel(row) {
  const parts = [row.city, row.region, row.country].filter(Boolean);
  return parts.length ? parts.join(', ') : 'Unknown area';
}

export default function UsageAreas({ onBack }) {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getUsageAreas()
      .then((data) => setAreas(Array.isArray(data) ? data : []))
      .catch(() => setError('Failed to load usage data.'))
      .finally(() => setLoading(false));
  }, []);

  const total = areas.reduce((sum, a) => sum + a.count, 0);

  return (
    <div className="usage">
      <div className="page-heading">
        <h1 className="page-heading__title">Usage by Area</h1>
        <p className="page-heading__sub">Approximate locations where ExamSense has been used.</p>
      </div>

      {loading && <p className="usage__status">Loading…</p>}
      {error && <p className="usage__status usage__status--error">{error}</p>}

      {!loading && !error && areas.length === 0 && (
        <p className="usage__status">
          No usage recorded yet. Areas appear once people use the app over the internet —
          local and private IPs can't be mapped to a location.
        </p>
      )}

      {!loading && !error && areas.length > 0 && (
        <ul className="usage__list">
          {areas.map((row, i) => {
            const pct = total > 0 ? Math.round((row.count / total) * 100) : 0;
            return (
              <li key={`${row.country}-${row.region}-${row.city}-${i}`} className="usage__row">
                <div className="usage__row-top">
                  <span className="usage__area">{areaLabel(row)}</span>
                  <span className="usage__count">{row.count}</span>
                </div>
                <div className="usage__bar-bg">
                  <div className="usage__bar-fill" style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {onBack && (
        <button className="btn-ghost usage__back" onClick={onBack}>
          ← Back
        </button>
      )}
    </div>
  );
}
