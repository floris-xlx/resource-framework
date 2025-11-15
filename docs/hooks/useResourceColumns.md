# useResourceColumns

Builds table column definitions from a `route`'s column specs.

```ts
import { useResourceColumns } from "resource-framework";
const columns = useResourceColumns(route);
```

- Internally maps field specs via `defineColumns`

