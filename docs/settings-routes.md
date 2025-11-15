## Settings routes registry

The settings framework defines a typed, declarative registry for settings pages. It describes:

- Which table to read/write
- Primary and company id columns
- Sections and fields (with types and options)

### Types

```4:30:lib/settings-routes.ts
export type SettingsField = {
	key: string;
	label?: string;
	type?: "text" | "number" | "boolean" | "select";
	placeholder?: string;
	helpText?: string;
	options?: Array<{ value: string | number; label: string }>;
	hidden?: boolean;
};

export type SettingsSection = {
	title: string;
	columns?: 1 | 2 | 3 | 4;
	fields: Array<string | SettingsField>;
};

export type SettingsRoute = {
	id: string;
	title: string;
	category: "personal" | "company" | "product";
	description?: string;
	icon: ReactNode;
	table: string;
	idColumn: string;
	companyIdColumn?: string;
	sections: SettingsSection[];
};
```

### Registry

Routes are declared in a single exported object. Each key is a route id, backed by a `SettingsRoute`:

```32:41:lib/settings-routes.ts
export const SETTINGS_ROUTES: Record<string, SettingsRoute> = {
	invoices: {
		id: "invoices",
		title: "Invoices",
		category: "product",
		description: "Invoices, invoice templates, and invoice settings.",
		icon: React.createElement(FileText, {
			size: 18,
			className: "stroke-brand",
			strokeWidth: 2,
		}),
```

Example: the `invoices` route binds to `invoice_settings`:

```43:51:lib/settings-routes.ts
		table: "invoice_settings",
		idColumn: "invoice_setting_id",
		companyIdColumn: "company_id",
		sections: [
			{
				title: "General",
				columns: 2,
				fields: [
```

Fields can be simple strings (mapping a DB column by key) or full `SettingsField` objects with `type`, `options`, etc. Supported field types: `text`, `number`, `boolean`, `select`.

Another example: company domains

```129:141:lib/settings-routes.ts
	domain: {
		id: "domain",
		title: "Domains",
		category: "company",
		description: "Manage custom domains and branding overrides.",
		icon: React.createElement(Globe2, {
			size: 18,
			className: "stroke-brand",
			strokeWidth: 2,
		}),
		table: "company_branding_settings",
		idColumn: "branding_setting_id",
		companyIdColumn: "company_id",
```

And personal UI preferences:

```153:166:lib/settings-routes.ts
	ui: {
		id: "ui",
		title: "Preferences",
		category: "personal",
		description: "Customize your preferences, view formats and settings.",
		icon: React.createElement(Paintbrush, {
			size: 18,
			className: "stroke-brand",
			strokeWidth: 2,
		}),
		table: "user_settings",
		idColumn: "user_setting_id",
		companyIdColumn: "company_id",
```

### Helpers

Lookup a specific route by id:

```193:195:lib/settings-routes.ts
export function getSettingsRoute(key: string): SettingsRoute | undefined {
	return SETTINGS_ROUTES[key];
}
```

List routes by category:

```197:201:lib/settings-routes.ts
export type SettingsCategory = "personal" | "company" | "product";

export function listSettingsByCategory(category: SettingsCategory) {
	return Object.values(SETTINGS_ROUTES).filter((r) => r.category === category);
}
```

### Usage

Resolve a route and render sections/fields:

```tsx
import { getSettingsRoute } from "@/lib/settings-routes";

const route = getSettingsRoute("invoices");
if (!route) throw new Error("Unknown settings route");

route.sections.forEach((section) => {
  section.fields.forEach((field) => {
    const def =
      typeof field === "string" ? { key: field, type: "text" } : field;
    // Render an input by def.type, bind to def.key, use def.options for selects, etc.
  });
});
```

### Adding a new settings route

1. Add a new entry in `SETTINGS_ROUTES` with a unique `id`
2. Point `table`, `idColumn`, and (if applicable) `companyIdColumn`
3. Define `sections` with `fields`
4. For `select` fields, provide `options: [{ value, label }]`
5. Use `getSettingsRoute(id)` to render or `listSettingsByCategory("company")` to group

Notes:

- Keep `idColumn` aligned with your table’s primary key
- Use consistent `key` names that match your DB column names
- Supply `placeholder` and `helpText` for better UX where relevant
