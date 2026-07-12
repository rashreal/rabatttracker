CREATE TABLE `notifications_sent` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`watched_product_id` integer NOT NULL,
	`price_observation_id` integer NOT NULL,
	`notified_at` text NOT NULL,
	`reason` text NOT NULL,
	FOREIGN KEY (`watched_product_id`) REFERENCES `watched_products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`price_observation_id`) REFERENCES `price_observations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notifications_sent_dedupe_idx` ON `notifications_sent` (`watched_product_id`,`price_observation_id`);--> statement-breakpoint
CREATE TABLE `price_observations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`watched_product_id` integer NOT NULL,
	`retailer_name` text NOT NULL,
	`retailer_id` text NOT NULL,
	`price_cents` integer NOT NULL,
	`unit_price_text` text,
	`currency` text DEFAULT 'EUR' NOT NULL,
	`valid_from` text NOT NULL,
	`valid_to` text NOT NULL,
	`distance_km` real,
	`zip_code_queried` text NOT NULL,
	`raw_offer_json` text,
	`observed_at` text NOT NULL,
	FOREIGN KEY (`watched_product_id`) REFERENCES `watched_products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `price_observations_dedupe_idx` ON `price_observations` (`watched_product_id`,`retailer_id`,`valid_from`,`valid_to`,`price_cents`);--> statement-breakpoint
CREATE TABLE `push_subscriptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` text NOT NULL,
	`device_label` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `push_subscriptions_endpoint_unique` ON `push_subscriptions` (`endpoint`);--> statement-breakpoint
CREATE TABLE `scrape_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`started_at` text NOT NULL,
	`finished_at` text,
	`success` integer,
	`error_message` text,
	`offers_ingested_count` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`home_address_text` text,
	`home_zip_code` text,
	`home_lat` real,
	`home_lon` real,
	`radius_km` real DEFAULT 15 NOT NULL,
	`notification_enabled` integer DEFAULT false NOT NULL,
	`notify_on_new_offer` integer DEFAULT true NOT NULL,
	`notify_on_price_drop_only` integer DEFAULT false NOT NULL,
	`price_drop_threshold_pct` real DEFAULT 10 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `watched_products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`display_name` text NOT NULL,
	`match_query` text NOT NULL,
	`match_brand` text,
	`match_description_key` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
