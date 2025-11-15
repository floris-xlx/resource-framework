# defineColumns

`constructors/define-columns.ts` provides:

```ts
defineColumns<TData>(specs: LeanColumnSpec<TData>[]): ColumnDef<TData>[]
```

It is a thin wrapper around `buildColumnsFromRegistry`, accepting the same `LeanColumnSpec` format. Prefer `defineColumns` for a stable, documented entrypoint.

Import:

```ts
import { defineColumns } from "@/packages/resource-framework/constructors/define-columns";
```

Map high-level field specs (with `field_type`, `options`, `data_source`) into table `columns` compatible with `RESOURCE_ROUTES`.

```ts
const columns = defineColumns([
  { column_name: "name", field_type: "text", order: 1 },
  {
    column_name: "status",
    field_type: "select",
    options: [
      { label: "Active", value: "active" },
      { label: "Inactive", value: "inactive" },
    ],
  },
]);
```
