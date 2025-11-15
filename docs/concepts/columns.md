# Columns

Define columns by hand or with `defineColumns`. Common renderers cover status, currency, dates, booleans, JSON, country flags, and masked links.

Per-column options:

- `header`, `use`, `order`, `category`
- `label` (template): masked cell text
- `href` (template): per-row link
- width/layout: `minWidth`, `maxWidth`, `widthFit`, `enableNoSelect`, `enableNoWrap`
- editor hints: `editable.type` is derived from `field_type` or defaults

Example:

```ts
defineColumns([
  { column_name: "status", field_type: "select" },
  { column_name: "invoice_total_incl_vat", use: "invoice_total" },
  { column_name: "country_code", use: "country_code" },
  {
    column_name: "customer",
    label: "Customer {{customer.name}}",
    href: "/v2/customers/{{customer.id}}"
  }
]);
```


