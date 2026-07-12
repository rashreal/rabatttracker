import cron from 'node-cron';
import { building } from '$app/environment';
import { runMigrations } from '$lib/server/db/migrate';
import { runScrapeJob } from '$lib/server/jobs/scrape-offers';

if (!building) {
	runMigrations();

	// Daily at 06:00 server time - flyers typically renew weekly, daily polling
	// is enough to catch new ones promptly without hammering the source.
	cron.schedule('0 6 * * *', () => {
		runScrapeJob().catch((e) => console.error('Scheduled scrape job failed', e));
	});
}
