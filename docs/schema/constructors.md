## Schema — Constructors and Registry

### defineColumns

Builds `BuiltColumnSpec[]` from `ResourceFieldSpec[]`, mapping `field_type` and options to an `editable` shape and preserving `category`.

```ts
function defineColumns(specs: ResourceFieldSpec[]): BuiltColumnSpec[];
```

Example:

```ts
import { defineColumns } from "@/packages/resource-framework/constructors/define-columns";

const columns = defineColumns([
  { column_name: "name", header_label: "Name", category: "Basic" },
  {
    column_name: "status",
    field_type: "select",
    options: [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
    ],
  },
]);
```

### LeanColumnSpec<TData>

Used by the column registry to build `ColumnDef` entries for the table and drilldown renderers.

```ts
type LeanColumnSpec<TData> =
  | keyof TData
  | {
      key: Extract<keyof TData, string | number>;
      header?: string;
      use?: string;
      order?: number;
      label?: string;
      href?: string;
      cell_value_mask_label?: string;
      formatter?: (value: any, row: TData) => any;

      minWidth?: number;
      maxWidth?: number;
      widthFit?: boolean;
      enableNoSelect?: boolean;
      enableNoWrap?: boolean;

      viewHook?: (row: TData) => any;
      viewRender?: (viewResult: any, row: TData) => React.ReactNode;

      editor?: {
        type?: "text" | "number" | "boolean" | "select";
        options?: Array<{ value: string | number | boolean; label: string }>;
      };
    };
```

Example:

```ts
const lean: Array<LeanColumnSpec<any>> = [
  { key: "invoice_nr", header: "Invoice" },
  {
    key: "status",
    header: "Status",
    editor: { type: "select", options: [{ value: "paid", label: "Paid" }] },
  },
];
```

### defaultEditorByColumn

Suggested default editors keyed by column name (optional).

```ts
const defaultEditorByColumn: Record<
  string,
  {
    type: "text" | "number" | "boolean" | "select";
    options?: Array<{ value: string | number | boolean; label: string }>;
  }
>;
```

Example:

```ts
defaultEditorByColumn.status = { type: "select" };
defaultEditorByColumn.closing_enabled = { type: "boolean" };
```
