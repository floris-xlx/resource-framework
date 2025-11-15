# Resources

A resource is a named data screen (e.g., `invoices`, `customers`). You keep a registry keyed by name.

- `resourceRoutes[name]` → a route entry
- `getResourceRoute(name)` → resolves the entry or `null`

Dynamic routes: when missing, read from a DB `resource_routes` table and merge overrides.
