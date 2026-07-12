import { desc } from 'drizzle-orm';
import { db } from './db/client';
import { scrapeRuns } from './db/schema';

export type ScrapeRun = typeof scrapeRuns.$inferSelect;

export function getLastScrapeRun(): ScrapeRun | undefined {
	return db.select().from(scrapeRuns).orderBy(desc(scrapeRuns.id)).limit(1).get();
}
