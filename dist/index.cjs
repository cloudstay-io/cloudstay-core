'use strict';

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
  listingsPath() {
    return this.useOwnerEndpoint ? "/api/external/listings/all" : "/api/external/listings";
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
  async listListings(params = {}, opts = { revalidate: 300 }) {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    if (params.checkIn) query.set("checkIn", params.checkIn);
    if (params.checkOut) query.set("checkOut", params.checkOut);
    if (params.listingId) query.set("listingId", params.listingId);
    const qs = query.toString();
    return this.authedFetch(`${this.listingsPath()}${qs ? `?${qs}` : ""}`, opts);
  }
  async getListingById(listingId, opts = { revalidate: 300 }) {
    const res = await this.listListings({ listingId, limit: 1 }, opts);
    return res.listings[0] ?? null;
  }
  async getListingBySlug(slug, opts = { revalidate: 300 }) {
    const all = await this.listListings({ limit: 500 }, opts);
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
   * listings on this account — used for the destination dropdown.
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
    const limit = params.limit ?? 100;
    let listings;
    let pagination;
    if (params.checkIn && params.checkOut) {
      const ids = await this.getAvailableListingIds(params.checkIn, params.checkOut, opts);
      if (ids.availableIds.length === 0) {
        return { listings: [], pagination: { page: 1, limit: 0, total: 0 } };
      }
      const all = await this.listListings({ limit }, opts);
      const allowed = new Set(ids.availableIds);
      listings = all.listings.filter((l) => allowed.has(l._id) || allowed.has(l.id));
      pagination = all.pagination;
    } else {
      const all = await this.listListings({ limit }, opts);
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
    listings = sortListings(listings, params.sortBy ?? "featured");
    return { listings, pagination };
  }
};
function sortListings(listings, sortBy) {
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

exports.CloudStayClient = CloudStayClient;
exports.createCloudStayClient = createCloudStayClient;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map