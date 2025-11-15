"use client";

/**
 * Replaces {{TOKENS}} with values from data; when value is undefined/empty,
 * the token is removed. Collapses duplicate whitespace and trims.
 * Returns empty string if nothing remains.
 */
export function safeTemplate(
  template: string,
  data: Record<string, unknown> | null | undefined,
): string {
  try {
    const t = String(template || "");
    if (!t.includes("{{")) return t;
    const replaced = t.replace(/\{\{(.*?)\}\}/g, (_m, raw) => {
      const key = String(raw || "").trim();
      const value = key.includes(".")
        ? key.split(".").reduce<any>((obj, part) => obj?.[part], data as any)
        : (data as any)?.[key];
      if (value == null || String(value) === "undefined") return "";
      const s = String(value);
      return s;
    });
    return replaced.replace(/\s+/g, " ").trim();
  } catch {
    return String(template || "");
  }
}


