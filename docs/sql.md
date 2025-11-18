### SQL

- Base schema is provided in `sql/schema.sql`:
  - `public.resource_routes`
  - `public.resource_forms`
  - `public.resource_charts`
- Alter statements in `sql/alter_resource_routes.sql`:
  - `metadata_column text`
  - `create_scope jsonb`
  - `create_show_button_scope jsonb`

Use your migration runner to apply these to your database.

