import { marktguruProvider } from './marktguru';
import type { OfferProvider } from './types';

// Single swap point: if Marktguru's unofficial API breaks or gets blocked,
// point this at a different OfferProvider implementation without touching
// the rest of the app (DB schema, scrape job, alerting, UI).
export const activeOfferProvider: OfferProvider = marktguruProvider;

export type { OfferProvider, OfferResult, ProductMatcher } from './types';
