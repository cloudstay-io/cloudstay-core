type Listing = {
    _id: string;
    id: string;
    externalId: string;
    slug: string;
    name: string;
    internalName?: string;
    description?: string;
    shortDescription?: string;
    listingType: string;
    status: string;
    city?: string;
    state?: string;
    country?: string;
    displayAddress?: string;
    latitude?: number;
    longitude?: number;
    bedrooms?: number;
    bathrooms?: number;
    maxGuests?: number;
    basePrice?: number;
    cleaningFee?: number;
    currency?: string;
    minMaxPriceRange?: {
        min?: number;
        max?: number;
    };
    rating?: number;
    reviewCount?: number;
    coverPhotoUrl?: string | null;
    thumbnailUrl?: string;
    images?: Array<{
        url: string;
        caption?: string;
        roomCategory?: string;
    }>;
    galleryThumbnails?: string[];
    amenities?: Array<{
        category?: string;
        name: string;
    }>;
    tags?: string[];
    featured?: boolean;
};
type ListingsResponse = {
    listings: Listing[];
    pagination?: {
        page: number;
        limit: number;
        total?: number;
    };
    hiddenListingIds?: string[];
};
type AvailabilityIdsResponse = {
    availableIds: string[];
    total: number;
};
type Quote = {
    listingId: string;
    checkIn: string;
    checkOut: string;
    numberOfNights: number;
    guests: number;
    nightlyRate: number;
    subtotal: number;
    cleaningFee: number;
    serviceFee: number;
    taxes: number;
    totalAmount: number;
    currency: string;
    available: boolean;
    quoteSource: string;
};
type AddOn = {
    name: string;
    description?: string;
    price: number;
    priceType: "FLAT" | "PER_NIGHT" | "PER_GUEST" | "PER_PET";
    currency: string;
    maxQuantity?: number;
    isRequired?: boolean;
    isActive?: boolean;
};
type SearchParams = {
    page?: number;
    limit?: number;
    checkIn?: string;
    checkOut?: string;
    listingId?: string;
};
type SortBy = "featured" | "price-asc" | "price-desc" | "guests" | "rating";
type SearchFilters = {
    location?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    sortBy?: SortBy;
    limit?: number;
};
type CityOption = {
    city: string;
    state?: string;
    country?: string;
    label: string;
    count: number;
};
type CloudStayClientConfig = {
    apiKey: string;
    baseUrl?: string;
    fetch?: typeof fetch;
    /**
     * If true, listing reads hit `/api/external/listings/all` instead of
     * `/api/external/listings` — bypasses the per-account `hiddenListingIds`
     * filter so an account-owner api-key sees every listing on its account.
     * Default: false (backward-compatible).
     */
    useOwnerEndpoint?: boolean;
};
type FetchOpts = {
    cache?: RequestCache;
    revalidate?: number | false;
    signal?: AbortSignal;
};

declare class CloudStayClient {
    readonly apiKey: string;
    readonly baseUrl: string;
    readonly fetchImpl: typeof fetch;
    readonly useOwnerEndpoint: boolean;
    constructor(config: CloudStayClientConfig);
    private listingsPath;
    private authedFetch;
    private publicFetch;
    listListings(params?: SearchParams, opts?: FetchOpts): Promise<ListingsResponse>;
    getListingById(listingId: string, opts?: FetchOpts): Promise<Listing | null>;
    getListingBySlug(slug: string, opts?: FetchOpts): Promise<Listing | null>;
    getAvailableListingIds(startDate: string, endDate: string, opts?: FetchOpts): Promise<AvailabilityIdsResponse>;
    quoteListing(listingId: string, body: {
        checkIn: string;
        checkOut: string;
        guests?: number;
        adults?: number;
        children?: number;
        infants?: number;
        pets?: number;
        promoCode?: string;
    }): Promise<{
        quote: Quote;
    }>;
    getListingAddons(listingId: string, opts?: FetchOpts): Promise<{
        listingId: string;
        addOns: AddOn[];
    }>;
    /**
     * Returns sorted unique cities (with state/country context) across all
     * listings on this account — used for the destination dropdown.
     */
    getCities(opts?: FetchOpts): Promise<CityOption[]>;
    searchListings(params?: SearchFilters, opts?: FetchOpts): Promise<ListingsResponse>;
}
declare function createCloudStayClient(config: CloudStayClientConfig): CloudStayClient;

export { type AddOn, type AvailabilityIdsResponse, type CityOption, CloudStayClient, type CloudStayClientConfig, type FetchOpts, type Listing, type ListingsResponse, type Quote, type SearchFilters, type SearchParams, type SortBy, createCloudStayClient };
