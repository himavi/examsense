import { useEffect, useState } from 'react';

/* Small shared presentational pieces. No data fetching lives here. */

export function LogoMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="8" fill="var(--accent)" />
      <path d="M8.5 10.5h15M8.5 16h8" stroke="var(--on-accent)" strokeWidth="2.4" strokeLinecap="round" />
      <path
        d="M16.5 21.5l3 3 5.5-6.5"
        stroke="var(--on-accent)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const ICONS = {
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  x: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowLeft: <path d="M19 12H5M11 6l-6 6 6 6" />,
  refresh: <path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6" />,
  doc: <path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 7 20V3.5zM14 3.5V8h4M10 12.5h5M10 16h5" />,
  layers: <path d="M12 4l8 4-8 4-8-4 8-4zM4 12l8 4 8-4M4 16l8 4 8-4" />,
  chart: <path d="M4 20h16M7 16v-4M12 16V8M17 16v-7" />,
  bulb: <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.8V16h5v-.3c0-.7.4-1.4 1-1.8A6 6 0 0 0 12 3z" />,
  alert: <path d="M12 8v5M12 16.5v.5M10.3 4.3L3.2 17a2 2 0 0 0 1.7 3h14.2a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0z" />,
  github: (
    <path d="M9 19c-4 1.3-4-2-6-2.5M15 21v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12 12 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21" />
  ),
};

export function Icon({ name, size = 18, className = '' }) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICONS[name]}
    </svg>
  );
}

export function Spinner({ size = 16 }) {
  return <span className="spinner" style={{ width: size, height: size }} aria-hidden="true" />;
}

export function Meter({ value, tone = 'accent', label, size = 'md' }) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  return (
    <div
      className={`meter meter--${tone} meter--${size}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-label={label}
    >
      <div className="meter__fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

/**
 * Status line for slow AI calls. Screen readers hear `announce` once; sighted
 * users see a gentle sequence of steps plus a reassurance after a while.
 */
export function AiWorking({ announce, steps = [], slowAfter = 9 }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 500);
    return () => clearInterval(id);
  }, []);

  const step = steps.length ? steps[Math.min(steps.length - 1, Math.floor(elapsed / 2.5))] : announce;

  return (
    <div className="ai-working">
      <span className="visually-hidden" role="status">
        {announce}
      </span>
      <div className="ai-working__row" aria-hidden="true">
        <Spinner />
        <span className="ai-working__step" key={step}>
          {step}
        </span>
        <span className="ai-working__time">{elapsed}s</span>
      </div>
      {elapsed >= slowAfter && (
        <p className="ai-working__slow" aria-hidden="true">
          Still working. The model occasionally needs up to 20 seconds.
        </p>
      )}
    </div>
  );
}

export function Skeleton({ width = '100%', height = 12, className = '' }) {
  return <span className={`skeleton ${className}`} style={{ width, height }} aria-hidden="true" />;
}
