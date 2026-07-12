import type { PageServerLoad } from './$types';
import { getFeed } from '$lib/server/feed';

export const load: PageServerLoad = async () => {
	return { feed: getFeed() };
};
