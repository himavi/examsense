import { useState, useEffect } from 'react';
import { getUsageAreas } from '../api.js';

function areaLabel(row) {
  const parts = [row.city, row.region, row.country].filter(Boolean);
  return parts.length ? parts.join(', ') : 'Unknown area';
}

export default function UsageAreas({ adminKey, onBack }) {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getUsageAreas(adminKey)
      .then((data) => setAreas(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.status === 401 ? 'unauthorized' : 'failed'))
      .finally(() => setLoading(false));
  }, [adminKey]);

  const total = areas.reduce((sum, a) => sum + a.count, 0);

  return (
    <div className="usage">
      <div className="page-heading">
        <h1 className="page-heading__title">Usage by Area</h1>
        <p className="page-heading__sub">Approximate locations where ExamSense has been used.</p>
      </div>

      {loading && <p className="usage__status">Loading…</p>}
      {error === 'unauthorized' && (
        <p className="usage__status usage__status--error">
          Not authorized. Open the site with your admin key, e.g. ?admin=YOUR_KEY
        </p>
      )}
      {error === 'failed' && <p className="usage__status usage__status--error">Failed to load usage data.</p>}

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
