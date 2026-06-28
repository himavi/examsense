import { Router } from 'express';
import db from '../db/db.js';
import { locate } from '../services/geo.js';

const router = Router();

// Current caller's area (live lookup).
router.get('/me', (req, res) => {
  res.json(locate(req) ?? { country: null, region: null, city: null });
});

// Aggregated areas where the app has been used.
router.get('/areas', (req, res) => {
  const rows = db.prepare(`
    SELECT country, region, city, COUNT(*) AS count
    FROM usage_events
    GROUP BY country, region, city
    ORDER BY count DESC
  `).all();
  res.json(rows);
});

export default router;
