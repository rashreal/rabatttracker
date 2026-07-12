import type { PageServerLoad } from './$types';
import { listWatchedProducts } from '$lib/server/watchlist';

export const load: PageServerLoad = async () => {
	return { watchlist: listWatchedProducts() };
};
