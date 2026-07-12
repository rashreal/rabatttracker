import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { geocodeAddress } from '$lib/server/geocode';

export const POST: RequestHandler = async ({ request }) => {
	const { query } = await request.json();
	if (typeof query !== 'string' || query.trim().length === 0) {
		throw error(400, 'query is required');
	}

	const result = await geocodeAddress(query.trim());
	if (!result) {
		throw error(404, 'Keine Adresse gefunden');
	}

	return json(result);
};
