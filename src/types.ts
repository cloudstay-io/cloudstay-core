export type Listing = {
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
  minMaxPriceRange?: { min?: number; max?: number };

  rating?: number;
  reviewCount?: number;

  coverPhotoUrl?: string | null;
  thumbnailUrl?: string;
  images?: Array<{ url: string; caption?: string; roomCategory?: string }>;
  galleryThumbnails?: string[];

  amenities?: Array<{ category?: string; name: string }>;
  tags?: string[];
  featured?: boolean;
};

export type ListingsResponse = {
  listings: Listing[];
  pagination?: { page: number; limit: number; total?: number };
  hiddenListingIds?: string[];
};

/**
 * Slim card-shape listing — only the fields a search/grid card or map pin
 * renders. Returned by the owner endpoint `/api/external/listings/all` and by
 * the client's `listListings` / `searchListings` (which projects from `Listing`
 * when the legacy endpoint is in use). Keep this tight: every field added
 * widens the search-page payload across every fork.
 */
export type ListingSummary = {
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

export type ListingSummariesResponse = {
  listings: ListingSummary[];
  pagination?: { page: number; limit: number; total?: number };
};

export type AvailabilityIdsResponse = {
  availableIds: string[];
  total: number;
};

/**
 * Per-day availability state for a single listing — used by the booking
 * calendar to disable dates that are already booked or owner-blocked.
 */
export type AvailabilityDay = {
  status: string;
  price: number | null;
  minNights: number;
  maxNights: number | null;
  isBlocked: boolean;
  isBooked: boolean;
  closedToArrival: boolean;
  closedToDeparture: boolean;
};

export type ListingAvailabilityResponse = {
  /** Keyed by date string in YYYY-MM-DD format. */
  availability: Record<string, AvailabilityDay>;
  source: "channel" | "connection";
  dateRange: { start: string; end: string };
};

export type Quote = {
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
export type BookingRequest = {
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

export type BookingResponse = {
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

export type AddOn = {
  name: string;
  description?: string;
  price: number;
  priceType: "FLAT" | "PER_NIGHT" | "PER_GUEST" | "PER_PET";
  currency: string;
  maxQuantity?: number;
  isRequired?: boolean;
  isActive?: boolean;
};

export type SearchParams = {
  page?: number;
  limit?: number;
  checkIn?: string;
  checkOut?: string;
  listingId?: string;
};

export type SortBy =
  | "featured"
  | "price-asc"
  | "price-desc"
  | "guests"
  | "rating";

export type SearchFilters = {
  location?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  sortBy?: SortBy;
  limit?: number;
};

export type CityOption = {
  city: string;
  state?: string;
  country?: string;
  label: string;
  count: number;
};

export type CloudStayClientConfig = {
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

export type FetchOpts = {
  cache?: RequestCache;
  revalidate?: number | false;
  signal?: AbortSignal;
};
