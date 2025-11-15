export interface FormField {
	key: string;
	label: string;
	type:
		| "text"
		| "email"
		| "date"
		| "tel"
		| "number"
		| "select"
		| "radio"
		| "textarea"
		| "file"
		| "checkbox"
		| "table"
		| "note"
		| "switch"
		| "calculated"
		| "conditional_note"
		| "country_code"
		| "file_explorer";
	options?: string[];
	defaultValue?: string;
	columns?: string[];
	content?: string;
	condition?: string;
	// Optional key to group/deduplicate bottom error messages
	error_key?: string;
	required: boolean;
	min?: number;
	max?: number;
	step_size?: number;
	fromDate?: string;
}

export interface EntityStep {
	[stepName: string]: FormField[];
}

export interface EntitySchema {
	entity: string;
	steps: EntityStep;
}

export type FormData = Record<string, any>;


