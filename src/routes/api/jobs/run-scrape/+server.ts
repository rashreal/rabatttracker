import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { runScrapeJob } from '$lib/server/jobs/scrape-offers';

export const POST: RequestHandler = async () => {
	const summary = await runScrapeJob();
	return json(summary);
};
