import { Router } from 'express';
import db from '../db/db.js';
import { locate } from '../services/geo.js';

const router = Router();

// Gate admin-only analytics behind a secret key (set ADMIN_KEY in env).
function requireAdmin(req, res, next) {
  const provided = req.headers['x-admin-key'] || req.query.key;
  if (!process.env.ADMIN_KEY || provided !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Current caller's area (live lookup) — harmless, stays public.
router.get('/me', (req, res) => {
  res.json(locate(req) ?? { country: null, region: null, city: null });
});

// Aggregated areas where the app has been used — admin only.
router.get('/areas', requireAdmin, (req, res) => {
  const rows = db.prepare(`
    SELECT country, region, city, COUNT(*) AS count
    FROM usage_events
    GROUP BY country, region, city
    ORDER BY count DESC
  `).all();
  res.json(rows);
});

export default router;
