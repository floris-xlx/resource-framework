# Filters

Translate user input into server-friendly operators. The `useQueryFilters` hook parses `?filters=` JSON into `{ column, op, value }` items.

Common operators:

- `=`, `!=`, `>`, `<`
- `contains`, `starts_with`, `ends_with`

URL example:

```
?filters=[{"column":"status","op":"=","value":"paid"}]
```
