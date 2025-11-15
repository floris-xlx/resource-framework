# Quickstart

1) Provide adapters

```tsx
import { ResourceFrameworkProvider } from "resource-framework/adapters";

<ResourceFrameworkProvider
  ui={{ Button, Badge, Input }}
  app={{ router: { push, back }, stores: { useUserStore }, APP_CONFIG }}
>
  <App />
</ResourceFrameworkProvider>
```

2) Define columns and render

```ts
import { defineColumns } from "resource-framework";
const columns = defineColumns([{ column_name: "status", field_type: "select" }]);
```

3) Optional cells

```tsx
import { ScopeCell } from "resource-framework/components";
<ScopeCell scope="formation_nl_bv" />;
```


