import { createClient } from '@libsql/client';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Turso (hosted SQLite) in production, so data survives restarts and redeploys.
// Without TURSO_DATABASE_URL it falls back to a local SQLite file for development.
const db = createClient({
  url: process.env.TURSO_DATABASE_URL || `file:${join(__dirname, 'examsense.db')}`,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export async function initDb() {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      raw_text TEXT,
      topics_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      note_id INTEGER,
      topic_title TEXT,
      question_text TEXT,
      options_json TEXT,
      correct_answer TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER,
      user_answer TEXT,
      is_correct INTEGER,
      attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS usage_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event TEXT,
      country TEXT,
      region TEXT,
      city TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// libsql returns row ids as BigInt, which res.json() cannot serialize.
export const rowId = (result) => Number(result.lastInsertRowid);

// Plain objects keyed by column name, safe to send with res.json().
export const plainRows = (result) =>
  result.rows.map((row) => Object.fromEntries(result.columns.map((c) => [c, row[c]])));

export default db;
