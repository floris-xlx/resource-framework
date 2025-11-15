## Cache state registry

Hydrate client view state directly from API responses in a structured, type‑safe way. The registry maps table/column pairs to zustand setters in `useViewStore`.

### What it does

- Defines a mapping: `table -> column -> setter(value)`
- Provides `applyCacheStateRegistry(tableName, rows)` to apply one or many rows
- Ships with defaults for `public.user_view_settings`

### Why it exists

- Centralize how server‑side preferences update the client
- Keep conversions explicit (booleans, numbers, enums)
- Avoid ad‑hoc state wiring throughout the UI

### Extend it

1) Add your table under the registry map  
2) Add each column key and point it to the appropriate `useViewStore` setter  
3) Convert values defensively (e.g., `Boolean(value)`, number parsing)

Source: `lib/cache-state-registry.ts`
