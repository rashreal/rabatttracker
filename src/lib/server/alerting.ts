import { eq, and } from 'drizzle-orm';
import { db } from './db/client';
import { notificationsSent } from './db/schema';
import { computeIndicator } from './price-indicator';
import { sendPushToAll } from './push';
import type { WatchedProduct } from './watchlist';
import type { PriceObservation } from './price-observations';
import type { UserSettings } from './settings';

/**
 * Decides whether newly-inserted price observations warrant a push
 * notification, sends it, and records the send in notifications_sent to
 * guarantee no duplicate alert for the same offer.
 */
export async function maybeNotify(
	product: WatchedProduct,
	newObservations: PriceObservation[],
	settings: UserSettings
): Promise<void> {
	if (!settings.notificationEnabled || newObservations.length === 0) return;

	for (const obs of newObservations) {
		const already = db
			.select()
			.from(notificationsSent)
			.where(
				and(
					eq(notificationsSent.watchedProductId, product.id),
					eq(notificationsSent.priceObservationId, obs.id)
				)
			)
			.get();
		if (already) continue;

		const indicator = computeIndicator(obs.priceCents, product.id);

		let shouldNotify = false;
		let reason: 'new_offer' | 'price_drop' | 'top_price' = 'new_offer';

		if (settings.notifyOnPriceDropOnly) {
			if (indicator.avgCents != null) {
				const dropPct = ((indicator.avgCents - obs.priceCents) / indicator.avgCents) * 100;
				if (dropPct >= settings.priceDropThresholdPct) {
					shouldNotify = true;
					reason = 'price_drop';
				}
			}
		} else if (settings.notifyOnNewOffer) {
			shouldNotify = true;
			reason = indicator.label === 'top' ? 'top_price' : 'new_offer';
		}

		if (!shouldNotify) continue;

		try {
			await sendPushToAll({
				title: `${product.displayName}: ${indicator.displayText}`,
				body: `${(obs.priceCents / 100).toFixed(2)} € bei ${obs.retailerName}`,
				url: `/product/${product.id}`
			});
		} catch (e) {
			console.error('Push notification failed', e);
			continue; // don't mark as sent if delivery failed - retry next scrape run
		}

		db.insert(notificationsSent)
			.values({
				watchedProductId: product.id,
				priceObservationId: obs.id,
				notifiedAt: new Date().toISOString(),
				reason
			})
			.run();
	}
}
