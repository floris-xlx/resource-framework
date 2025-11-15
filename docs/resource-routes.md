## Resource routes

Describe how a table or view appears in the list and drilldown, and which behaviors are enabled. Routes are defined in `packages/resource-framework/registries/resource-routes.ts`. When a static entry is missing, the components can load a row from the `resource_routes` database table.

### What a route controls

- table and id columns, optional schema
- search configuration (`enableSearch`, `searchBy`)
- columns to display (and their labels, widths, links)
- edit policy (allowed/denied columns, scope)
- drilldown behavior (prefix, custom href, permanent edit mode)
- creation behavior (scopes, optional dialog / onClick)
- per‑resource caching (`force_no_cache`), sidebar scoping, page labels

### Minimal example

```ts
export const RESOURCE_ROUTES = {
  invoices: {
    table: "invoices",
    idColumn: "invoice_id",
    enableSearch: true,
    searchBy: "invoice_nr,recipient_company,status",
  },
} as const;
```

### Columns

- Use `defineColumns` for convenience or provide a raw `columns` array with `column_name` and optional display metadata.
- Optionally add `href` with `{{column}}` placeholders to link to related entities.

### Edit policy

- Enable edits with `edit.enabled: true`
- Use `allowedColumns` / `deniedColumns` to restrict which fields can be updated
- Gate edits behind a `scope` string if needed

### Caching

- Set `force_no_cache: true` to always send `Cache-Control: no-cache`
- Set `force_no_cache: false` to always allow cache
- Omit to fall back to the scope‑based default (see caching.md)

### Static vs database‑driven

- If a static entry is present, it is used as‑is
- If missing, the components try to load `resource_routes` for the current `resource_name` or `table` and map fields into `ResourceRoute`

### Categories (tabbed edit)

- Add `categories?: string[]` to declare the tabs order
- Add `category?: string` per column to group fields into those tabs on the drilldown edit page