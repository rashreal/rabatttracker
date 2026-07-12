import { eq, desc, sql } from 'drizzle-orm';
import { db } from './db/client';
import { priceObservations } from './db/schema';
import type { OfferResult } from './offer-providers/types';

export type PriceObservation = typeof priceObservations.$inferSelect;

/**
 * Upserts offers as price observations, deduped via the unique index on
 * (watchedProductId, retailerId, validFrom, validTo, priceCents). Returns
 * only the rows that were newly inserted this run (used for alerting).
 */
export function recordOffers(
	watchedProductId: number,
	offers: OfferResult[],
	zipCode: string
): PriceObservation[] {
	const observedAt = new Date().toISOString();
	const inserted: PriceObservation[] = [];

	for (const offer of offers) {
		const row = db
			.insert(priceObservations)
			.values({
				watchedProductId,
				retailerName: offer.retailerName,
				retailerId: offer.retailerId,
				priceCents: offer.priceCents,
				unitPriceText: offer.unitText,
				description: offer.description,
				currency: 'EUR',
				validFrom: offer.validFrom,
				validTo: offer.validTo,
				distanceKm: null,
				zipCodeQueried: zipCode,
				rawOfferJson: JSON.stringify(offer),
				observedAt
			})
			.onConflictDoNothing()
			.returning()
			.get();
		if (row) inserted.push(row);
	}

	return inserted;
}

export function listObservationsForProduct(watchedProductId: number): PriceObservation[] {
	return db
		.select()
		.from(priceObservations)
		.where(eq(priceObservations.watchedProductId, watchedProductId))
		.orderBy(desc(priceObservations.observedAt))
		.all();
}

/** Trailing-window stats used by the price indicator (see price-indicator.ts). */
export function getPriceStats(watchedProductId: number, sinceIso: string) {
	const row = db
		.select({
			min: sql<number>`MIN(${priceObservations.priceCents})`,
			max: sql<number>`MAX(${priceObservations.priceCents})`,
			avg: sql<number>`AVG(${priceObservations.priceCents})`,
			count: sql<number>`COUNT(*)`
		})
		.from(priceObservations)
		.where(
			sql`${priceObservations.watchedProductId} = ${watchedProductId} AND ${priceObservations.observedAt} >= ${sinceIso}`
		)
		.get();
	return row ?? { min: null, max: null, avg: null, count: 0 };
}
