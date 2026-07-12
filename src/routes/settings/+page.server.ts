import type { PageServerLoad } from './$types';
import { getSettings } from '$lib/server/settings';
import { getLastScrapeRun } from '$lib/server/scrape-runs';

export const load: PageServerLoad = async () => {
	return { settings: getSettings(), lastScrapeRun: getLastScrapeRun() ?? null };
};
