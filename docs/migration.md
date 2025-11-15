# Migration from lib/\* and v2 pages

## Imports

- Replace imports of `lib/table/column-registry`, `lib/resource-routes`, `lib/resource-drilldown-routes`, and `lib/table/filter-registry` with:
  - `@/packages/resource-framework/constructors/column-registry`
  - `@/packages/resource-framework/constructors/define-columns`
  - `@/packages/resource-framework/registries/resource-routes`
  - `@/packages/resource-framework/registries/resource-drilldown-routes`
  - `@/packages/resource-framework/registries/filter-registry`

Temporary re-exports exist in `lib/*` to avoid breaking changes during transition.

## Pages

Use the thin wrappers in:

- `app/(dashboard)/v2/[resource_name]/page.tsx`
- `app/(dashboard)/v2/[resource_name]/[resource_id]/page.tsx`

They render `ResourceTable` and `ResourceDrilldown` from the package.

- Use `<ResourceTable />` and `<ResourceDrilldown />` on v2 pages.

## Migration guide

Temporary compatibility re-exports are in place under `lib/*`.
