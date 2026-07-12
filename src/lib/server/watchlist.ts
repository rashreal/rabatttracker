import { eq, desc } from 'drizzle-orm';
import { db } from './db/client';
import { watchedProducts } from './db/schema';

export type WatchedProduct = typeof watchedProducts.$inferSelect;

export function listWatchedProducts(): WatchedProduct[] {
	return db.select().from(watchedProducts).orderBy(desc(watchedProducts.createdAt)).all();
}

export function getWatchedProduct(id: number): WatchedProduct | undefined {
	return db.select().from(watchedProducts).where(eq(watchedProducts.id, id)).get();
}

export interface NewWatchedProduct {
	displayName: string;
	matchQuery: string;
	matchBrand: string | null;
	matchProductId: number | null;
	matchDescriptionKey: string;
	matchSizeHint: string | null;
}

export function addWatchedProduct(input: NewWatchedProduct): WatchedProduct {
	const result = db
		.insert(watchedProducts)
		.values({
			displayName: input.displayName,
			matchQuery: input.matchQuery,
			matchBrand: input.matchBrand,
			matchProductId: input.matchProductId,
			matchDescriptionKey: input.matchDescriptionKey,
			matchSizeHint: input.matchSizeHint,
			createdAt: new Date().toISOString()
		})
		.returning()
		.get();
	return result;
}

export function removeWatchedProduct(id: number): void {
	db.delete(watchedProducts).where(eq(watchedProducts.id, id)).run();
}

export function setWatchedProductActive(id: number, active: boolean): void {
	db.update(watchedProducts).set({ active }).where(eq(watchedProducts.id, id)).run();
}
