import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSettings, updateSettings } from '$lib/server/settings';

export const GET: RequestHandler = async () => {
	return json(getSettings());
};

export const PUT: RequestHandler = async ({ request }) => {
	const body = await request.json();

	const patch: Record<string, unknown> = {};
	if (typeof body.homeAddressText === 'string') patch.homeAddressText = body.homeAddressText;
	if (typeof body.homeZipCode === 'string') patch.homeZipCode = body.homeZipCode;
	if (typeof body.homeLat === 'number') patch.homeLat = body.homeLat;
	if (typeof body.homeLon === 'number') patch.homeLon = body.homeLon;
	if (typeof body.radiusKm === 'number') patch.radiusKm = body.radiusKm;
	if (typeof body.notificationEnabled === 'boolean')
		patch.notificationEnabled = body.notificationEnabled;
	if (typeof body.notifyOnNewOffer === 'boolean') patch.notifyOnNewOffer = body.notifyOnNewOffer;
	if (typeof body.notifyOnPriceDropOnly === 'boolean')
		patch.notifyOnPriceDropOnly = body.notifyOnPriceDropOnly;
	if (typeof body.priceDropThresholdPct === 'number')
		patch.priceDropThresholdPct = body.priceDropThresholdPct;

	return json(updateSettings(patch));
};
