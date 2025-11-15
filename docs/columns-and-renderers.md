# Columns and renderers

This guide explains how columns are resolved and how to use built-in renderers like `assignees`.

## How rendering works

- You declare columns using `defineColumns` or directly in a `ResourceRoute.columns` array.
- Each column resolves to a renderer from `globalColumnRegistry` based on:
  - `use` (if provided), otherwise the column `key`/`column_name`.
- Registry entries return a `ColumnDef` consumed by `ResourceTable`.
- Column metadata is exposed on `col.meta` to power filters and settings:
  - `meta.datatype`, `meta.filterable`, `meta.headerText`, etc.

## Field categories (for tabbed edit forms)

- You can add `category?: string` to a column spec to group it under a tab.
- Tabs are ordered by the route-level `categories?: string[]` in `ResourceRoute`.
- Fields with no `category` appear under a default “General” tab.

```ts
defineColumns([
  { column_name: "name", header: "Name", category: "Basic" },
  { column_name: "email", header: "Email", category: "Basic" },
  { column_name: "street_address", header: "Street", category: "Address" },
]);
```

## Built-in: assignees

The `assignees` renderer expects a JSON array of user objects:

```json
[
  {
    "email": "sayitcapaz@gmail.com",
    "avatar": "https://app.suitsbooks.nl/cache/avatars/sayit.jpg",
    "user_id": "7f988842-73ec-4d9a-bd44-94082aa70a46",
    "username": "sayitcapaz",
    "display_name": "Sayit"
  },
  {
    "email": "floris@xylex.ai",
    "avatar": "https://xylex.ams3.cdn.digitaloceanspaces.com/profilePics/floris.png",
    "user_id": "a29faa58-3d54-412e-b071-679912d9ac35",
    "username": "floris",
    "display_name": "Floris"
  }
]
```

### Display

- Shows up to 2 avatars inline.
- Hover a visible avatar to see the `UserId` card.
- If there are more than 2, a `+N` indicator appears; hovering it shows the remaining assignees.
- Uses `components/layouts/blocks/user-id.tsx` with an `avatar-only` variant for compact cells.

### Usage

- In a resource definition, include a column named `assignees`:

```ts
// packages/resource-framework/registries/resource-routes.ts
columns: [
  // ...
  { column_name: "assignees" },
];
```

- Or via `defineColumns`:

```ts
import { defineColumns } from "@/packages/resource-framework/constructors/define-columns";
const columns = defineColumns([
  { column_name: "assignees", header: "Assignees" },
]);
```

No extra wiring is needed—`globalColumnRegistry.assignees` resolves automatically.

### Customization

- To change the header label, provide `header` or `header_label`.
- To replace the renderer, set `use` to a custom registry key and register your own builder.
- To mask the cell text or add links, use `cell_value_mask_label` and/or `href` templates.

## Tips

- Prefer semantic keys (`status`, `country_code`, `assignees`) to leverage built-ins.
- Use `formatter` for simple value transforms; prefer registry entries for reusable UI.
- Keep cell content compact; defer details to hover or drilldown.
