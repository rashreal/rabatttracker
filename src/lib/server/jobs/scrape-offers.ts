import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { watchedProducts, scrapeRuns } from '../db/schema';
import { activeOfferProvider } from '../offer-providers';
import { getSettings } from '../settings';
import { recordOffers } from '../price-observations';
import { maybeNotify } from '../alerting';

export interface ScrapeRunSummary {
	success: boolean;
	offersIngested: number;
	errors: string[];
}

export async function runScrapeJob(): Promise<ScrapeRunSummary> {
	const startedAt = new Date().toISOString();
	const run = db.insert(scrapeRuns).values({ startedAt }).returning().get();

	let offersIngested = 0;
	const errors: string[] = [];

	const settings = getSettings();
	if (!settings.homeZipCode) {
		errors.push('Keine PLZ in den Einstellungen gesetzt - Scrape übersprungen.');
	} else {
		const products = db
			.select()
			.from(watchedProducts)
			.where(eq(watchedProducts.active, true))
			.all();

		for (const product of products) {
			try {
				const offers = await activeOfferProvider.fetchOffersForProduct(
					{
						query: product.matchQuery,
						productId: product.matchProductId,
						descriptionKey: product.matchDescriptionKey
					},
					settings.homeZipCode
				);
				const inserted = recordOffers(product.id, offers, settings.homeZipCode);
				offersIngested += inserted.length;
				await maybeNotify(product, inserted, settings);
			} catch (e) {
				errors.push(`${product.displayName}: ${e instanceof Error ? e.message : 'Fehler'}`);
			}
		}
	}

	const success = errors.length === 0;
	db.update(scrapeRuns)
		.set({
			finishedAt: new Date().toISOString(),
			success,
			errorMessage: errors.length > 0 ? errors.join('; ') : null,
			offersIngestedCount: offersIngested
		})
		.where(eq(scrapeRuns.id, run.id))
		.run();

	return { success, offersIngested, errors };
}
