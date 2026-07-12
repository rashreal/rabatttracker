import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { listWatchedProducts, addWatchedProduct } from '$lib/server/watchlist';
import { descriptionKeyFor } from '$lib/server/offer-providers/marktguru';

export const GET: RequestHandler = async () => {
	return json(listWatchedProducts());
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();

	if (typeof body.displayName !== 'string' || body.displayName.trim().length === 0) {
		throw error(400, 'displayName ist erforderlich');
	}
	if (typeof body.matchQuery !== 'string' || body.matchQuery.trim().length === 0) {
		throw error(400, 'matchQuery ist erforderlich');
	}

	const matchBrand: string | null = typeof body.matchBrand === 'string' ? body.matchBrand : null;
	const matchProductId: number | null =
		typeof body.matchProductId === 'number' ? body.matchProductId : null;
	const matchDescriptionKey =
		typeof body.matchDescriptionKey === 'string' && body.matchDescriptionKey.length > 0
			? body.matchDescriptionKey
			: descriptionKeyFor(matchBrand, body.displayName);

	const created = addWatchedProduct({
		displayName: body.displayName.trim(),
		matchQuery: body.matchQuery.trim(),
		matchBrand,
		matchProductId,
		matchDescriptionKey
	});

	return json(created, { status: 201 });
};
