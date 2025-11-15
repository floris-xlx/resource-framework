# Routes

A route entry defines how to list and drill into a resource:

- `path`: index path
- `drilldownPathTemplate`: `"/v2/invoices/{{uuid}}"`
- `columns`: array from `defineColumns` or raw specs
- `categories`: tab order in edit mode

Example:

```ts
resourceRoutes["invoices"] = {
  path: "/v2/invoices",
  drilldownPathTemplate: "/v2/invoices/{{uuid}}",
  columns: [
    { key: "invoice_nr", header: "Invoice" },
    { key: "invoice_total_incl_vat", use: "invoice_total_incl_vat" }
  ],
};
```
