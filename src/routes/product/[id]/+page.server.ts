import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getWatchedProduct } from '$lib/server/watchlist';
import { listObservationsForProduct } from '$lib/server/price-observations';
import { computeIndicator } from '$lib/server/price-indicator';

export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.id);
	const product = Number.isInteger(id) ? getWatchedProduct(id) : undefined;
	if (!product) throw error(404, 'Produkt nicht gefunden');

	const observations = listObservationsForProduct(id);
	const indicator = observations.length > 0 ? computeIndicator(observations[0].priceCents, id) : null;

	return { product, observations, indicator };
};
