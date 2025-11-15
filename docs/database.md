## Database reference — resource framework

This page documents the primary tables that configure the resource framework and related UI: `resource_routes`, `resource_forms`, and `resource_charts`. It also notes key indexes and how each table maps to the frontend.

### public.resource_routes

Defines list/drilldown behavior for resources when no static entry is present. The UI loads one row by `resource_name` (or by `table` as a fallback) and maps fields into a `ResourceRoute` object.

Important columns:

- `table` (text): Postgres table/view name to query
- `id_column` (text): primary id column for drilldown links and updates
- `schema` (text, default `public`): optional schema name
- `enable_search` (boolean) and `search_by` (text): list search configuration
- `columns` (json): array of column specs or strings (`{ column_name, ... }`)
- `company_id_column` (text), `disable_company_filter` (boolean): company scoping
- `enable_new_resource_creation` (boolean): show/hide “New” button
- `new_resource_button_text` (text), `new_resource_href` (text): creation UX
- `force_wrapping_header_labels` (boolean): wrap long table headers
- Edit policy: `enable_edit` (boolean), `allowed_columns_edit` (json), `denied_columns_edit` (json), `scope` (text), `ignore_company_check_before_mutation` (boolean)
- `row_actions` (json): optional per-row action configuration
- `avatar_column` (text), `icon` (text), `page_label` (text): display hints
- `permanent_edit_state` (boolean): drilldown opens in edit mode
- `drilldown_route_prefix` (text), `sidebar_route` (text): navigation hints
- `filter_options` (jsonb), `column_datatypes` (jsonb): future extensibility
- `force_remove_back_button_store_on_index_resource` (boolean): UX hint
- `path` (text), `resource_name` (text), `resource_route_id` (uuid): identity and routing
- `new_resource_mandatory_columns` (json), `new_resource_optional_columns` (json): scoped creation config
- `force_no_cache` (boolean): client sends `Cache-Control: no-cache` when true; disables header when false; falls back to scope default when null/omitted (see caching.md)

Uniqueness:

- `resource_routes_resource_name_key` ensures one row per `resource_name`.

Frontend mapping:

- `components/ResourceTable.tsx` and `components/ResourceDrilldown.tsx` map these columns to `ResourceRoute` fields and drive UI accordingly.

### public.resource_forms

Stores schema‑driven forms used across list/drilldown and formation flows.

Important columns:

- `resource_form_id` (uuid, unique): stable reference
- `company_id` (uuid, nullable): optional scoping
- `entity` (text): logical entity (e.g., `customer_signup`)
- `slug` (text, unique): primary lookup key used in routes
- `version` (int): versioning support
- `experimental` (boolean): feature flagging
- `is_active` (boolean): visibility flag
- `schema` (jsonb): the form definition (v1 or v2; see form.md and form-fields.md)
- `error_keys` (jsonb): precomputed analytics/lookup keys extracted from schema
- `tags` (text[]): search/filter helpers
- `description` (text): human description

Indexes:

- GIN on `schema` and `error_keys` for efficient search
- Unique btree on `slug`
- Additional btrees on `entity`, `is_active`, `updated_at`

Frontend mapping:

- Page loads forms by `slug`, falling back by `entity` if needed. The v2 schemas are normalized to v1 at render time (see overview.md).

### public.resource_charts

Configures charts that can be associated with resources or dashboards.

Important columns:

- `table_name` (text): source table for chart data
- `title` (text), `color` (text): presentation
- `target_column` (text): numeric/measure column
- `calculation_strategy` (text): e.g., `sum`, `avg`, `count`, etc.
- `dragonfly_key` (text): cache key for chart data in the cache layer
- `chart_type` (text): e.g., `line`, `bar`, `area`, `kpi`
- `x_axis_group_by` (text): time or categorical grouping (e.g., `day`, `month`, `category`)
- `has_label` (boolean), `label_color_body` (text), `label_color_text` (text): label style
- `is_currency` (boolean), `currency_number_format` (text), `currency` (text): currency formatting controls
- `is_percentage` (boolean): percentage formatting
- `show_last_updated_at` (boolean): display freshness indicator
- `chart_id` (uuid): stable reference
- `enabled` (boolean): toggle chart availability
- `data_endpoint` (text): optional custom endpoint for data source
- `eq_column` (text), `eq_value` (text): optional default filter

Frontend mapping:

- A chart renderer reads this configuration, builds the request (optionally applying `eq_column`/`eq_value`), calls the endpoint or table gateway, and formats output based on currency/percentage flags.

### Operational notes

- Tables include `created_at` and identity keys to simplify audit and pagination.
- Use DB defaults for booleans and string fields where appropriate for predictable client mapping.
- Keep JSON structures small and typed: the UI expects arrays for `columns`, `allowed_columns_edit`, etc.

### Typical queries

- Load a route by name:

```sql
select * from public.resource_routes
where resource_name = $1
limit 1;
```

- Load a form by slug:

```sql
select * from public.resource_forms
where slug = $1 and is_active = true
limit 1;
```

- List enabled charts:

```sql
select * from public.resource_charts
where enabled = true
order by created_at desc;
```
*** End Patch

