import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { listObservationsForProduct } from '$lib/server/price-observations';

export const GET: RequestHandler = async ({ url }) => {
	const watchedProductId = Number(url.searchParams.get('watchedProductId'));
	if (!Number.isInteger(watchedProductId)) {
		throw error(400, 'watchedProductId ist erforderlich');
	}
	return json(listObservationsForProduct(watchedProductId));
};
