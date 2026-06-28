import geoip from 'geoip-lite';
import db from '../db/db.js';

const insertEvent = db.prepare(
  'INSERT INTO usage_events (event, country, region, city) VALUES (?, ?, ?, ?)'
);

// Pull the real client IP (honors x-forwarded-for when behind a proxy).
export function getClientIp(req) {
  const fwd = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const ip = fwd || req.socket?.remoteAddress || '';
  return ip.replace(/^::ffff:/, ''); // strip IPv6-mapped IPv4 prefix
}

// Area-level location only (country / region / city) — approximate, no precise coords.
export function locate(req) {
  const geo = geoip.lookup(getClientIp(req));
  if (!geo) return null;
  return {
    country: geo.country || null,
    region: geo.region || null,
    city: geo.city || null,
    timezone: geo.timezone || null,
  };
}

// Record where an action happened, for usage analytics.
export function logUsage(req, event = 'note_created') {
  try {
    const loc = locate(req);
    insertEvent.run(event, loc?.country ?? null, loc?.region ?? null, loc?.city ?? null);
    return loc;
  } catch {
    return null; // never let analytics break the request
  }
}
