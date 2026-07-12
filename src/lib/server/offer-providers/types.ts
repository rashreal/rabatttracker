export interface OfferResult {
	/** The offer/leaflet-entry id from the source - changes each time the flyer is re-run. */
	sourceOfferId: string;
	/** The source's stable catalog product id, if it has one - preferred match key over free text. */
	sourceProductId: number | null;
	productName: string;
	brand: string | null;
	description: string;
	retailerId: string;
	retailerName: string;
	priceCents: number;
	oldPriceCents: number | null;
	unitText: string | null;
	validFrom: string;
	validTo: string;
	imageUrl: string | null;
}

export interface ProductMatcher {
	query: string;
	productId: number | null;
	descriptionKey: string;
}

export interface OfferProvider {
	/** Free-text search against the source's catalog, for the "add product" picker UI. */
	searchProducts(query: string, zipCode: string): Promise<OfferResult[]>;
	/** Poll current offers for a specific watched product, scoped to a zip code. */
	fetchOffersForProduct(matcher: ProductMatcher, zipCode: string): Promise<OfferResult[]>;
}
