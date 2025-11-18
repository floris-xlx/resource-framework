-- Add metadata column override and create scopes
alter table if exists public.resource_routes
  add column if not exists metadata_column text null,
  add column if not exists create_scope jsonb null,
  add column if not exists create_show_button_scope jsonb null;


