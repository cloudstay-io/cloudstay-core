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
/**
 * Slim card-shape listing — only the fields a search/grid card or map pin
 * renders. Returned by the owner endpoint `/api/external/listings/all` and by
 * the client's `listListings` / `searchListings` (which projects from `Listing`
 * when the legacy endpoint is in use). Keep this tight: every field added
 * widens the search-page payload across every fork.
 */
type ListingSummary = {
    _id: string;
    id: string;
    slug: string;
    name: string;
    coverPhotoUrl?: string | null;
    thumbnailUrl?: string;
    galleryThumbnail?: string | null;
    basePrice?: number;
    currency?: string;
    bedrooms?: number;
    bathrooms?: number;
    maxGuests?: number;
    displayAddress?: string;
    city?: string;
    state?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    /** Needed for the "Sort by rating" option, otherwise unused on the card. */
    rating?: number;
    featured?: boolean;
};
type ListingSummariesResponse = {
    listings: ListingSummary[];
    pagination?: {
        page: number;
        limit: number;
        total?: number;
    };
};
type AvailabilityIdsResponse = {
    availableIds: string[];
    total: number;
};
/**
 * Per-day availability state for a single listing — used by the booking
 * calendar to disable dates that are already booked or owner-blocked.
 */
type AvailabilityDay = {
    status: string;
    price: number | null;
    minNights: number;
    maxNights: number | null;
    isBlocked: boolean;
    isBooked: boolean;
    closedToArrival: boolean;
    closedToDeparture: boolean;
};
type ListingAvailabilityResponse = {
    /** Keyed by date string in YYYY-MM-DD format. */
    availability: Record<string, AvailabilityDay>;
    source: "channel" | "connection";
    dateRange: {
        start: string;
        end: string;
    };
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
/**
 * Booking submission payload — matches the schema accepted by
 * `/api/host/pms-listings/[id]/book` and the inquiry endpoint. Skeleton
 * forks extend this with payment fields (paymentMethodId, ccToken, etc.)
 * when wiring in their PMS's payment provider.
 */
type BookingRequest = {
    accountId?: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    guestData: {
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
        message?: string;
        adults?: number;
        children?: number;
        infants?: number;
        pets?: number;
        address?: {
            line1?: string;
            city?: string;
            state?: string;
            postalCode?: string;
            country?: string;
        };
    };
    marketingConsent?: boolean;
    pricing?: {
        nightlyRate: number;
        subtotal: number;
        cleaningFee?: number;
        serviceFee?: number;
        taxes?: number;
        addOnsTotal?: number;
        totalAmount: number;
        currency?: string;
    };
    /** Stripe payment method id (when forks wire in card payments). */
    paymentMethodId?: string;
};
type BookingResponse = {
    /** CloudStay's internal booking id. */
    directBookingId?: string;
    /** Human-readable confirmation code shown to the guest. */
    bookingRef?: string;
    /** PMS-side id (Guesty/Hostaway/etc.) once synced. */
    externalBookingId?: string;
    provider?: string;
    status?: string;
    message?: string;
    [key: string]: unknown;
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
    private authedFetch;
    private publicFetch;
    /**
     * Returns slim card-shape listings — the form used by search grids and map
     * pins. When the owner endpoint is enabled, the API returns this shape
     * directly (`/api/external/listings/all`); otherwise the parent endpoint's
     * full payload is projected client-side. Either way, callers see
     * `ListingSummary[]`.
     */
    listListings(params?: SearchParams, opts?: FetchOpts): Promise<ListingSummariesResponse>;
    /**
     * Returns the full `Listing` payload — used by listing-detail pages that
     * render description, amenities, full gallery, etc. Always hits the parent
     * endpoint (the owner /all endpoint deliberately drops these fields). When
     * `useOwnerEndpoint` is on, this still passes `?includeHidden=true` so the
     * owner can view their hidden listings' detail pages.
     */
    listListingsFull(params?: SearchParams, opts?: FetchOpts): Promise<ListingsResponse>;
    getListingById(listingId: string, opts?: FetchOpts): Promise<Listing | null>;
    getListingBySlug(slug: string, opts?: FetchOpts): Promise<Listing | null>;
    getAvailableListingIds(startDate: string, endDate: string, opts?: FetchOpts): Promise<AvailabilityIdsResponse>;
    /**
     * Per-day availability for a single listing — date-keyed map of
     * blocked/booked/min-nights/etc. Used by the booking calendar to mark
     * dates the user can't pick. Public endpoint, no api-key required.
     */
    getListingAvailability(listingId: string, startDate: string, endDate: string, opts?: FetchOpts): Promise<ListingAvailabilityResponse>;
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
     * Submit a booking against the listing's PMS connection (HOST payment
     * collection mode). For SANDBOX listings this creates a simulated booking
     * with no payment; for LIVE listings the request must include a payment
     * token (paymentMethodId for Stripe, etc.) that the fork's checkout has
     * tokenized client-side.
     *
     * Returns the booking confirmation. Throws on validation/payment errors.
     */
    createBooking(listingId: string, body: BookingRequest): Promise<BookingResponse>;
    /**
     * Send an inquiry (no payment) — used as a fallback in SANDBOX or when the
     * fork hasn't wired up payment yet. Forwards the guest's message to the host.
     */
    sendInquiry(listingId: string, body: BookingRequest): Promise<BookingResponse>;
    /**
     * Returns sorted unique cities (with state/country context) across all
     * listings on this account — used for the destination dropdown. Reuses the
     * slim payload so this dedupes with `searchListings` via Next's fetch cache.
     */
    getCities(opts?: FetchOpts): Promise<CityOption[]>;
    searchListings(params?: SearchFilters, opts?: FetchOpts): Promise<ListingSummariesResponse>;
}
declare function createCloudStayClient(config: CloudStayClientConfig): CloudStayClient;

export { type AddOn, type AvailabilityDay, type AvailabilityIdsResponse, type BookingRequest, type BookingResponse, type CityOption, CloudStayClient, type CloudStayClientConfig, type FetchOpts, type Listing, type ListingAvailabilityResponse, type ListingSummariesResponse, type ListingSummary, type ListingsResponse, type Quote, type SearchFilters, type SearchParams, type SortBy, createCloudStayClient };
