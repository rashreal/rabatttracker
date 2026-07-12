import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { saveSubscription, removeSubscription } from '$lib/server/push';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	if (typeof body.endpoint !== 'string' || !body.keys?.p256dh || !body.keys?.auth) {
		throw error(400, 'endpoint und keys sind erforderlich');
	}
	saveSubscription({
		endpoint: body.endpoint,
		keys: { p256dh: body.keys.p256dh, auth: body.keys.auth },
		deviceLabel: typeof body.deviceLabel === 'string' ? body.deviceLabel : null
	});
	return json({ ok: true });
};

export const DELETE: RequestHandler = async ({ request }) => {
	const body = await request.json();
	if (typeof body.endpoint !== 'string') {
		throw error(400, 'endpoint ist erforderlich');
	}
	removeSubscription(body.endpoint);
	return json({ ok: true });
};
