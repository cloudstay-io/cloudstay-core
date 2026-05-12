import type {
  AddOn,
  AvailabilityIdsResponse,
  CloudStayClientConfig,
  FetchOpts,
  Listing,
  ListingsResponse,
  Quote,
  SearchParams,
} from "./types";

const DEFAULT_BASE = "https://cloudstay.io";

export class CloudStayClient {
  readonly apiKey: string;
  readonly baseUrl: string;
  readonly fetchImpl: typeof fetch;

  constructor(config: CloudStayClientConfig) {
    if (!config.apiKey) {
      throw new Error("CloudStayClient: apiKey is required.");
    }
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE;
    this.fetchImpl = config.fetch ?? fetch;
  }

  private async authedFetch<T>(path: string, init: RequestInit & FetchOpts = {}): Promise<T> {
    const { revalidate, ...rest } = init;
    const next = revalidate !== undefined ? { next: { revalidate: revalidate || 0 } } : {};
    const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
      ...rest,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...(rest.headers ?? {}),
      },
      ...next,
    } as RequestInit);
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `CloudStay ${res.status} ${res.statusText} on ${path}: ${body.slice(0, 200)}`,
      );
    }
    return (await res.json()) as T;
  }

  private async publicFetch<T>(path: string, init: RequestInit & FetchOpts = {}): Promise<T> {
    const { revalidate, ...rest } = init;
    const next = revalidate !== undefined ? { next: { revalidate: revalidate || 0 } } : {};
    const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...(rest.headers ?? {}),
      },
      ...next,
    } as RequestInit);
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `CloudStay ${res.status} ${res.statusText} on ${path}: ${body.slice(0, 200)}`,
      );
    }
    return (await res.json()) as T;
  }

  async listListings(
    params: SearchParams = {},
    opts: FetchOpts = { revalidate: 300 },
  ): Promise<ListingsResponse> {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    if (params.checkIn) query.set("checkIn", params.checkIn);
    if (params.checkOut) query.set("checkOut", params.checkOut);
    if (params.listingId) query.set("listingId", params.listingId);
    const qs = query.toString();
    return this.authedFetch(`/api/external/listings${qs ? `?${qs}` : ""}`, opts);
  }

  async getListingById(
    listingId: string,
    opts: FetchOpts = { revalidate: 300 },
  ): Promise<Listing | null> {
    const res = await this.listListings({ listingId, limit: 1 }, opts);
    return res.listings[0] ?? null;
  }

  async getListingBySlug(
    slug: string,
    opts: FetchOpts = { revalidate: 300 },
  ): Promise<Listing | null> {
    const all = await this.listListings({ limit: 500 }, opts);
    return all.listings.find((l) => l.slug === slug) ?? null;
  }

  async getAvailableListingIds(
    startDate: string,
    endDate: string,
    opts: FetchOpts = { revalidate: 60 },
  ): Promise<AvailabilityIdsResponse> {
    const query = new URLSearchParams({ startDate, endDate });
    return this.authedFetch(`/api/external/availability-ids?${query.toString()}`, opts);
  }

  async quoteListing(
    listingId: string,
    body: {
      checkIn: string;
      checkOut: string;
      guests?: number;
      adults?: number;
      children?: number;
      infants?: number;
      pets?: number;
      promoCode?: string;
    },
  ): Promise<{ quote: Quote }> {
    return this.publicFetch(`/api/listings/${listingId}/quote`, {
      method: "POST",
      body: JSON.stringify(body),
      cache: "no-store",
    });
  }

  async getListingAddons(
    listingId: string,
    opts: FetchOpts = { revalidate: 300 },
  ): Promise<{ listingId: string; addOns: AddOn[] }> {
    return this.publicFetch(`/api/listings/${listingId}/addons`, opts);
  }

  async searchListings(
    params: { checkIn?: string; checkOut?: string; guests?: number; limit?: number } = {},
    opts: FetchOpts = { revalidate: 60 },
  ): Promise<ListingsResponse> {
    if (params.checkIn && params.checkOut) {
      const ids = await this.getAvailableListingIds(params.checkIn, params.checkOut, opts);
      if (ids.availableIds.length === 0) {
        return { listings: [], pagination: { page: 1, limit: 0, total: 0 } };
      }
      const all = await this.listListings({ limit: params.limit ?? 100 }, opts);
      const allowed = new Set(ids.availableIds);
      const filtered = all.listings.filter((l) => allowed.has(l._id) || allowed.has(l.id));
      if (params.guests) {
        const guestsRequired = params.guests;
        return {
          ...all,
          listings: filtered.filter((l) => (l.maxGuests ?? Infinity) >= guestsRequired),
        };
      }
      return { ...all, listings: filtered };
    }
    return this.listListings({ limit: params.limit ?? 100 }, opts);
  }
}

export function createCloudStayClient(config: CloudStayClientConfig): CloudStayClient {
  return new CloudStayClient(config);
}
