## Schema — Hooks

### useResourceRoute(name)

Resolves a `ResourceRouteEntry` by name from the static registry.

```ts
function useResourceRoute(resourceName: string): ResourceRouteEntry | null;
```

Example:

```ts
import { useResourceRoute } from "@/packages/resource-framework";

const route = useResourceRoute("invoices"); // { name: "invoices", ... } or null
```

### useResourceColumns(route)

Compiles a route’s `columns` into TanStack `ColumnDef[]` using `defineColumns`.

```ts
function useResourceColumns<TData = Record<string, unknown>>(
  route: ResourceRouteEntry | null,
): ColumnDef<TData>[];
```

Example:

```ts
import { useResourceColumns } from "@/packages/resource-framework";

const columns = useResourceColumns(route);
```
