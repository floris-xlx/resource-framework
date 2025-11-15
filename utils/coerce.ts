export function coerceByDatatype(val: any, datatype?: string) {
  if (val === "" || val == null) return val;
  switch (datatype) {
    case "number": {
      const n = Number(val);
      return isNaN(n) ? val : n;
    }
    case "boolean": {
      if (typeof val === "boolean") return val;
      const s = String(val).toLowerCase();
      return s === "true" || s === "1";
    }
    default:
      return val;
  }
}
