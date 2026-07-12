import { eq } from 'drizzle-orm';
import { db } from './db/client';
import { userSettings } from './db/schema';

export type UserSettings = typeof userSettings.$inferSelect;

const SETTINGS_ID = 1;

export function getSettings(): UserSettings {
	const existing = db.select().from(userSettings).where(eq(userSettings.id, SETTINGS_ID)).get();
	if (existing) return existing;

	db.insert(userSettings)
		.values({ id: SETTINGS_ID, updatedAt: new Date().toISOString() })
		.run();

	return db.select().from(userSettings).where(eq(userSettings.id, SETTINGS_ID)).get()!;
}

export function updateSettings(patch: Partial<Omit<UserSettings, 'id' | 'updatedAt'>>): UserSettings {
	getSettings(); // ensure row exists
	db.update(userSettings)
		.set({ ...patch, updatedAt: new Date().toISOString() })
		.where(eq(userSettings.id, SETTINGS_ID))
		.run();
	return getSettings();
}
