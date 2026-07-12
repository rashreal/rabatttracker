import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getFeed } from '$lib/server/feed';

export const GET: RequestHandler = async () => {
	return json(getFeed());
};
