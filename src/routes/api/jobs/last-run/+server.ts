import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getLastScrapeRun } from '$lib/server/scrape-runs';

export const GET: RequestHandler = async () => {
	return json(getLastScrapeRun() ?? null);
};
