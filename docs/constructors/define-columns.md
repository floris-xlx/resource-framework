# defineColumns

Maps `ResourceFieldSpec[]` to a simpler column spec used in tables.

```ts
import { defineColumns } from "resource-framework";
const built = defineColumns([
  { column_name: "status", field_type: "select" },
  { column_name: "verified", field_type: "boolean" }
]);
```

- field_type → editable.type mapping: select/boolean/text

