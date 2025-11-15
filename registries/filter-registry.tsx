"use client";

export type FilterOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "contains"
  | "starts_with"
  | "ends_with"
  | "in"
  | "not_in"
  | "is_null"
  | "is_not_null";

export type FilterDefinition = {
  operators: FilterOperator[];
};

export type FilterRegistry = Record<
  "string" | "number" | "boolean" | "date" | "json" | "other",
  FilterDefinition
>;

export const filterRegistry: FilterRegistry = {
  string: {
    operators: [
      "eq",
      "neq",
      "contains",
      "starts_with",
      "ends_with",
      "in",
      "not_in",
      "is_null",
      "is_not_null",
    ],
  },
  number: {
    operators: [
      "eq",
      "neq",
      "gt",
      "gte",
      "lt",
      "lte",
      "in",
      "not_in",
      "is_null",
      "is_not_null",
    ],
  },
  boolean: {
    operators: ["eq", "neq", "is_null", "is_not_null"],
  },
  date: {
    operators: ["eq", "neq", "gt", "gte", "lt", "lte", "is_null", "is_not_null"],
  },
  json: {
    operators: ["is_null", "is_not_null"],
  },
  other: {
    operators: ["eq", "neq", "is_null", "is_not_null"],
  },
};

/*
 * filter-registry.tsx
 * Utility for mapping resource/table and column names to filter UI options (for select, enum, status, boolean, etc)
 *
 * Usage:
 * - Use getFilterOptions(resource, column) to get a list of {label, value} for select/enum filter UIs
 * - Can be extended to pull from resource_routes, or provide UI pickers for common status fields generically
 *
 * To extend, add mappings in FILTER_OPTIONS,
 *   or make getFilterOptions logic aware of resource_routes (eg, columns[n].editable.options or a new filter_options field)
 */

export type FilterOption = { label: string; value: string | number | boolean };

// Static built-in options for common enums. Extend per resource/column as needed (ok to move to DB driven in future)
const FILTER_OPTIONS: Record<string, Record<string, FilterOption[]>> = {
	// Example for invoices table / status column
	invoices: {
		status: [
			{ label: "Draft", value: "draft" },
			{ label: "Pending", value: "pending" },
			{ label: "Paid", value: "paid" },
			{ label: "Overdue", value: "overdue" },
			{ label: "Cancelled", value: "cancelled" },
		],
	},
	// Add more resource/column combos or merge from DB in getFilterOptions in the future
};

/**
 * Get filter options for a given table/resource and column - for rendering select inputs in filter UI.
 * @param resourceName (eg, "invoices")
 * @param columnName (eg, "status")
 * @returns array of {label, value} or undefined
 */
export function getFilterOptions(
	resourceName: string,
	columnName: string,
): FilterOption[] | undefined {
	return FILTER_OPTIONS[resourceName]?.[columnName];
}


