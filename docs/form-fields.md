# Form fields reference

This page documents every form field type supported by the shared form renderer, based on the production schemas in `packages/suits-formations/data/entity-schemes.json` and the implementation in `packages/resource-framework/components/form/form-field.tsx`.

The renderer accepts both legacy (v1) and experimental (v2) schemas. For v2, the page layer normalizes to v1 at runtime. Each field below lists the base keys you can set on a field object:

- key: unique field identifier
- label: human‑readable label
- type: one of the supported types listed below
- required: boolean
- default_value (preferred) or defaultValue: optional default
- error_key: optional key for deduplicating identical error messages
- fromDate: optional lower bound for date fields (`"today"`, `"today-3m"`, etc.)
- min, max, step_size: supported on number fields
- options: array of strings for select/radio/checkbox fields
- columns: for table type

Field‑level validation: When `required: true`, empty fields are invalid. Type‑specific rules apply (email format, number not empty, select must be in options, date minimums, etc.). Errors render directly under each field.

## text

- Input with built‑in label.
- Default applied from `default_value` if present.

## email

- Validates basic email format when required.
- Default applied from `default_value` if present.

## tel

- Renders the shared `PhoneNumberInput` (international number UI).
- Default applied from `default_value` if present.

## number

- Renders `NumberField`.
- Supports `min`, `max`, `step_size`.
- Defaulting behavior:
  - If `default_value` is provided, it is used.
  - Otherwise, when empty it falls back to `min` if set, else `0`.

## date

- Desktop: popover calendar with year dropdown for keys: `dob`, `fy_start`, `fy_end`, `passport_issue_date`, `passport_expiry`. Mobile: native input.
- `fromDate` supports `"today"` and relative offsets like `"today-3m"`, `"today-14d"`, `"today-1y"`; and dynamic minimums:
  - `passport_expiry` is bounded by `passport_issue_date` if set
  - `fy_end` is bounded by `fy_start` if set
- Defaulting behavior:
  - If `default_value` is provided, it is used.
  - Otherwise, dates initialize as `null` (empty).

## select

- Renders a dropdown.
- `options: string[]` is required (unless you use country special cases below).
- Default applied from `default_value` if present.
- Special country handling:
  - If the field key matches `country` or `nationality` and no options are supplied, `AddressCountrySelect` is used (2‑letter ISO expected on submit).
  - If `options` is exactly `["USA","Other"]`, we render a full country selector but store `"USA"` or `"Other"` depending on the selection.

## radio

- Standard radio group. `options: string[]`.
- Special case for `contract_package`: maps to `RadioGroupButton` with canonical values.
- Default applied from `default_value` if present.

## checkbox

- Multi‑select checkboxes when `options` provided; value is an array of strings.
- If no options are provided (single boolean), we render a `switch` instead (see below).
- Default applied from `default_value` if present.

## switch

- Boolean toggle. Shows “Yes/No” label as the value changes.
- Accepts `default_value` (`true`/`false`).

## textarea

- Multi‑line input.
- Default applied from `default_value` if present.

## file

- Native single file input; passes the selected `File` object upward.

## file_explorer

- Uses shared `FileUploadZone`. Files are uploaded to S3/DO under a directory derived from the user’s email and current `entity` (e.g. `formations/<email>/<entity>/file`).
- On upload, the field value becomes the uploaded file URL.

## table

- Dynamic list of row objects, each with keys from `columns: string[]`.
- Rows can be added or removed. Value is an array of record objects.

## note

- Non‑interactive informational block (`Card` with foreground background).
- Use `content` to supply message text.

## conditional_note

- Same rendering as `note`, but display is controlled by the page based on field `condition`.
- Current built‑in condition: `"capital_per_shareholder_below_48000"` for Dubai flows.

## calculated

- Read‑only input shown as a calculated value (e.g., total members).

## country_code

- Shortcut to `AddressCountrySelect` that stores `"USA"` or `"Other"` when toggled (used in legacy patterns).

## Special behaviors derived from schemas

- Default values: use `default_value` (preferred) or `defaultValue` in your schema. The renderer applies defaults when the current form value is empty.
- Error grouping: set `error_key` on fields that can emit the same error from multiple places. This helps deduplicate error summaries if you add a bottom summary later. Field‑level messages always render beneath the field.
- v2 → v1 normalization:
  - `group` is flattened and child fields get keys prefixed with `"<groupKey>_"`
  - `dynamic_list` → `table` with `columns` derived from `itemFields`
  - `radio_cards` → `radio`, `pricing_cards` → `select`
  - `help_card` → `note`, `promo_code` → `text`
  - `summary_card` is UI‑only and skipped
  - Single `checkbox` without options becomes a `switch`

## Example snippets

Text with default:

```json
{
  "key": "first_name",
  "label": "First name",
  "type": "text",
  "required": true,
  "default_value": "Ada"
}
```

Select with options:

```json
{
  "key": "sector",
  "label": "Sector",
  "type": "select",
  "options": ["Technology", "Finance", "Retail"],
  "required": true
}
```

Date with relative minimum:

```json
{
  "key": "utility_bill_issue_date",
  "label": "Issue date",
  "type": "date",
  "required": true,
  "fromDate": "today-3m"
}
```

Table with two columns:

```json
{
  "key": "activities",
  "label": "Business activities",
  "type": "table",
  "columns": ["Activity name", "Activity code"],
  "required": true
}
```

For a full working schema, review `packages/suits-formations/data/entity-schemes.json` and the v2 example used by `/sf-formation/test` via the `resource_forms` table.


