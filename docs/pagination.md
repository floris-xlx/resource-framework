### Pagination query params

- Supported URL params: `page`, `per_page` (also accepts `rows_per_page`).
- The table reads `per_page` to set the default "Items per page".
- Filter changes preserve `page`/`per_page`.
- Row navigation preserves `page`/`per_page` in the drilldown URL.

