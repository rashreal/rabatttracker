import webpush from 'web-push';
import { eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { db } from './db/client';
import { pushSubscriptions } from './db/schema';

let configured = false;

function ensureConfigured() {
	if (configured) return;
	if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
		throw new Error(
			'VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY sind nicht gesetzt (siehe .env.example, "npx web-push generate-vapid-keys").'
		);
	}
	webpush.setVapidDetails(
		env.VAPID_SUBJECT || 'mailto:admin@example.com',
		env.VAPID_PUBLIC_KEY,
		env.VAPID_PRIVATE_KEY
	);
	configured = true;
}

export function getVapidPublicKey(): string | null {
	return env.VAPID_PUBLIC_KEY || null;
}

export interface SubscriptionInput {
	endpoint: string;
	keys: { p256dh: string; auth: string };
	deviceLabel?: string | null;
}

export function saveSubscription(input: SubscriptionInput) {
	const existing = db
		.select()
		.from(pushSubscriptions)
		.where(eq(pushSubscriptions.endpoint, input.endpoint))
		.get();

	if (existing) {
		db.update(pushSubscriptions)
			.set({
				p256dh: input.keys.p256dh,
				auth: input.keys.auth,
				deviceLabel: input.deviceLabel ?? existing.deviceLabel
			})
			.where(eq(pushSubscriptions.endpoint, input.endpoint))
			.run();
	} else {
		db.insert(pushSubscriptions)
			.values({
				endpoint: input.endpoint,
				p256dh: input.keys.p256dh,
				auth: input.keys.auth,
				deviceLabel: input.deviceLabel ?? null,
				createdAt: new Date().toISOString()
			})
			.run();
	}
}

export function removeSubscription(endpoint: string) {
	db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint)).run();
}

export function listSubscriptions() {
	return db.select().from(pushSubscriptions).all();
}

export interface PushPayload {
	title: string;
	body: string;
	url?: string;
}

export async function sendPushToAll(payload: PushPayload): Promise<{ sent: number; removed: number }> {
	ensureConfigured();
	const subs = listSubscriptions();
	let sent = 0;
	let removed = 0;

	for (const sub of subs) {
		try {
			await webpush.sendNotification(
				{ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
				JSON.stringify(payload)
			);
			sent++;
		} catch (e) {
			const statusCode = (e as { statusCode?: number }).statusCode;
			if (statusCode === 404 || statusCode === 410) {
				removeSubscription(sub.endpoint);
				removed++;
			} else {
				console.error('Push send failed for', sub.endpoint, e);
			}
		}
	}

	return { sent, removed };
}
