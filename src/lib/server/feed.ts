import { and, eq, gte, asc } from 'drizzle-orm';
import { db } from './db/client';
import { priceObservations } from './db/schema';
import { listWatchedProducts, type WatchedProduct } from './watchlist';
import { computeIndicator, type PriceIndicator } from './price-indicator';
import type { PriceObservation } from './price-observations';

export interface FeedItem {
	product: WatchedProduct;
	currentOffers: PriceObservation[];
	indicator: PriceIndicator | null;
}

/**
 * "Current" offers are those whose validity window hasn't ended yet.
 * Regional scoping happens upstream via the zip code passed to the offer
 * provider (Marktguru doesn't expose per-store coordinates, so there is no
 * separate client-side distance_km filter here yet - see README).
 */
export function getFeed(): FeedItem[] {
	const products = listWatchedProducts();
	const today = new Date().toISOString().slice(0, 10);

	return products.map((product) => {
		const currentOffers = db
			.select()
			.from(priceObservations)
			.where(
				and(eq(priceObservations.watchedProductId, product.id), gte(priceObservations.validTo, today))
			)
			.orderBy(asc(priceObservations.priceCents))
			.all();

		const indicator =
			currentOffers.length > 0 ? computeIndicator(currentOffers[0].priceCents, product.id) : null;

		return { product, currentOffers, indicator };
	});
}
