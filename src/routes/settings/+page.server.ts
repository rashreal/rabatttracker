import type { PageServerLoad } from './$types';
import { getSettings } from '$lib/server/settings';

export const load: PageServerLoad = async () => {
	return { settings: getSettings() };
};
