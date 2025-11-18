### UI adapters

Pluggable UI adapters allow rendering the same resource data using different UIs.

- Registry: `adapters/ui-adapters.tsx` exports `UI_ADAPTERS`
- Available adapters:
  - `table`: wraps `LeanTable`
  - `listbox`: minimal list rendering (stub)

Adapters accept:
```ts
type ResourceAdapterProps = {
  columns: any[];
  data: any[];
  title?: string;
  onRowClick?(row: any): void;
  addItemLabel?: string;
  onAddItem?(): void;
  displayContext?: string;
  displayConfig?: any[];
}
```

