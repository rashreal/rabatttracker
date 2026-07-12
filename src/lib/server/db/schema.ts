import { sqliteTable, text, integer, real, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const watchedProducts = sqliteTable('watched_products', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	displayName: text('display_name').notNull(),
	matchQuery: text('match_query').notNull(),
	matchBrand: text('match_brand'),
	// Marktguru's stable catalog product id (offer.product.id), used to recognize
	// the same product across scrape runs even though offer.id changes per leaflet.
	matchProductId: integer('match_product_id'),
	matchDescriptionKey: text('match_description_key').notNull(),
	// Free-text reminder of the intended pack size (e.g. "1 kg", "12x1L") - purely
	// informational, not used for matching/filtering (see marktguru.ts comments).
	matchSizeHint: text('match_size_hint'),
	active: integer('active', { mode: 'boolean' }).notNull().default(true),
	createdAt: text('created_at')
		.notNull()
		.default('CURRENT_TIMESTAMP')
});

export const priceObservations = sqliteTable(
	'price_observations',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		watchedProductId: integer('watched_product_id')
			.notNull()
			.references(() => watchedProducts.id, { onDelete: 'cascade' }),
		retailerName: text('retailer_name').notNull(),
		retailerId: text('retailer_id').notNull(),
		priceCents: integer('price_cents').notNull(),
		unitPriceText: text('unit_price_text'),
		description: text('description'),
		currency: text('currency').notNull().default('EUR'),
		validFrom: text('valid_from').notNull(),
		validTo: text('valid_to').notNull(),
		distanceKm: real('distance_km'),
		zipCodeQueried: text('zip_code_queried').notNull(),
		rawOfferJson: text('raw_offer_json'),
		observedAt: text('observed_at').notNull()
	},
	(table) => [
		uniqueIndex('price_observations_dedupe_idx').on(
			table.watchedProductId,
			table.retailerId,
			table.validFrom,
			table.validTo,
			table.priceCents
		)
	]
);

export const notificationsSent = sqliteTable(
	'notifications_sent',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		watchedProductId: integer('watched_product_id')
			.notNull()
			.references(() => watchedProducts.id, { onDelete: 'cascade' }),
		priceObservationId: integer('price_observation_id')
			.notNull()
			.references(() => priceObservations.id, { onDelete: 'cascade' }),
		notifiedAt: text('notified_at').notNull(),
		reason: text('reason', { enum: ['new_offer', 'price_drop', 'top_price'] }).notNull()
	},
	(table) => [
		uniqueIndex('notifications_sent_dedupe_idx').on(
			table.watchedProductId,
			table.priceObservationId
		)
	]
);

export const userSettings = sqliteTable('user_settings', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	homeAddressText: text('home_address_text'),
	homeZipCode: text('home_zip_code'),
	homeLat: real('home_lat'),
	homeLon: real('home_lon'),
	radiusKm: real('radius_km').notNull().default(15),
	notificationEnabled: integer('notification_enabled', { mode: 'boolean' })
		.notNull()
		.default(false),
	notifyOnNewOffer: integer('notify_on_new_offer', { mode: 'boolean' }).notNull().default(true),
	notifyOnPriceDropOnly: integer('notify_on_price_drop_only', { mode: 'boolean' })
		.notNull()
		.default(false),
	priceDropThresholdPct: real('price_drop_threshold_pct').notNull().default(10),
	updatedAt: text('updated_at').notNull()
});

export const pushSubscriptions = sqliteTable('push_subscriptions', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	endpoint: text('endpoint').notNull().unique(),
	p256dh: text('p256dh').notNull(),
	auth: text('auth').notNull(),
	deviceLabel: text('device_label'),
	createdAt: text('created_at').notNull()
});

export const scrapeRuns = sqliteTable('scrape_runs', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	startedAt: text('started_at').notNull(),
	finishedAt: text('finished_at'),
	success: integer('success', { mode: 'boolean' }),
	errorMessage: text('error_message'),
	offersIngestedCount: integer('offers_ingested_count').notNull().default(0)
});
