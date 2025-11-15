# Caching

The resource framework supports fine‑grained control over client fetch caching for both list and drilldown views. This page explains defaults and how to override them per resource.

## Defaults

- `ResourceTable` and `ResourceDrilldown` fetch data using `useApiClient`.
- By default, caching behavior is controlled by the user scope `xbp_cache_experimental_v2`:
  - Users WITH the scope: caching is enabled (no special header sent).
  - Users WITHOUT the scope: caching is disabled (the client sends `Cache-Control: no-cache`).

This default ensures consistency for users who don't participate in the cache experiment.

## Per-resource override

You can explicitly force or disable the no‑cache behavior per resource by setting `force_no_cache` on the `ResourceRoute`:

```ts
import { RESOURCE_ROUTES } from "@/packages/resource-framework/registries/resource-routes";

export const RESOURCE_ROUTES = {
  invoices: {
    table: "invoices",
    idColumn: "invoice_id",
    // Force header on all data requests for this resource
    force_no_cache: true,
  },
  quotes: {
    table: "quotes",
    idColumn: "quote_id",
    // Explicitly disable header for this resource (always cached)
    force_no_cache: false,
  },
  customers: {
    table: "customers",
    idColumn: "customer_id",
    // Omit to fall back to the scope-based default
    // force_no_cache: undefined
  },
} as const;
```

Resolution precedence used by both `ResourceTable` and `ResourceDrilldown`:

1. If `force_no_cache === true`: send `Cache-Control: no-cache`.
2. If `force_no_cache === false`: do NOT send the header.
3. If `force_no_cache` is `undefined`: fall back to the default (based on the `xbp_cache_experimental_v2` scope).

## Remote configuration (database‑driven routes)

When a static entry is not present, the components will load settings from the `resource_routes` table. If you want to configure caching from the database, add a boolean column:

```sql
alter table resource_routes
add column if not exists force_no_cache boolean;
```

Then set it per row. The loader maps this to the `ResourceRoute.force_no_cache` field.

## How it works under the hood

- Both components compute a `noCache` boolean and pass it to `useApiClient`.
- `useApiClient` only sets the header when `noCache` is `true`:

```ts
const fetchHeaders: Record<string, string> = { ...headers };
if (noCache) {
  fetchHeaders["Cache-Control"] = "no-cache";
}
```

This means the presence of the header is entirely determined by the resolution rules above.

## Summary

- Use `force_no_cache: true` to always bypass cache.
- Use `force_no_cache: false` to always allow cache.
- Omit `force_no_cache` to fall back to the scope experiment (`xbp_cache_experimental_v2`).*** End Patch``` }

