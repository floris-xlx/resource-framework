# useQueryFilters

Parse `filters` from URLSearchParams into a normalized list.

```ts
import { useQueryFilters } from "resource-framework";
const filters = useQueryFilters(searchParams);
```

- Accepts JSON array under `?filters=...`

