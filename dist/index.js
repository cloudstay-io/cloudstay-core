// src/client.ts
var DEFAULT_BASE = "https://cloudstay.io";
var CloudStayClient = class {
  apiKey;
  baseUrl;
  fetchImpl;
  constructor(config) {
    if (!config.apiKey) {
      throw new Error("CloudStayClient: apiKey is required.");
    }
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE;
    this.fetchImpl = config.fetch ?? fetch;
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
    return this.authedFetch(`/api/external/listings${qs ? `?${qs}` : ""}`, opts);
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
  async searchListings(params = {}, opts = { revalidate: 60 }) {
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
          listings: filtered.filter((l) => (l.maxGuests ?? Infinity) >= guestsRequired)
        };
      }
      return { ...all, listings: filtered };
    }
    return this.listListings({ limit: params.limit ?? 100 }, opts);
  }
};
function createCloudStayClient(config) {
  return new CloudStayClient(config);
}

export { CloudStayClient, createCloudStayClient };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map