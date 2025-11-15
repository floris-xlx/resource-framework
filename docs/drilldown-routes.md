## Drilldown routes

Configure the drilldown page experience for a resource: titles, sections, and actions. The registry lives in `packages/resource-framework/registries/resource-drilldown-routes.ts`.

### What a drilldown route controls

- title and optional subtitle (functions receive the row)
- optional back label text
- sections: group fields into 1–4 columns
- actions: per‑row action menu items
- optional `pathTemplate` for custom linking

### Minimal example

```ts
export const RESOURCE_DRILLDOWN_ROUTES = {
  invoices: {
    title: (row) => `Invoice ${row?.invoice_nr ?? ""}`,
    sections: [{ title: "Main", columns: 2, fields: ["invoice_nr", "status"] }],
  },
} as const;
```

### Sections

- Each section has a `title`, optional `columns` (1–4), and `fields`
- A field can be a string key or `{ key, label, hidden }`
- Rendering uses the same column registry as lists, so values remain consistent

### Actions

- Provide an array of actions: `{ label, onClick(row), destructive?, disabled? }`
- Include `{ type: "separator" }` to visually group actions

### Custom paths

- Use `pathTemplate` to generate a concrete path with `{{placeholders}}`
- The helper `getDrilldownPath(name, payload)` replaces placeholders with values from `payload` (supports nested `a.b.c` keys)
