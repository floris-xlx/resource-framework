import * as React from "react";

export type QueryFilter = {
  column: string;
  op: string;
  value?: string | number | boolean | null;
};

export function useQueryFilters(searchParams: URLSearchParams | null) {
  const [filters, setFilters] = React.useState<QueryFilter[]>([]);
  React.useEffect(() => {
    if (!searchParams) {
      setFilters([]);
      return;
    }
    const parsed: QueryFilter[] = [];
    const raw = searchParams.get("filters");
    if (raw) {
      try {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          for (const f of arr) {
            if (f && typeof f.column === "string" && typeof f.op === "string") {
              parsed.push({
                column: f.column,
                op: f.op,
                value: f.value ?? null,
              });
            }
          }
        }
      } catch {
        // ignore
      }
    }
    setFilters(parsed);
  }, [searchParams]);

  return filters;
}


