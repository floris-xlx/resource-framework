## Schema — Routes and Registries

### ResourceRouteEntry

Represents a lightweight route entry used by list views and hooks.

```ts
type ResourceRouteEntry = {
  name: string;
  title?: string;
  path?: string;
  drilldownPathTemplate?: string; // e.g. `/v2/${name}/{{uuid}}`
  columns?: any[]; // see Field specs for shapes
};
```

Example:

```ts
{
  name: "invoices",
  title: "Invoices",
  path: "/v2/invoices",
  drilldownPathTemplate: "/v2/invoices/{{invoice_id}}",
  columns: [{ column_name: "invoice_nr" }, { column_name: "total" }]
}
```

### ResourceRouteRegistry and helpers

```ts
type ResourceRouteRegistry = Record<string, ResourceRouteEntry>;
function getResourceRoute(name: string): ResourceRouteEntry | null;
```

Example:

```ts
import {
  resourceRoutes,
  getResourceRoute,
} from "@/packages/resource-framework/registries/resource-routes";

resourceRoutes["invoices"] = {
  name: "invoices",
  title: "Invoices",
  path: "/v2/invoices",
};

const invoices = getResourceRoute("invoices");
```

### NewResourceContext

Passed to `newResourceOnClick` for imperative “create” flows.

```ts
type NewResourceContext = {
  user: any;
  router: any;
  clearState?: () => void;
  setInvoice?: (inv: any) => void;
  setQuote?: (quote: any) => void;
  setLineItems?: (li: any[]) => void;
  setLoading?: (b: boolean) => void;
  setError?: (err: string) => void;
};
```

### ResourceRoute

The primary resource definition used by table and drilldown UIs.

```ts
type ResourceRoute = {
  table: string;
  idColumn: string;
  path?: string;
  categories?: string[]; // tab order for drilldown edit
  schema?: string;
  permanent_edit_state?: boolean;
  force_remove_back_button_store_on_index_resource?: boolean;
  enableSearch?: boolean;
  searchBy?: string;
  sidebar_route?: string;
  avatar_column?: string;
  icon?: string; // lucide-react icon name
  enableNewResourceCreation?: boolean;
  newResourceButtonText?: string;
  newResourceHref?: string;
  newResourceOnClick?: (ctx: NewResourceContext) => Promise<void> | void;
  page_label?: string;
  forceWrappingHeaderLabels?: boolean;
  disableCompanyFilter?: boolean;
  drilldownRoutePrefix?: string;
  drilldownHref?: string | ((row: any) => string);
  columns?: Array<string | { column_name: string /* see Fields schema */ }>;
  companyIdColumn?: string;
  edit?: {
    enabled?: boolean;
    allowedColumns?: string[];
    deniedColumns?: string[];
    scope?: string;
    IgnoreCompanyCheckBeforeMutation?: boolean;
  };
  rowActions?: Array<
    | {
        label: string;
        onClick: (row: any) => void;
        destructive?: boolean;
        disabled?: boolean | ((row: any) => boolean);
      }
    | { type: "separator" }
  >;
  customComponent?: any;
  drilldownCustomComponent?: any;
  chat?: {
    table: string;
    foreignKeyColumn: string;
    messageColumn?: string;
    authorUserIdColumn?: string;
  };
};
```

Example:

```ts
import { defineColumns } from "@/packages/resource-framework/constructors/define-columns";

export const RESOURCE_ROUTES = {
  customers: {
    table: "customers",
    idColumn: "customer_id",
    page_label: "Customers",
    drilldownRoutePrefix: "/customers",
    enableSearch: true,
    searchBy: "name,email,status",
    categories: ["Basic", "Address", "Business"],
    edit: {
      enabled: true,
      scope: "edit:customers",
      deniedColumns: ["customer_id"],
    },
    columns: defineColumns([
      { column_name: "name", category: "Basic" },
      { column_name: "email", category: "Basic" },
      { column_name: "street_address", category: "Address" },
      { column_name: "city", category: "Address" },
      { column_name: "company_number", category: "Business" },
    ]),
  },
} as const;
```
