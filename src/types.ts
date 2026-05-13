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
