# Hooks

## useResourceRoute(name)

Resolves a route entry from the registry.

## useResourceColumns(route)

Builds `ColumnDef[]` from a route's `columns` via `defineColumns`.

## useQueryFilters(searchParams)

Parses `filters` from `URLSearchParams` into a normalized list.

## useUserPreferences()

Simple localStorage-backed getter/setter for user view preferences.

## Hooks (internal to components)

ResourceTable and ResourceDrilldown encapsulate route loading, filter parsing, and preference persistence. If you need lower-level control, lift logic from these components or wrap them with additional props.
