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

  amenities?: string[];
  tags?: string[];
  featured?: boolean;
};

export type ListingsResponse = {
  listings: Listing[];
  pagination?: { page: number; limit: number; total?: number };
  hiddenListingIds?: string[];
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

export type CloudStayClientConfig = {
  apiKey: string;
  baseUrl?: string;
  fetch?: typeof fetch;
};

export type FetchOpts = {
  cache?: RequestCache;
  revalidate?: number | false;
  signal?: AbortSignal;
};
