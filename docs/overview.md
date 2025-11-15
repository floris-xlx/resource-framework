## Resource framework overview

Build database‑backed pages quickly with a small set of conventions and shared UI. Define a resource once, and get a list view, a drilldown view, and consistent forms.

### Key concepts

- resource: a table or view you expose in the UI
- routes: list and drilldown configuration for each resource
- columns/renderers: how values display and edit
- filters: consistent UX that maps to server‑friendly operators
- hooks: fetching, updates, and cache behavior
- forms: multi‑step, schema‑driven flows

### What you get out‑of‑the‑box

- Resource lists with search, sorting, actions, and per‑user display preferences
- Drilldowns with editable fields, sections, and custom components
- Scoped “create” flows and optional custom dialogs
- A shared form engine for schema‑driven pages

## Quick start

1) Add a route in `packages/resource-framework/registries/resource-routes.ts` (table, id column, optional columns).  
2) Navigate to `/v2/[resource]` for the list, `/v2/[resource]/[id]` for drilldown.  
3) Optionally add a drilldown config in `registries/resource-drilldown-routes.ts` for sections, titles, and actions.

Minimal route:

```ts
export const RESOURCE_ROUTES = {
  invoices: { table: "invoices", idColumn: "invoice_id" },
} as const;
```

## Configuration sources

- Static: `RESOURCE_ROUTES` and `RESOURCE_DRILLDOWN_ROUTES` in the registries
- Database overrides: the components will load a matching row from the `resource_routes` table when a static entry is not present

## Caching at a glance

- Default: caching depends on the user scope `xbp_cache_experimental_v2`
- Per‑resource override: set `force_no_cache` on a route to always bypass (true) or always allow (false) cache

See: caching.md

## Forms (shared)

The shared form module lives at `packages/resource-framework/components/form` and is re‑exported by suits‑formations. It renders multi‑step forms from JSON and supports both legacy (v1) and experimental (v2) schema shapes.

## Where to go next

- resource-routes.md — define list pages, search, edit policy, creation
- drilldown-routes.md — titles, sections, actions, and path templates
- columns-and-renderers.md — column meta and renderers
- filter-registry.md — advanced filters and URL mapping
- components.md — `ResourceTable`, `ResourceDrilldown`, and friends
- hooks.md — data fetching, updating, and helpers
- form.md and form-fields.md — schema‑driven forms

All guides live in this folder. Form schemas are stored in `public.resource_forms` in Postgres.
