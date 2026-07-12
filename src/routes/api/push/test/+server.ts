import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendPushToAll } from '$lib/server/push';

export const POST: RequestHandler = async () => {
	try {
		const result = await sendPushToAll({
			title: 'RabattTracker',
			body: 'Push-Benachrichtigungen funktionieren! 🎉',
			url: '/'
		});
		return json(result);
	} catch (e) {
		throw error(500, e instanceof Error ? e.message : 'Push fehlgeschlagen');
	}
};
