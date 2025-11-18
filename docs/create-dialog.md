### Create dialog

- Required fields: cannot receive automatic defaults (even if a column has `default_value`).
- Optional fields: may use `default_value` from column config or `defaultValues` prop.
- Select inputs: supported via `editor: { type: "select", options: [...] }` on column specs.
- Key–value fields: always available, bound to the metadata column:
  - Default column is `metadata`
  - Can be overridden via `resource_routes.metadata_column` (sql alter provided)

