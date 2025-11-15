# resource-framework

Adapter-driven resource tables and drilldowns for React apps. Ship reusable data views without coupling to a specific UI kit or router by injecting your own components and app services through a tiny adapter layer.

## Highlights

- Adapter-first: bring your own UI primitives (Button/Badge/Input/etc.), router helpers, stores, and API hooks
- Headless primitives: column builders, type-safe specs, and hooks for filters and preferences
- Batteries included cells: opinionated renderers for status, currency, dates, assignees, and scopes
- Build-friendly: ESM + CJS + `.d.ts` types, small surface area, tree-shakeable

## Installation

```bash
npm install resource-framework
```

Peer dependencies you should already have in your app:

- react >= 18, react-dom >= 18
- @tanstack/react-table ^8
- Optional (used by some components/cells): date-fns, react-error-boundary, lucide-react, md5

If you use only headless APIs (constructors, utils, hooks), you can omit UI-related peers.

## Quick start

1) Provide adapters (UI + App) at the root

Wrap your app with the provider and pass your UI/app bindings:

```tsx
import { ResourceFrameworkProvider } from "resource-framework/adapters";

<ResourceFrameworkProvider
  ui={{
    Button, Badge, Input,
    // Select, Switch, Container, ErrorBlock, Loading, LeanTable, ResponsiveDialog, Flag, etc.
  }}
  app={{
    router: { push, back },
    stores: { useUserStore /* etc. */ },
    APP_CONFIG: { api: { xylex: "https://api.example.com" } },
    useNotification, // function or { notify }
    useApiClient,    // optional
  }}
>
  <App />
</ResourceFrameworkProvider>
```

2) Use headless constructors and hooks

Import constructors, hooks, types from the root. Components from the subpath:

```ts
import { defineColumns } from "resource-framework";
import { ResourceTable } from "resource-framework/components";
```

3) Minimal example

```tsx
import { defineColumns } from "resource-framework";
import { useResourceColumns } from "resource-framework";
import { ScopeCell } from "resource-framework/components";

const fieldSpecs = [
  { column_name: "status", field_type: "select" },
  { column_name: "invoice_total", use: "currency" },
  { column_name: "scope", use: "string" },
];

// Your route shape may include { columns: fieldSpecs, ... }
const route = { columns: fieldSpecs };
const columns = useResourceColumns(route);

// Render a cell directly if you need
<ScopeCell scope="formation_nl_bv" />;
```

## Key APIs

- defineColumns(specs): maps high-level field specs into table-oriented column specs (editable hints, masks, href templates)
- useResourceColumns(route): builds @tanstack/react-table column defs from your route’s `columns`
- useUserScopes(): fetches enabled permission scopes for the current user (uses headers X-Company-Id, X-Organization-Id, X-User-Id)
- useUserPreferences(): tiny localStorage-backed preferences helper
- useQueryFilters(searchParams): parses `?filters=` JSON into normalized filter objects

See docs for details.

## Documentation

