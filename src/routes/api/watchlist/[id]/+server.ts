import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { removeWatchedProduct, setWatchedProductActive } from '$lib/server/watchlist';

export const DELETE: RequestHandler = async ({ params }) => {
	const id = Number(params.id);
	if (!Number.isInteger(id)) throw error(400, 'Ungültige ID');
	removeWatchedProduct(id);
	return json({ ok: true });
};

export const PATCH: RequestHandler = async ({ params, request }) => {
	const id = Number(params.id);
	if (!Number.isInteger(id)) throw error(400, 'Ungültige ID');
	const body = await request.json();
	if (typeof body.active === 'boolean') {
		setWatchedProductActive(id, body.active);
	}
	return json({ ok: true });
};
