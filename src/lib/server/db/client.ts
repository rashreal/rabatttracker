import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { env } from '$env/dynamic/private';
import * as schema from './schema';

const dbPath = env.DB_PATH || 'data/rabatttracker.db';

// better-sqlite3 requires the parent directory to already exist. This also
// runs during SvelteKit's build-time module analysis (which imports every
// server module), so it must be safe to call even when nothing has run yet.
mkdirSync(dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });
