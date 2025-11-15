"use client";

import { getAppStatic } from "../adapters/context";

export async function insertRow(
  table: string,
  insertBody: Record<string, unknown>,
): Promise<{ ok: boolean; data?: any }> {
  const app = getAppStatic();
  const useUserStore: any = app.stores?.useUserStore;
  const u = typeof useUserStore?.getState === "function" ? useUserStore.getState().user : undefined;
  const apiUrl = String(app.APP_CONFIG?.api?.suitsbooks || "");
  const resp = await fetch(`${apiUrl}/data/insert`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Company-Id": String(u?.company_id ?? ""),
      "X-Organization-Id": String(u?.organization_id ?? ""),
      "X-User-Id": String(u?.user_id ?? ""),
    } as Record<string, string>,
    body: JSON.stringify({
      table_name: table,
      insert_body: insertBody,
    }),
  });
  if (!resp.ok) return { ok: false };
  const j = await resp.json().catch(() => ({}));
  return { ok: true, data: j };
}


