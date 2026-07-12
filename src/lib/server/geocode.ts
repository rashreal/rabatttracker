const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'RabattTracker/1.0 (personal self-hosted grocery price tracker)';

export interface GeocodeResult {
	lat: number;
	lon: number;
	displayName: string;
}

let lastRequestAt = 0;

// Nominatim's usage policy caps requests at 1/sec; this app is single-user
// and low-volume, so a simple in-process throttle is sufficient.
async function throttle() {
	const elapsed = Date.now() - lastRequestAt;
	const minGapMs = 1100;
	if (elapsed < minGapMs) {
		await new Promise((resolve) => setTimeout(resolve, minGapMs - elapsed));
	}
	lastRequestAt = Date.now();
}

export async function geocodeAddress(query: string): Promise<GeocodeResult | null> {
	await throttle();

	const url = new URL(NOMINATIM_URL);
	url.searchParams.set('q', query);
	url.searchParams.set('format', 'jsonv2');
	url.searchParams.set('limit', '1');
	url.searchParams.set('countrycodes', 'de,at,ch');

	const res = await fetch(url, {
		headers: { 'User-Agent': USER_AGENT }
	});
	if (!res.ok) {
		throw new Error(`Nominatim request failed: ${res.status}`);
	}

	const results = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
	if (results.length === 0) return null;

	const [first] = results;
	return {
		lat: parseFloat(first.lat),
		lon: parseFloat(first.lon),
		displayName: first.display_name
	};
}
