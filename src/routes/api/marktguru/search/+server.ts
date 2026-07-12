import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { activeOfferProvider } from '$lib/server/offer-providers';
import { getSettings } from '$lib/server/settings';
import { describeError } from '$lib/server/error-utils';

export const GET: RequestHandler = async ({ url }) => {
	const query = url.searchParams.get('q');
	if (!query || query.trim().length === 0) {
		throw error(400, 'Query-Parameter "q" ist erforderlich');
	}

	const zipCode = url.searchParams.get('zip') || getSettings().homeZipCode;
	if (!zipCode) {
		throw error(400, 'Keine PLZ gesetzt - bitte zuerst in den Einstellungen einen Standort festlegen.');
	}

	try {
		const results = await activeOfferProvider.searchProducts(query.trim(), zipCode);
		return json(results);
	} catch (e) {
		console.error('Marktguru search failed', e);
		throw error(502, `Marktguru-Suche fehlgeschlagen: ${describeError(e)}`);
	}
};
