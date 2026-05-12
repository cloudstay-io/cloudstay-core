# @cloudstay/core

Typed CloudStay API client. Used by `cloudstay-website` and every client fork.

## Install (GitHub-based, no npm registry needed)

```bash
npm install github:cloudstay-io/cloudstay-core#v0.1.0
```

Bump the tag to update.

## Usage

```ts
import { createCloudStayClient } from "@cloudstay/core";

const cs = createCloudStayClient({
  apiKey: process.env.CLOUDSTAY_API_KEY!,        // server-only
  // baseUrl: "https://staging.cloudstay.io",    // optional
});

const { listings } = await cs.listListings({ limit: 24 });
```

> **Server-only.** This package does not import `server-only` itself (it has no Next.js dependency), but the API key it expects is a server secret. **Never instantiate this client in a browser bundle.** In Next.js, gate it behind `import "server-only"` in your wrapper.

## What it covers

| Method | CloudStay endpoint |
|---|---|
| `listListings()` | `GET /api/external/listings` |
| `getListingById(id)` | `GET /api/external/listings?listingId=…` |
| `getListingBySlug(slug)` | `GET /api/external/listings` (filtered locally) |
| `getAvailableListingIds(start, end)` | `GET /api/external/availability-ids` |
| `quoteListing(id, body)` | `POST /api/listings/:id/quote` |
| `getListingAddons(id)` | `GET /api/listings/:id/addons` |
| `searchListings({ checkIn, checkOut, guests })` | composes availability-ids + listings |

For the full API surface (~963 endpoints), see the SDK reference in the skeleton repo.

## Build

```bash
npm install
npm run build       # outputs ESM + CJS + .d.ts to dist/
```

`dist/` is committed because consumers install via the GitHub URL (no npm publish step).

## Versioning

Tag releases with `v0.x.y` (semver). Breaking changes to method signatures are major bumps — every consumer fork has to update. Be deliberate.
