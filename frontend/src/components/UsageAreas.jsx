import { useState, useEffect } from 'react';
import { getUsageAreas } from '../api.js';
import { Icon, Meter, Spinner } from './ui';

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
      <header className="page-heading">
        <p className="eyebrow">Admin</p>
        <h1 className="page-heading__title">Usage by area</h1>
        <p className="page-heading__sub">Approximate locations where ExamSense has been used.</p>
      </header>

      <div aria-live="polite">
        {loading && (
          <p className="usage__status">
            <Spinner /> Loading…
          </p>
        )}
        {error === 'unauthorized' && (
          <div className="alert alert--error" role="alert">
            <Icon name="alert" />
            <p className="alert__body">Not authorized. Open the site with your admin key, e.g. ?admin=YOUR_KEY</p>
          </div>
        )}
        {error === 'failed' && (
          <div className="alert alert--error" role="alert">
            <Icon name="alert" />
            <p className="alert__body">Failed to load usage data.</p>
          </div>
        )}
      </div>

      {!loading && !error && areas.length === 0 && (
        <div className="empty card">
          <p>
            No usage recorded yet. Areas appear once people use the app over the internet —
            local and private IPs can&apos;t be mapped to a location.
          </p>
        </div>
      )}

      {!loading && !error && areas.length > 0 && (
        <ul className="usage__list card">
          {areas.map((row, i) => {
            const share = total > 0 ? row.count / total : 0;
            return (
              <li key={`${row.country}-${row.region}-${row.city}-${i}`} className="usage__row">
                <div className="usage__row-top">
                  <span className="usage__area">{areaLabel(row)}</span>
                  <span className="usage__count">{row.count}</span>
                </div>
                <Meter value={share} label={`${areaLabel(row)} share of usage`} size="sm" />
              </li>
            );
          })}
        </ul>
      )}

      {onBack && (
        <div className="page-actions">
          <button type="button" className="btn btn--ghost" onClick={onBack}>
            <Icon name="arrowLeft" size={16} /> Back
          </button>
        </div>
      )}
    </div>
  );
}
