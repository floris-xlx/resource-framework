# Forms

Schema-driven multi-step forms. Two shapes supported:

- v1: `{ entity: string, steps: Record<string, FormField[]> }`
- v2: `{ entity, ui?, state?, steps: Array<{ key, title, fields, actions? }> }`

Normalization (v2 → v1):

- `group` → flattened fields with `<group>_` prefix
- `radio_cards` → radio
- `pricing_cards` → select
- `dynamic_list` → table
- `help_card` → note
- `promo_code` → text
- `summary_card` → skipped (UI-only)
- single checkbox → switch

Defaults & validation:

- Prefer `default_value`. Numbers may default to `min`/0, dates to `null`.
- Per-field errors render under fields; use `error_key` to deduplicate repeated messages.

Storage & routing:

- Store JSON schemas in your DB (e.g., `public.resource_forms`).
- Route by slug and fallback to bundled schemas if not found.
