### Scoped creation (feature flags / scopes)

Resource creation can be gated by scopes:

- In DB (`public.resource_routes`):
  - `create_scope` (jsonb): array of scopes required to submit creation
  - `create_show_button_scope` (jsonb): array of scopes required to show the button
- In code (`ResourceTable`):
  - Button visibility is controlled by `create.showButtonScope`
  - Submit is blocked without `create.scope`

When using DB-driven routes, `new_resource_mandatory_columns` and `new_resource_optional_columns` drive the Create dialog fields.
## Scoped creation and required initial values

This guide explains how to:

- Gate the “New” button and create action by permission scope
- Declare required fields for initial creation
- Use safe drilldown title templating

### Overview

- Scopes come from `public.user_permission_scopes` (enabled rows, global or matching `company_id`).
- Resources can define a `create` section describing:
  - `scope`: scopes required to create
  - `showButtonScope` (optional): scopes required to see the “+” button
  - `required`: array of required fields for initial insert
  - `dialog` (optional): custom dialog component to collect values

All notifications use the notification hook:

```ts
import { useNotification } from "@/components/notifications/base";
const { notification } = useNotification();
```

### Declaring create config

In `packages/resource-framework/registries/resource-routes.ts`:

```ts
customers: {
  table: "customers",
  idColumn: "customer_id",
  create: {
    scope: "create:customers",
    showButtonScope: "create:customers", // optional; defaults to scope
    required: ["name", "email"],
  },
  // ...
}
```

When `create` is present:

- If the user lacks `showButtonScope`, the “New” button is hidden.
- If the user can see but lacks `scope`, clicking “New” shows a notification and blocks creation.
- Otherwise a dialog opens to collect `required` values and performs an insert via the Suitsbooks API.

### Where the logic lives

- `useUserScopes`: fetches and caches the user’s scopes (client-side, using `/fetch/data`).
- `CreateResourceDialog`: generic dialog to collect `required` fields; performs the insert with the prescribed API shape.
- `ResourceTable`: wires button visibility and click behavior to scopes and dialog.

### API calls (workspace conventions)

- Fetch scopes:
  - POST `{APP_CONFIG.api.suitsbooks}/fetch/data`
  - Headers: `X-Company-Id`, `X-Organization-Id`, `X-User-Id`, `Content-Type`, optionally `Cache-Control: no-cache`
- Insert row:
  - PUT `{APP_CONFIG.api.suitsbooks}/data/insert`
  - Body:
    ```json
    {
      "table_name": "TABLE",
      "insert_body": { "field": "value" }
    }
    ```

### Safe drilldown title templating

If a drilldown title contains tokens like `{{CUSTOMER_NAME}}`, any undefined token is stripped and the title is trimmed:

```ts
import { safeTemplate } from "@/packages/resource-framework";

safeTemplate("Customer {{CUSTOMER_NAME}}", { CUSTOMER_NAME: undefined }); // -> "Customer"
```

Applied automatically in `ResourceDrilldown`.

### Example end-to-end

- Route declares `create` with `scope: "create:customers"` and `required: ["name", "email"]`.
- User with `create:customers` sees the “New customer” button; clicking opens the dialog.
- Missing values → `notification({ message: "Please complete required fields", success: false })`.
- Successful insert → `notification({ message: "Created successfully", success: true })` and redirect to the new drilldown.

### Notes

- Buttons follow house style: action buttons `variant="brand"`, icons from `lucide-react` sized with `variant='icon_v2'` and `size='icon_v2'`, and icon color white when used inside brand buttons.
- Dialogs use `components/responsive-dialog.tsx`.
- Country inputs must use 2-letter ISO codes if present elsewhere.
