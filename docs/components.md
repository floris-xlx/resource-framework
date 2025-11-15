## Components

### ResourceTable

List view for a resource, driven by `RESOURCE_ROUTES` and the column registry.

- Builds columns from route metadata
- Fetches data via `useApiClient`
- Derives quick filters from column meta
- Persists display settings in `user_preferences`
- Supports per‑resource “New” actions (scope‑gated)

When to use: any tabular listing with lightweight filtering/search and actions.

Props: `{ resourceName?: string }`

### ResourceDrilldown

Detail view for a single row. Honors edit policy and optional permanent edit mode.

- Renders fields using the same renderers as the list
- Groups fields into sections (via drilldown routes)
- Handles update flows and success notifications

When to use: a focused page for reading/updating one record.

Props: `{ resourceName?: string; resourceId?: string }`

### Supporting pieces

- Column registry: connects field keys to renderers and editing controls
- Filter registry: maps simple UI filters to server‑side operators
- Hooks: `useApiClient`, `useUpdateData`, `useUserScopes`, and more
