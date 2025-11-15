## Filter registry

Filters standardize how list/search UIs express conditions across resources. This module defines the canonical set of operators, which operators are valid per datatype, and a helper to provide select/enum options for filter UIs.

### What it provides

- **`filterRegistry`**: maps datatypes to supported operators
- **Types**: `FilterOperator`, `FilterDefinition`, `FilterRegistry`
- **`getFilterOptions(resourceName, columnName)`**: returns `{label, value}[]` for select/enum-style filters

Import:

```ts
import {
  filterRegistry,
  type FilterOperator,
  type FilterDefinition,
  type FilterRegistry,
  getFilterOptions,
} from "@/packages/resource-framework/registries/filter-registry";
```

### Filter operators

Common operators supported by the framework:

| Operator      | Meaning                      | Example value                   |
| ------------- | ---------------------------- | ------------------------------- |
| `eq`          | equals                       | `"paid"`, `42`, `true`          |
| `neq`         | not equals                   | `"draft"`                       |
| `gt`          | greater than                 | `100`, `"2024-01-01"`           |
| `gte`         | greater than or equal        | `0`                             |
| `lt`          | less than                    | `10`                            |
| `lte`         | less than or equal           | `5`                             |
| `contains`    | substring contains (strings) | `"inv-"`                        |
| `starts_with` | prefix match (strings)       | `"INV"`                         |
| `ends_with`   | suffix match (strings)       | `".pdf"`                        |
| `in`          | value in list                | `["paid","pending"]`, `[1,2,3]` |
| `not_in`      | value not in list            | `["draft"]`                     |
| `is_null`     | value is null                | —                               |
| `is_not_null` | value is not null            | —                               |

> Backends should translate these into the appropriate SQL/DSL. UIs should constrain operator choices to those allowed by the column datatype via `filterRegistry`.

### Supported datatypes → allowed operators

| Datatype  | Allowed operators                                                                             |
| --------- | --------------------------------------------------------------------------------------------- |
| `string`  | `eq`, `neq`, `contains`, `starts_with`, `ends_with`, `in`, `not_in`, `is_null`, `is_not_null` |
| `number`  | `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `in`, `not_in`, `is_null`, `is_not_null`               |
| `boolean` | `eq`, `neq`, `is_null`, `is_not_null`                                                         |
| `date`    | `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `is_null`, `is_not_null`                               |
| `json`    | `is_null`, `is_not_null`                                                                      |
| `other`   | `eq`, `neq`, `is_null`, `is_not_null`                                                         |

Use this mapping to drive operator pickers in filter UIs and to validate payloads before sending to the server.

### Types

```ts
export type FilterOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "contains"
  | "starts_with"
  | "ends_with"
  | "in"
  | "not_in"
  | "is_null"
  | "is_not_null";

export type FilterDefinition = {
  operators: FilterOperator[];
};

export type FilterRegistry = Record<
  "string" | "number" | "boolean" | "date" | "json" | "other",
  FilterDefinition
>;
```

### Getting select/enum options for filters

For select-like filters (e.g., status), use `getFilterOptions(resourceName, columnName)`:

```ts
const options = getFilterOptions("invoices", "status");
// -> [
//   { label: "Draft", value: "draft" },
//   { label: "Pending", value: "pending" },
//   { label: "Paid", value: "paid" },
//   { label: "Overdue", value: "overdue" },
//   { label: "Cancelled", value: "cancelled" },
// ]
```

Extend options by adding entries in the internal `FILTER_OPTIONS` map inside `filter-registry.tsx`:

```ts
// Inside packages/resource-framework/registries/filter-registry.tsx
const FILTER_OPTIONS = {
  invoices: {
    status: [
      { label: "Draft", value: "draft" },
      // ...
    ],
  },
  orders: {
    status: [
      { label: "Open", value: "open" },
      { label: "Closed", value: "closed" },
    ],
  },
} as const;
```

### Using the registry to constrain UI

```ts
function getAllowedOperatorsForDatatype(datatype: keyof typeof filterRegistry) {
  return filterRegistry[datatype].operators;
}

// Example: for a string column
const allowed = getAllowedOperatorsForDatatype("string");
// -> ["eq","neq","contains","starts_with","ends_with","in","not_in","is_null","is_not_null"]
```

Use `allowed` to populate operator dropdowns. For multi-value operators (`in`, `not_in`), render an input that accepts an array of values. For `is_null`/`is_not_null`, render without a value input.

### Notes

- Keep operators backend-agnostic; translate at the API layer.
- Add new datatypes by extending `FilterRegistry` and `filterRegistry` with a clear minimal operator set.
- For enums, prefer `getFilterOptions` to keep UI options consistent across the app.
