# Column registry

`constructors/column-registry.tsx` exports:

- `globalColumnRegistry`: common column builders for common keys and datatypes
- `buildColumnsFromRegistry(specs)`: builds `ColumnDef[]` from `LeanColumnSpec[]`
- `defaultEditorByColumn`: suggestions for editor UIs

Usage:

```ts
import { defineColumns } from "@/packages/resource-framework/constructors/define-columns";

const columns = defineColumns([
  "status",
  { key: "amount", use: "amount", header: "Amount" },
]);
```

Import:

```ts
import {
  globalColumnRegistry,
  buildColumnsFromRegistry,
  type LeanColumnSpec,
} from "@/packages/resource-framework/constructors/column-registry";
```

## Lean spec → ColumnDef

```ts
const specs: Array<LeanColumnSpec<any>> = [
  { key: "status", header: "Status" },
  { key: "amount", use: "amount" },
];
const cols = buildColumnsFromRegistry(specs);
```

### Built‑in keys

- Status, month, currency, date/time, boolean, country code, json, break-all text, generic text
- Assignees (JSON array) → renders up to 2 avatars with hover and `+N` overflow
- Sorting and filterability carried as `col.meta.{datatype,filterable,headerText}`
