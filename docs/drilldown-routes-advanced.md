## Drilldown routes — deep dive

This page explains the `RESOURCE_DRILLDOWN_ROUTES` registry in detail: how titles, sections, and actions are defined; how custom paths are generated; and how the drilldown UI interprets your configuration.

### The registry

File: `packages/resource-framework/registries/resource-drilldown-routes.ts`

```ts
export type ResourceDrilldownRoute = {
  title?: (row: any) => string;
  subtitle?: (row: any) => string;
  backLabel?: string | ((resourceName: string) => string);
  actions?: DrilldownAction[];
  sections?: DrilldownSectionConfig[];
  pathTemplate?: string; // e.g. "/v2/${name}/{{uuid}}"
};

export type DrilldownSectionConfig = {
  title: string;
  columns?: 1 | 2 | 3 | 4;
  fields: DrilldownField[];
};

export type DrilldownField =
  | string
  | { key: string; label?: string; hidden?: boolean };

export type DrilldownAction =
  | {
      label: string;
      onClick: (row: any) => void;
      destructive?: boolean;
      disabled?: boolean | ((row: any) => boolean);
    }
  | { type: "separator" };
```

### Titles and subtitles

- `title(row)` should return a concise primary heading derived from the row (e.g., “Invoice INV-123”).
- `subtitle(row)` is optional secondary context (e.g., “Draft • EUR 250.00”).
- `backLabel` can be a string or a function; it labels the “back” link in the page shell.

### Sections

Sections group fields visually. Each section has:

- `title`: the section heading.
- `columns`: grid density (1–4). Defaults to 1.
- `fields`: field keys to render, in order. Each field can be:
  - a string (the raw key to render), or
  - an object `{ key, label?, hidden? }` to override the label or hide it.

Rendering rules:

- The drilldown uses the same column/renderer registry as list views. This keeps formatting consistent between list and detail pages.
- If a field key doesn’t exist on the row, it renders blank (or may be omitted based on UI heuristics).
- Use `hidden: true` for fields you want available to custom renderers but not displayed in the default layout.

Tips:

- Prefer human labels for ambiguous keys via `{ key: "sla_agreed_response", label: "SLA agreed response" }`.
- Group related fields into separate sections (“General”, “Address”, “Compliance”) to improve scannability.

### Actions

The `actions` array defines the menu in the drilldown header:

- Each action gets `label` and an `onClick(row)` handler.
- Use `destructive: true` to style actions like “Delete” accordingly.
- `disabled` can be a boolean or function per row.
- Insert `{ type: "separator" }` to group actions.

Examples:

```ts
actions: [
  { label: "Open in external", onClick: (row) => window.open(row.url) },
  { type: "separator" },
  {
    label: "Delete",
    destructive: true,
    disabled: (row) => row.status === "locked",
    onClick: async (row) => {/* ... */},
  },
];
```

### Custom paths

Use `pathTemplate` to define a custom drilldown path for a resource. Placeholders are replaced with values from a payload:

```ts
pathTemplate: "/v2/invoices/{{invoice_id}}"
```

Helper provided in the registry:

```ts
getDrilldownPath(name, payload) // replaces {{key}} and nested {{a.b.c}}
```

### How the drilldown integrates with routes

- The drilldown component reads the route from `RESOURCE_ROUTES` (static) or from the `resource_routes` table (when a static entry is missing).
- `categories` on the `ResourceRoute` control tab grouping when editing.
- `permanent_edit_state` forces the page into edit mode on load.
- Field rendering uses the same `defineColumns`/registry pipeline as the list tables.

### Best practices

- Keep the title short; put context in the subtitle.
- Use 2 columns for most sections; switch to 1 for long-form text.
- Ensure destructive actions confirm the intent before mutating.
- Avoid overloading the page with rarely used fields—hide or move them to a final “Other” section.

### Troubleshooting

- A field does not render: check the field key exists in the fetched row and isn’t filtered out by the column registry.
- Actions disabled inconsistently: ensure your `disabled(row)` logic is pure and fast (no async work).
- Custom path doesn’t navigate as expected: verify placeholders match payload keys exactly; use `getDrilldownPath` during development to inspect the resolved string.
*** End Patch