- docs/guides/quickstart.md — end-to-end quickstart
- docs/overview.md — less technical overview and product goals
- docs/adapters/setup.md — how to wire up UI + App adapters
- docs/constructors/define-columns.md — column spec and editor hints
- docs/hooks/* — hooks reference
- docs/components/* — available cells and UI wrappers
- docs/api/openapi.yaml — OpenAPI spec of endpoints used by the library
- docs/api/postman.collection.json — Postman collection mirroring the same endpoints

If you’re viewing this on npm, the full docs are also in the GitHub repository.

## Adapter surface (at a glance)

```ts
type UI = {
  Button: React.ComponentType<any>;
  Badge: React.ComponentType<any>;
  Input: React.ComponentType<any>;
  // Optional: Select, Switch, Container, ErrorBlock, Loading, LeanTable, ResponsiveDialog, Flag, cn
};

type App = {
  router?: { push: (href: string) => void; back: () => void };
  stores?: { useUserStore?: Function; [k: string]: any };
  useNotification?: (() => { notify?: (m: any) => void }) | ((m: any) => void);
  useApiClient?: () => { get: Function; post: Function };
  APP_CONFIG?: Record<string, any>; // e.g., { api: { xylex: "…" }, telemetry: { … } }
};
```

Provide only what you need; headless functions don’t require UI.

## Scripts

- build: produces ESM, CJS, and type declarations under `dist/`
- test: runs unit tests (if Vitest is configured in your workspace)
- typecheck: `tsc --noEmit`

## Testing

This package is compatible with Vitest/Jest. Recommended setup:

```bash
npm i -D vitest @types/node
```

Example test (pseudo):

```ts
import { describe, it, expect } from "vitest";
import { defineColumns } from "resource-framework";

describe("defineColumns", () => {
  it("maps field types", () => {
    const built = defineColumns([{ column_name: "status", field_type: "select" }]);
    expect(built[0].editable?.type).toBe("select");
  });
});
```

## OpenAPI / Postman

- docs/api/openapi.yaml captures the two service endpoints used by defaults:
  - POST /fetch/data — fetch rows with simple conditions
  - PUT /data/insert — insert a row into a table
- docs/api/postman.collection.json — request templates with header variables

If your backend differs, adapt the calls via your `app` adapter.

## Versioning

Follows semver. Minor releases may add non-breaking APIs. Major releases may refactor adapter shapes with a guided migration.

## Contributing

Issues and PRs welcome. Please include unit tests for changes in headless logic, and keep UI-specific logic behind the adapter boundary.

## License

MIT © XYLEX Group — <https://xylex.group>

---

## Deep dive (comprehensive)

This section explains the “why” and “how” in detail, with practical patterns you can copy-paste into your app.

### Vision and non-goals

- Goals
  - Deliver database-backed pages (lists + drilldowns + forms) quickly and consistently.
  - Centralize conventions (filters, columns, editing) so UX is predictable across resources.
  - Stay framework-agnostic for UI/routing by injecting your own primitives through adapters.
  - Encourage schema-driven development: declare intent, let the framework do the wiring.

- Non-goals
  - Replacing your design system. Bring your own components.
  - Being a server or ORM. You call your own APIs; we provide client-side conventions.
  - Lock-in. Everything is composable and replaceable at the boundaries.

### Architecture at a glance

- Headless core: constructors (e.g., `defineColumns`), hooks, types, and utilities. These are pure and don’t import your app.
- Adapter layer: a tiny context (`ResourceFrameworkProvider`) where your app provides UI components (Button, Badge, etc.), router helpers, stores, and optional helpers (notifications, API client).
- Optional components: cells like `ScopeCell` and `AssigneesCell` that use the adapter-provided UI.
- Registries: places where shared behavior is declared (e.g., a filter registry, or your own resource routes registry in the host app).

This separation lets you standardize “what” and “why” in the core, while “how it looks” and “how you navigate” stay under your control.

### Adapter contract (UI + App)

You can start with the minimum and add more as you adopt more features.

```ts
type UI = {
  Button: React.ComponentType<any>;
  Badge: React.ComponentType<any>;
  Input: React.ComponentType<any>;
  // Optional:
  // Select (Root/Trigger/Content/Item), Switch, Container,
  // ErrorBlock, Loading, LeanTable, ResponsiveDialog, Flag, cn(...)
};

type App = {
  router?: { push: (href: string) => void; back: () => void };
  stores?: {
    useUserStore?: Function; // { user: { user_id, organization_id, company_id } }
    // useViewStore/useBackButtonStore/etc. can be added as your app needs
  };
  useNotification?: (() => { notify?: (m: any) => void }) | ((m: any) => void);
  useApiClient?: () => { get: Function; post: Function };
  APP_CONFIG?: {
    api?: { xylex?: string };
    telemetry?: { xbp_telemetry?: string | number | boolean };
    [k: string]: any;
  };
};
```

Provide these via:

```tsx
import { ResourceFrameworkProvider } from "resource-framework/adapters";

<ResourceFrameworkProvider ui={UI} app={APP}>
  <App />
</ResourceFrameworkProvider>
```

Then consume anywhere via:

```ts
import { useUI, useApp } from "resource-framework/adapters";
const { Button } = useUI();
const { router, stores, APP_CONFIG } = useApp();
```

### Resource routes (concept + examples)

Resources are your data screens (e.g., `invoices`, `transactions`, `customers`). You maintain a registry keyed by resource name and resolve entries by name when rendering list/drilldown pages.

Basics (host app example):

```ts
// registries/resource-routes.ts (in your app)
export type ResourceRouteEntry = {
  name?: string;
  title?: string;
  path?: string; // index path
  drilldownPathTemplate?: string; // e.g., "/v2/invoices/{{uuid}}"
  columns?: Array<
    | string
    | {
        column_name?: string; // canonical name
        key?: string;         // legacy alias – treated like column_name
        header?: string;
        use?: string;         // map to a registry renderer (e.g., "status", "currency")
        label?: string;       // template for masked cell labels
        href?: string;        // template for per-row links, e.g., "/v2/customers/{{customer_id}}"
        order?: number;
        category?: string;    // tab grouping
      }
  >;
  categories?: string[]; // tab order in edit mode
  // ...search/edit policies, creation scopes, etc.
};

export const resourceRoutes: Record<string, ResourceRouteEntry> = {};
export function getResourceRoute(name: string): ResourceRouteEntry | null {
  return resourceRoutes[name] ?? null;
}
```

Register a route (simple):

```ts
import { resourceRoutes } from "@/registries/resource-routes";

resourceRoutes["invoices"] = {
  name: "invoices",
  title: "Invoices",
  path: "/v2/invoices",
  drilldownPathTemplate: "/v2/invoices/{{uuid}}",
  columns: [
    { key: "invoice_nr", header: "Invoice" },
    { key: "invoice_total_incl_vat", use: "invoice_total_incl_vat" },
  ],
};
```

Tabbed edit with categories (using `defineColumns`):

```ts
import { defineColumns } from "resource-framework";

export const resourceRoutes = {
  customers: {
    path: "/v2/customers",
    drilldownPathTemplate: "/v2/customers/{{customer_id}}",
    categories: ["Basic", "Address", "Business"],
    columns: defineColumns([
      { column_name: "name", header: "Name", category: "Basic" },
      { column_name: "email", category: "Basic" },
      { column_name: "street_address", category: "Address" },
      { column_name: "city", category: "Address" },
      { column_name: "company_number", category: "Business" },
    ]),
  },
};
```

Per-column links (masked labels):

```ts
columns: [
  {
    column_name: "customer_id",
    label: "Customer {{customer_id}}",
    href: "/v2/customers/{{customer_id}}",
  },
];
```

Dynamic routes

If `getResourceRoute(resourceName)` returns null, your host app can fall back to a `resource_routes` DB table that mirrors the same shape. This is useful for operations-driven changes without deploys. You control the fetch code and can merge/override static entries.

### Columns and renderers

Use the `globalColumnRegistry` under the hood (via `defineColumns`) to map common fields to opinionated renderers (status badges, currency, dates, percentages, booleans, JSON, country flags, masked links, etc.). Each renderer advertises metadata like `datatype` and `filterable`, and may include sensible sorting functions.

- `label` (template): overrides header text, can also mask the cell value (via `cell_value_mask_label`).
- `href` (template): turns a column into a link per row. Templates resolve token paths (e.g., `{{customer.id}}`).
- `editor` hints: suggest field editors in drilldown edit mode (select/text/boolean).
- Width + layout: `minWidth`, `maxWidth`, `widthFit`, `enableNoSelect`, `enableNoWrap` feed into `meta`.

Define columns programmatically:

```ts
const built = defineColumns([
  { column_name: "status", field_type: "select" },
  { column_name: "invoice_total_incl_vat", use: "invoice_total" },
  { column_name: "country_code", use: "country_code" },
  {
    column_name: "customer",
    label: "Customer {{customer.name}}",
    href: "/v2/customers/{{customer.id}}",
  },
]);
```

### Filters (URL ↔ server friendly)

Use `useQueryFilters(searchParams)` to parse a JSON-encoded `filters` param into normalized objects (`{ column, op, value }`). Keep your server contract simple by translating UI input into predictable operators such as `=`, `!=`, `>`, `<`, `contains`, `starts_with`, `ends_with`.

Example URL: `?filters=[{"column":"status","op":"=","value":"paid"}]`

You can also support “multi” inputs by expanding an array of values into repeated operators (`column=...` multiple times) in your API client, or let the server handle array semantics.

### Forms (shared, schema‑driven flows)

- Purpose: build multi-step workflows (onboarding, settings changes) without bespoke boilerplate.
- Shapes:
  - v1: `{ entity: string, steps: Record<string, FormField[]> }`
  - v2: `{ entity, ui?, state?, steps: Array<{ key, title, fields, actions? }> }`
- Normalization: v2 is normalized to v1 at runtime; advanced widgets are mapped to simpler primitives:
  - `group` → flatten into fields with `<group>_` key prefix
  - `radio_cards` → radio
  - `pricing_cards` → select
  - `dynamic_list` → table (columns from `itemFields`)
  - `help_card` → note
  - `promo_code` → text
  - `summary_card` → skipped (UI-only)
  - single checkbox → switch

Supported field types include: `text`, `email`, `date`, `tel`, `number`, `select`, `radio`, `textarea`, `file`, `checkbox`, `table`, `note`, `switch`, `calculated`, `conditional_note`, `country_code`, `file_explorer`.

Defaults & validation

- Defaults: use `default_value` where possible. Numbers can fall back to `min` or `0`. Dates default to `null`.
- Validation: per-field errors render under the field. Use `error_key` to deduplicate repeated errors.

Schema storage & routing

- Store schemas in `public.resource_forms` (or your own table).
- Route by slug (e.g., `/sf-formation/[slug]`) and fallback to bundled schemas if DB miss.

Uploads & country UX

- Generic `country` fields (no options) render a full selector but persist the exact value your schema expects (e.g., “USA”/“Other” or ISO codes).
- `file_explorer` integrates with a `FileUploadZone` to keep uploads organized.

### Hooks overview

- `useUserScopes({ cache_enabled?: boolean })`:
  - Fetches permission scopes for the current user using headers (`X-Company-Id`, `X-Organization-Id`, `X-User-Id`).
  - Caches by default (opt out with `{ cache_enabled: false }`).
  - Returns `{ scopes: string[], hasScope: (req,opts?) => boolean, isLoading: boolean }`.

- `useUserPreferences()`:
  - Returns `[prefs, setPrefs]` and stores lightweight preferences in `localStorage` under `resource-framework:preferences`.

- `useQueryFilters(searchParams)`:
  - Parses a `filters` JSON string into normalized filter objects for your API client.

- `useResourceColumns(route)`:
  - Converts a route’s `columns` spec into `@tanstack/react-table` column definitions via `defineColumns`.

### Utilities

- `coerceByDatatype(value, datatype)`:
  - Coerce values in forms/editors safely (e.g., string ↔ number ↔ boolean ↔ date).

- Template helpers (e.g., `utils/templates`) to replace `{{token}}` paths in `href` and masked labels.

- `insertRow(table, body)`:
  - Thin convenience wrapper around `fetch` for inserts against your API (`/data/insert`), using headers from the adapter’s `useUserStore` and `APP_CONFIG.api.xylex`.

### Cache state registry (host-app pattern)

If your app uses a `useViewStore` or similar, create a “cache state registry” that maps table/column values from API responses into store setters. For example, mapping `user_view_settings.locale` to `useViewStore().setLocale(...)`. Then call `applyCacheStateRegistry("user_view_settings", rows)` after fetching settings.

Benefits: keep server-hydrated UI state in sync via a single, audited mapping.

### Security & privacy

- Never store secrets in the client adapter. Only pass scoped identifiers (company, org, user) and opaque tokens your server expects.

- Prefer RLS (Row Level Security) policies server-side for filtering by user/company; client filters are conveniences, not guarantees.

### Performance notes

- Prefer remote filtering/sorting for large data sets; keep client renderers pure and cheap.

- Virtualize tables if rendering thousands of rows. The framework’s headless bits are agnostic to virtualization; bring your own `LeanTable` implementation via the adapter.

- Memoize column definitions (`useResourceColumns`) and avoid re-creating functions in cell renderers unnecessarily.

### Example: wiring in XYLEX Group

```ts
// app/adapters.tsx
import { ResourceFrameworkProvider } from "resource-framework/adapters";
import * as UI from "@/ui"; // your design system exports
import * as Stores from "@/lib/stores";

const APP = {
  router: { push: (href) => navigate(href), back: () => history.back() },
  stores: { useUserStore: Stores.useUserStore },
  useNotification: () => ({ notify: (m: any) => toast(m.message) }),
  APP_CONFIG: { api: { xylex: process.env.NEXT_PUBLIC_API_URL } },
};

export function Provider({ children }: { children: React.ReactNode }) {
  return <ResourceFrameworkProvider ui={UI as any} app={APP}>{children}</ResourceFrameworkProvider>;
}
```

### Troubleshooting

- “Cannot find module '@/…'” inside the package
  - Ensure you’re not importing your app aliases within the package. Use the adapter hooks instead.

- “Missing UI component X”
  - Provide it in the `ui` adapter or replace the component that references it.

- “Filters don’t apply server-side”
  - Inspect the serialized query you send to the server. Ensure your API understands the operators you derive (`contains`, `starts_with`, etc.).

- “Permission scopes always empty”
  - Confirm `useUserStore().user` contains `user_id`, `organization_id`, and `company_id`, and that your API returns rows for `/fetch/data` with the provided headers.

### Roadmap

- Formal “table” component with pluggable virtualization + adapter-provided row/toolbar slots.

- Richer field editors (server-driven options, async selects) with adapter-provided UI.

- Example “Next.js” and “React Router” adapter presets.

### Glossary

- Resource: a named, navigable data set in your app (backed by a table/view/API).
- Route: the list/drilldown configuration for a resource (paths, columns, edit policy).
- Renderer: a column type that knows how to display/sort/filter a field consistently.
- Adapter: the provider that injects your UI primitives and app services.
- Schema (forms): JSON describing steps/fields, persisted in your database.
