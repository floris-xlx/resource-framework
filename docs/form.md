# Form module

Shared, schema-driven form components that power formations and other dynamic flows.

## Components

- `packages/resource-framework/components/form`:
  - `EntityForm`: multi-step renderer that takes an `EntitySchema`.
  - `FormField`: renders a single field.
  - `types.ts`: shared types (`FormField`, `EntitySchema`, `FormData`).

Re-exports are available from `@/packages/resource-framework/components/form`.

## Schema support

Two input shapes are supported:

- v1 (legacy): `{ entity: string, steps: Record<string, FormField[]> }`
- v2 (experimental): `{ entity, ui?, state?, steps: Array<{ key, title, fields, actions? }> }`

When the page consumes schemas, v2 is normalized into v1 automatically:

- `group` → flattened into individual fields prefixed with group key
- `radio_cards` → `radio`
- `pricing_cards` → `select`
- `dynamic_list` → `table` (columns from `itemFields` labels/keys)
- `help_card` → `note`
- `promo_code` → `text`
- `summary_card` → skipped (UI-only)
- single `checkbox` (no options) → `switch`

Field types rendered by `FormField`:

`text | email | date | tel | number | select | radio | textarea | file | checkbox | table | note | switch | calculated | conditional_note | country_code | file_explorer`

Special handling:

- `country`/`nationality` (no options) renders `AddressCountrySelect`
- 2-option country fields `["USA","Other"]` map to a full country selector producing `"USA"` or `"Other"`
- Date fields support year selection for `dob`, `fy_start`, `fy_end`, `passport_issue_date`, `passport_expiry`
- `file_explorer` uploads via `FileUploadZone` (S3/DO), auto-directories based on email/entity

Default values:

- Per-field defaults can be set via `default_value` (preferred in schema) or `defaultValue`.
- Defaults are applied for all field types if no value exists yet; numbers fall back to `min` or `0` if no default is provided; dates default to `null`.

## Data source

Forms can be stored in Postgres table `resource_forms`:

```sql
create table if not exists public.resource_forms (
  resource_form_id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  entity text not null,
  slug text not null,
  version integer not null default 1,
  experimental boolean not null default false,
  is_active boolean not null default true,
  -- full schema payload (v1 or v2); supports field-level "error_key"
  schema jsonb not null,
  -- optional derived list of error keys found in schema (kept in sync by trigger below)
  error_keys jsonb not null default '[]'::jsonb,
  tags text[] default '{}',
  description text
);

-- Uniqueness + general indexes
create unique index if not exists idx_resource_forms_slug_unique on public.resource_forms (slug);
create index if not exists idx_resource_forms_entity on public.resource_forms (entity);
create index if not exists idx_resource_forms_active on public.resource_forms (is_active);
create index if not exists idx_resource_forms_updated_at on public.resource_forms (updated_at desc);

-- JSON/GIN indexes for searching by fields inside schema and error_keys
create index if not exists idx_resource_forms_schema_gin on public.resource_forms using gin (schema jsonb_path_ops);
create index if not exists idx_resource_forms_error_keys_gin on public.resource_forms using gin (error_keys);

-- Keep updated_at current and derive error_keys from schema JSON
create or replace function public.set_resource_forms_derived()
returns trigger language plpgsql as $$
declare
  keys jsonb;
begin
  new.updated_at = now();
  -- derive distinct error_key values from any depth in schema JSON
  select coalesce(jsonb_agg(distinct value), '[]'::jsonb)
  into keys
  from jsonb_path_query(new.schema, '$.**.error_key');

  new.error_keys = coalesce(keys, '[]'::jsonb);
  return new;
end
$$;

drop trigger if exists trg_resource_forms_set_derived on public.resource_forms;
create trigger trg_resource_forms_set_derived
before insert or update on public.resource_forms
for each row execute function public.set_resource_forms_derived();
```

Recommended policy (adjust to your needs):

```sql
alter table public.resource_forms enable row level security;
create policy resource_forms_select
on public.resource_forms
for select
to authenticated
using (true);
```

## Usage

Load schemas from `resource_forms` with the standard API client; fall back to bundled JSON if empty. Example selection by slug uses the same `toSlug(entity)` mapping.

```tsx
import {
  EntityForm,
  type EntitySchema,
  type FormData,
} from "@/packages/resource-framework/components/form";

// inside a page or component:
// const { data: dbForms } = useApiClient({ table: "resource_forms", noCache: true });
// normalize and pick the schema for the route slug, then render:

<EntityForm
  schema={schema}
  onSubmit={(data: FormData) => {
    /* handle */
  }}
/>;
```

## Migration from suits-formations

- The base form renderer and field components were moved from `packages/suits-formations` to `packages/resource-framework/components/form`.
- Compatibility re-exports remain:
  - `packages/suits-formations/entity-form.tsx` → re-exports `EntityForm`
  - `packages/suits-formations/form-field.tsx` → re-exports `FormField`
  - `packages/suits-formations/types/form-schema.ts` → re-exports types

Prefer importing from the resource framework package going forward:

```ts
import { EntityForm } from "@/packages/resource-framework/components/form";
```
