import type { OfferProvider, OfferResult, ProductMatcher } from './types';

const HOME_URL = 'https://marktguru.de';
// Trailing slash matters: new URL('offers/search', base) drops the last path
// segment of base if it doesn't end in "/", which silently turned this into
// https://api.marktguru.de/api/offers/search (missing /v1/, 404) before.
const API_BASE_URL = 'https://api.marktguru.de/api/v1/';
const BROWSER_USER_AGENT =
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// Marktguru's API has no public docs. Its auth keys are not static secrets:
// they're embedded in a `<script type="application/json">` blob on the
// marktguru.de homepage and must be scraped fresh (this mirrors the approach
// of the open-source "marktguru" npm package, which was used as the
// reference implementation for this integration).
interface MarktguruKeys {
	apiKey: string;
	clientKey: string;
}

let cachedKeys: MarktguruKeys | null = null;
let cachedKeysAt = 0;
const KEY_CACHE_TTL_MS = 30 * 60 * 1000;

async function fetchKeys(): Promise<MarktguruKeys> {
	if (cachedKeys && Date.now() - cachedKeysAt < KEY_CACHE_TTL_MS) {
		return cachedKeys;
	}

	const res = await fetch(HOME_URL, {
		headers: { 'User-Agent': BROWSER_USER_AGENT }
	});
	if (!res.ok) {
		throw new Error(`Marktguru homepage request failed: ${res.status}`);
	}
	const html = await res.text();

	const scriptRegex = /<script type="application\/json">(.*?)<\/script>/gs;
	let match: RegExpExecArray | null;
	let configJson: string | null = null;
	while ((match = scriptRegex.exec(html)) !== null) {
		if (match[1].includes('apiKey') && match[1].includes('clientKey')) {
			configJson = match[1];
		}
	}
	if (!configJson) {
		throw new Error(
			'Marktguru API-Keys nicht gefunden - die Seitenstruktur hat sich vermutlich geändert.'
		);
	}

	const parsed = JSON.parse(configJson) as { config?: { apiKey?: string; clientKey?: string } };
	const apiKey = parsed.config?.apiKey;
	const clientKey = parsed.config?.clientKey;
	if (!apiKey || !clientKey) {
		throw new Error('Marktguru API-Keys konnten nicht aus der Konfiguration gelesen werden.');
	}

	cachedKeys = { apiKey, clientKey };
	cachedKeysAt = Date.now();
	return cachedKeys;
}

interface RawAdvertiser {
	uniqueName: string;
	id: string;
	name: string;
}

interface RawOffer {
	id: number;
	description: string;
	price: number;
	oldPrice: number | null;
	validityDates: { from: string; to: string }[];
	brand?: { name: string } | null;
	advertisers: RawAdvertiser[];
	product?: { id: number; name: string; description: string | null } | null;
	unit?: { name: string; shortName: string } | null;
	images?: { urls?: { medium?: string } } | null;
}

function normalizeOffer(raw: RawOffer): OfferResult[] {
	const validity = raw.validityDates[0] ?? { from: '', to: '' };
	return raw.advertisers.map((advertiser) => ({
		sourceOfferId: `${raw.id}-${advertiser.id}`,
		sourceProductId: raw.product?.id ?? null,
		productName: raw.product?.name ?? raw.description,
		brand: raw.brand?.name ?? null,
		description: raw.description,
		retailerId: advertiser.id,
		retailerName: advertiser.name,
		priceCents: Math.round(raw.price * 100),
		oldPriceCents: raw.oldPrice != null ? Math.round(raw.oldPrice * 100) : null,
		unitText: raw.unit?.name ?? null,
		validFrom: validity.from,
		validTo: validity.to,
		imageUrl: raw.images?.urls?.medium ?? null
	}));
}

async function searchRaw(query: string, zipCode: string, limit = 50): Promise<OfferResult[]> {
	const keys = await fetchKeys();

	const url = new URL('offers/search', API_BASE_URL);
	url.searchParams.set('as', 'web');
	url.searchParams.set('q', query);
	url.searchParams.set('limit', String(limit));
	url.searchParams.set('offset', '0');
	url.searchParams.set('zipCode', zipCode);

	const res = await fetch(url, {
		headers: {
			'x-apikey': keys.apiKey,
			'x-clientkey': keys.clientKey,
			'User-Agent': BROWSER_USER_AGENT
		}
	});
	if (!res.ok) {
		throw new Error(`Marktguru offers/search fehlgeschlagen: ${res.status}`);
	}

	const body = (await res.json()) as { results: RawOffer[] };
	return body.results.flatMap(normalizeOffer);
}

export function descriptionKeyFor(brand: string | null, productName: string): string {
	return `${brand ?? ''}|${productName}`.toLowerCase().trim();
}

export const marktguruProvider: OfferProvider = {
	async searchProducts(query, zipCode) {
		return searchRaw(query, zipCode, 25);
	},

	async fetchOffersForProduct(matcher: ProductMatcher, zipCode: string) {
		const offers = await searchRaw(matcher.query, zipCode, 100);

		if (matcher.productId != null) {
			return offers.filter((o) => o.sourceProductId === matcher.productId);
		}
		return offers.filter(
			(o) => descriptionKeyFor(o.brand, o.productName) === matcher.descriptionKey
		);
	}
};
