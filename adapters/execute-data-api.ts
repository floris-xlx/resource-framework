import { APP_CONFIG } from "@/config";

export async function withRetry<T>(
	fn: () => Promise<T>,
	attempts = 3,
): Promise<T> {
	let lastError: unknown = null;
	for (let i = 0; i < Math.max(1, attempts); i += 1) {
		try {
			return await fn();
		} catch (e) {
			lastError = e;
			const backoffMs = Math.min(30_000, 250 * Math.pow(2, i));
			await new Promise((r) => setTimeout(r, backoffMs));
		}
	}
	throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

// Guard against API payload limits (<1MB). Keep a safety margin for headers/overhead.
const MAX_REQUEST_BYTES = 950_000;

function estimateJsonBytes(payload: unknown): number {
	try {
		const json = JSON.stringify(payload);
		// TextEncoder works in both browser and Node runtimes
		return new TextEncoder().encode(json).length;
	} catch {
		// Fallback rough estimate
		return String(payload ?? "").length;
	}
}

export async function dataApiInsertMany(opts: {
	table: string;
	rows: any[];
	schema?: string;
	headers: Record<string, string>;
}): Promise<any[]> {
	const { table, rows, schema = "public", headers } = opts;
	if (!Array.isArray(rows) || rows.length === 0) return [];

	// If the payload is too large, split the batch recursively.
	const baseBody = { table_name: table, schema, insert_body: rows };
	if (estimateJsonBytes(baseBody) > MAX_REQUEST_BYTES) {
		if (rows.length <= 1) {
			// Single row exceeds the limit; surface a clear error
			throw new Error(
				`Insert payload too large for a single row (>${MAX_REQUEST_BYTES} bytes)`,
			);
		}
		// Split approximately in half and send sequentially to preserve order
		const mid = Math.floor(rows.length / 2);
		const left = rows.slice(0, mid);
		const right = rows.slice(mid);
		const leftResult = await dataApiInsertMany({ table, rows: left, schema, headers });
		const rightResult = await dataApiInsertMany({ table, rows: right, schema, headers });
		return [...leftResult, ...rightResult];
	}

	const resp = await fetch(`${APP_CONFIG.api.suitsbooks}/data/insert`, {
		method: "PUT",
		headers,
		body: JSON.stringify(baseBody),
	});
	if (!resp.ok) {
		const text = await resp.text().catch(() => "");
		let parsed: any = null;
		try {
			parsed = text ? JSON.parse(text) : null;
		} catch {}
		const detail = parsed?.error || parsed?.message || text || "";
		throw new Error(
			`Insert API error: ${resp.status} ${resp.statusText}${
				detail ? ` - ${String(detail)}` : ""
			}`,
		);
	}
	const result = await resp.json().catch(() => ({}));
	const data = Array.isArray(result?.data)
		? result.data
		: result?.data
			? [result.data]
			: [];
	return data;
}




