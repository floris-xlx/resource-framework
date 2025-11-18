export function applyTransform(value: any, transform?: string): any {
	if (!transform) return value;
	if (transform === "date_string_to_unix_seconds") {
		if (value == null || value === "") return null;
		const s = String(value);
		const d = new Date(s);
		if (!Number.isNaN(d.getTime())) return Math.floor(d.getTime() / 1000);
		const alt = new Date(s.replace(" ", "T"));
		if (!Number.isNaN(alt.getTime())) return Math.floor(alt.getTime() / 1000);
		return value;
	}
	if (transform === "date_string_to_unix_milliseconds") {
		if (value == null || value === "") return null;
		const s = String(value);
		const d = new Date(s);
		if (!Number.isNaN(d.getTime())) return d.getTime();
		const alt = new Date(s.replace(" ", "T"));
		if (!Number.isNaN(alt.getTime())) return alt.getTime();
		return value;
	}
	if (transform === "to_boolean") {
		if (value == null || value === "") return null;
		if (typeof value === "boolean") return value;
		const s = String(value).trim().toLowerCase();
		if (["true", "1", "yes", "y"].includes(s)) return true;
		if (["false", "0", "no", "n"].includes(s)) return false;
		return value;
	}
	if (transform === "to_number") {
		if (value == null || value === "") return null;
		if (typeof value === "number" && Number.isFinite(value)) return value;
		const num = Number(String(value).replace(/[,\s]/g, ""));
		return Number.isFinite(num) ? num : value;
	}
	return value;
}




