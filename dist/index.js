// src/client.ts
var DEFAULT_BASE = "https://cloudstay.io";
var CloudStayClient = class {
  apiKey;
  baseUrl;
  fetchImpl;
  useOwnerEndpoint;
  constructor(config) {
    if (!config.apiKey) {
      throw new Error("CloudStayClient: apiKey is required.");
    }
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE;
    this.fetchImpl = config.fetch ?? fetch;
    this.useOwnerEndpoint = config.useOwnerEndpoint ?? false;
  }
  async authedFetch(path, init = {}) {
    const { revalidate, ...rest } = init;
    const next = revalidate !== void 0 ? { next: { revalidate: revalidate || 0 } } : {};
    const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
      ...rest,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...rest.headers ?? {}
      },
      ...next
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `CloudStay ${res.status} ${res.statusText} on ${path}: ${body.slice(0, 200)}`
      );
    }
    return await res.json();
  }
  async publicFetch(path, init = {}) {
    const { revalidate, ...rest } = init;
    const next = revalidate !== void 0 ? { next: { revalidate: revalidate || 0 } } : {};
    const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...rest.headers ?? {}
      },
      ...next
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `CloudStay ${res.status} ${res.statusText} on ${path}: ${body.slice(0, 200)}`
      );
    }
    return await res.json();
  }
  /**
   * Returns slim card-shape listings — the form used by search grids and map
   * pins. When the owner endpoint is enabled, the API returns this shape
   * directly (`/api/external/listings/all`); otherwise the parent endpoint's
   * full payload is projected client-side. Either way, callers see
   * `ListingSummary[]`.
   */
  async listListings(params = {}, opts = { revalidate: 300 }) {
    const qs = buildQuery(params);
    if (this.useOwnerEndpoint) {
      return this.authedFetch(
        `/api/external/listings/all${qs ? `?${qs}` : ""}`,
        opts
      );
    }
    const full = await this.authedFetch(
      `/api/external/listings${qs ? `?${qs}` : ""}`,
      opts
    );
    return {
      listings: full.listings.map(toSummary),
      pagination: full.pagination
    };
  }
  /**
   * Returns the full `Listing` payload — used by listing-detail pages that
   * render description, amenities, full gallery, etc. Always hits the parent
   * endpoint (the owner /all endpoint deliberately drops these fields). When
   * `useOwnerEndpoint` is on, this still passes `?includeHidden=true` so the
   * owner can view their hidden listings' detail pages.
   */
  async listListingsFull(params = {}, opts = { revalidate: 300 }) {
    const qs = buildQuery(
      this.useOwnerEndpoint ? { ...params, includeHidden: true } : params
    );
    return this.authedFetch(
      `/api/external/listings${qs ? `?${qs}` : ""}`,
      opts
    );
  }
  async getListingById(listingId, opts = { revalidate: 300 }) {
    const res = await this.listListingsFull({ listingId, limit: 1 }, opts);
    return res.listings[0] ?? null;
  }
  async getListingBySlug(slug, opts = { revalidate: 300 }) {
    const all = await this.listListingsFull({ limit: 500 }, opts);
    return all.listings.find((l) => l.slug === slug) ?? null;
  }
  async getAvailableListingIds(startDate, endDate, opts = { revalidate: 60 }) {
    const query = new URLSearchParams({ startDate, endDate });
    return this.authedFetch(`/api/external/availability-ids?${query.toString()}`, opts);
  }
  async quoteListing(listingId, body) {
    return this.publicFetch(`/api/listings/${listingId}/quote`, {
      method: "POST",
      body: JSON.stringify(body),
      cache: "no-store"
    });
  }
  async getListingAddons(listingId, opts = { revalidate: 300 }) {
    return this.publicFetch(`/api/listings/${listingId}/addons`, opts);
  }
  /**
   * Returns sorted unique cities (with state/country context) across all
   * listings on this account — used for the destination dropdown. Reuses the
   * slim payload so this dedupes with `searchListings` via Next's fetch cache.
   */
  async getCities(opts = { revalidate: 1800 }) {
    const { listings } = await this.listListings({ limit: 500 }, opts);
    const seen = /* @__PURE__ */ new Map();
    for (const l of listings) {
      if (!l.city) continue;
      const key = [l.city, l.state, l.country].filter(Boolean).join("|").toLowerCase();
      if (!seen.has(key)) {
        seen.set(key, {
          city: l.city,
          state: l.state,
          country: l.country,
          label: [l.city, l.state, l.country].filter(Boolean).join(", "),
          count: 1
        });
      } else {
        seen.get(key).count += 1;
      }
    }
    return [...seen.values()].sort((a, b) => a.label.localeCompare(b.label));
  }
  async searchListings(params = {}, opts = { revalidate: 60 }) {
    const displayLimit = params.limit ?? 100;
    const FETCH_LIMIT = 500;
    let listings;
    let pagination;
    if (params.checkIn && params.checkOut) {
      const ids = await this.getAvailableListingIds(params.checkIn, params.checkOut, opts);
      if (ids.availableIds.length === 0) {
        return { listings: [], pagination: { page: 1, limit: 0, total: 0 } };
      }
      const all = await this.listListings({ limit: FETCH_LIMIT }, opts);
      const allowed = new Set(ids.availableIds);
      listings = all.listings.filter((l) => allowed.has(l._id) || allowed.has(l.id));
      pagination = all.pagination;
    } else {
      const all = await this.listListings({ limit: FETCH_LIMIT }, opts);
      listings = all.listings;
      pagination = all.pagination;
    }
    if (params.guests) {
      const min = params.guests;
      listings = listings.filter((l) => (l.maxGuests ?? Infinity) >= min);
    }
    if (params.location) {
      const q = params.location.trim().toLowerCase();
      if (q) {
        listings = listings.filter((l) => {
          const haystack = [
            l.name,
            l.city,
            l.state,
            l.country,
            l.displayAddress
          ].filter(Boolean).join(" ").toLowerCase();
          return haystack.includes(q);
        });
      }
    }
    listings = sortSummaries(listings, params.sortBy ?? "featured");
    return { listings: listings.slice(0, displayLimit), pagination };
  }
};
function buildQuery(params) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.checkIn) query.set("checkIn", params.checkIn);
  if (params.checkOut) query.set("checkOut", params.checkOut);
  if (params.listingId) query.set("listingId", params.listingId);
  if (params.includeHidden) query.set("includeHidden", "true");
  return query.toString();
}
function toSummary(l) {
  return {
    _id: l._id,
    id: l.id,
    slug: l.slug,
    name: l.name,
    coverPhotoUrl: l.coverPhotoUrl,
    thumbnailUrl: l.thumbnailUrl,
    galleryThumbnail: l.galleryThumbnails?.[0],
    basePrice: l.basePrice,
    currency: l.currency,
    bedrooms: l.bedrooms,
    bathrooms: l.bathrooms,
    maxGuests: l.maxGuests,
    displayAddress: l.displayAddress,
    city: l.city,
    state: l.state,
    country: l.country,
    latitude: l.latitude,
    longitude: l.longitude,
    rating: l.rating,
    featured: l.featured
  };
}
function sortSummaries(listings, sortBy) {
  const copy = [...listings];
  switch (sortBy) {
    case "price-asc":
      return copy.sort(
        (a, b) => (a.basePrice ?? Infinity) - (b.basePrice ?? Infinity)
      );
    case "price-desc":
      return copy.sort(
        (a, b) => (b.basePrice ?? -Infinity) - (a.basePrice ?? -Infinity)
      );
    case "guests":
      return copy.sort((a, b) => (b.maxGuests ?? 0) - (a.maxGuests ?? 0));
    case "rating":
      return copy.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    case "featured":
    default:
      return copy.sort((a, b) => Number(b.featured ?? 0) - Number(a.featured ?? 0));
  }
}
function createCloudStayClient(config) {
  return new CloudStayClient(config);
}

export { CloudStayClient, createCloudStayClient };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map