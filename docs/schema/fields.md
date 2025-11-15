## Schema — Field Specs and Built Columns

### Primitives

```ts
type FieldDataType =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "json"
  | "timestamp"
  | "uuid"
  | "other";
type FieldInputType =
  | "text"
  | "number"
  | "boolean"
  | "select"
  | "date"
  | "textarea";
type DataSourceRef = string | { table: string; column: string };
type SelectOption = { value: string | number | boolean; label: string };
```

Example:

```ts
const options: SelectOption[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];
```

### ResourceFieldSpec

Declarative input/formatting metadata for a field in a resource.

```ts
type ResourceFieldSpec = {
  column_name: string;
  header?: string;
  header_label?: string;
  label?: string;
  href?: string;
  hidden?: boolean;
  category?: string; // Tab grouping
  order?: number;
  minWidth?: number;
  maxWidth?: number;
  widthFit?: boolean;
  cell_value_mask_label?: string;
  formatter?: (
    value: any,
    row: any,
  ) => React.ReactNode | string | number | null | undefined;
  use?: string;

  // typing + editing
  data_type?: FieldDataType;
  field_type?: FieldInputType;
  options?: SelectOption[];
  data_source?: DataSourceRef;

  // update hints
  update_table?: string;
  update_id_column?: string;
  update_column?: string;
};
```

Example:

```ts
const customerFields: ResourceFieldSpec[] = [
  { column_name: "name", header_label: "Name", category: "Basic" },
  { column_name: "email", header_label: "Email", category: "Basic" },
  {
    column_name: "status",
    field_type: "select",
    options: [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
    ],
  },
  { column_name: "street_address", category: "Address" },
];
```

### BuiltColumnSpec

The shape consumed by table/drilldown renderers after `defineColumns` compiles specs.

```ts
type BuiltColumnSpec = {
  column_name: string;
  header?: string;
  header_label?: string;
  use?: string;
  order?: number;
  href?: string;
  hidden?: boolean;
  label?: string;
  category?: string;
  cell_value_mask_label?: string;
  formatter?: (value: any, row: any) => any;
  minWidth?: number;
  maxWidth?: number;
  widthFit?: boolean;
  editable?: {
    type: "text" | "select" | "boolean";
    update_table?: string;
    update_id_column?: string;
    update_column?: string;
    options?: Array<{ label: string; value: string | number | boolean }>;
    data_source?: string | { table: string; column: string };
  };
};
```

Example (result of defineColumns):

```ts
const built: BuiltColumnSpec[] = [
  { column_name: "name", header_label: "Name", category: "Basic" },
  {
    column_name: "status",
    editable: {
      type: "select",
      options: [{ label: "Active", value: "active" }],
    },
  },
];
```
