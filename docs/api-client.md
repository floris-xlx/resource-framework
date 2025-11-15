## API client — fetching and mutations

The resource framework ships a thin client hook `useApiClient` used by both list and drilldown views. It standardizes headers, optional caching, and request/response shapes to the suitsbooks API.

### Hook signature

```ts
function useApiClient<T>({
  table,
  conditions,
  columns,
  limit,
  offset,
  enabled,
  noCache,
  single,
  schema,
}: {
  table: string;
  conditions?: Array<{ eq_column: string; eq_value: string | number | boolean }>;
  columns?: string[];
  limit?: number;
  offset?: number;
  enabled?: boolean;
  noCache?: boolean;
  single?: boolean;
  schema?: string; // default: "public"
}): {
  data: T | T[] | null;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  cacheKey: string | null;
  mutate(): Promise<void>;
  insert(row: Partial<T>): Promise<T>;
  insertMany(rows: Partial<T>[]): Promise<T[]>;
  update(idColumn: string, id: string | number, updateBody: Record<string, any>): Promise<T>;
  remove(idColumn: string, id: string | number, updateBody: Record<string, any>): Promise<T>;
};
```

### Requests

- Fetch: `POST {APP_CONFIG.api.suitsbooks}/fetch/data`
  - Headers: `X-Company-Id`, `X-Organization-Id`, `X-User-Id`, `Content-Type`, optionally `Cache-Control: no-cache`
  - Body:
    - `table_name` (string)
    - `schema` (string, optional)
    - `conditions` (array of `{ eq_column, eq_value }`)
    - `columns` (optional string array)
    - `limit` (number), `offset` (number)

Caching header:

- Sent only when `noCache === true`.
- In list/drilldown, `noCache` is resolved from `force_no_cache` (per‑resource) and/or user scope (see caching.md).

### Responses (expected)

All endpoints return JSON. For fetch:

```json
{
  "data": [ /* rows */ ],
  "cache_key": "optional-cache-key"
}
```

Notes:

- `data` can be an array or an object. The hook normalizes to an array; if `single: true`, the first item is returned as `T`.
- `cache_key` (or `cacheKey`) is captured when present for diagnostics.
- Non‑OK responses include an error message in the body where possible; the hook maps it into `error`.

### Mutations

- Insert (single): `PUT {APP_CONFIG.api.suitsbooks}/data/insert`
  - Body: `{ table_name, schema?, insert_body: { ... } }`
- Insert (bulk): same endpoint with `insert_body: rows[]`
- Update: `PUT {APP_CONFIG.api.suitsbooks}/update/data`
  - Body: `{ table_name, schema?, x_column, x_id, update_body }`
- Remove: wrapper over `update/data` that sets `awaiting_archival: true` by convention, plus any extra `updateBody`

Return shape:

```json
{ "data": { /* inserted/updated row */ } }
```

The hook re-fetches (`mutate()`) after successful mutations.

### Conditions

Conditions are provided as an array of equality filters:

```ts
conditions: [
  { eq_column: "company_id", eq_value: user.company_id },
  { eq_column: "invoice_id", eq_value: id },
];
```

Use the URL’s query parameters for ad‑hoc client‑side filtering in list views (see `ResourceTable` advanced filters).

### Error handling

- Network or server errors set `isError: true` and a human‑readable `error` string.
- The hook does not throw; consuming components can show an inline error state.

### Tips

- Provide `columns` to reduce payload size; the table/drilldown will add the id/avatar columns as needed.
- Use `single: true` for drilldowns to fetch just one row and simplify state updates.
- When integrating with database‑driven routes, pass `schema` from the mapped `ResourceRoute` if provided.
*** End Patch

