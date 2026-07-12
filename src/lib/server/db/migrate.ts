import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { env } from '$env/dynamic/private';
import { db } from './client';

let migrated = false;

// Resolved relative to process.cwd() (the project root in dev, and /app in the
// Docker image - see Dockerfile, which copies this folder to the same path).
export function runMigrations() {
	if (migrated) return;
	const migrationsFolder = env.MIGRATIONS_PATH || 'src/lib/server/db/migrations';
	migrate(db, { migrationsFolder });
	migrated = true;
}
