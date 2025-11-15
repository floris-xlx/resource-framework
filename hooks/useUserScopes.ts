"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "../adapters/context";

export type UserScopeRecord = {
  user_id?: string | null;
  scope?: string | null;
  enabled?: boolean | null;
  global?: boolean | null;
  company_id?: string | null;
};

/**
 * Fetches the current user's enabled permission scopes from `public.user_permission_scopes`.
 * Applies client-side filter to include only global scopes or those matching the current company.
 *
 * Honors workspace fetch rules and supports optional no-cache behavior.
 */
export function useUserScopes(options?: { cache_enabled?: boolean }) {
  const app = useApp();
  const useUserStore: any = app.stores?.useUserStore;
  const userState = typeof useUserStore === "function" ? useUserStore() : {};
  const user = (userState as any)?.user;
  const notifSource: any = app.useNotification;
  const notifVal = typeof notifSource === "function" ? notifSource() : notifSource;
  const notification =
    typeof notifVal === "function"
      ? notifVal
      : typeof notifVal?.notify === "function"
        ? notifVal.notify
        : (_msg: any) => {};
  const [scopes, setScopes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const fetchedRef = useRef(false);

  const cacheEnabled = options?.cache_enabled !== false;

  useEffect(() => {
    let aborted = false;
    async function load() {
      if (!user?.user_id || !user?.organization_id || !user?.company_id) {
        setScopes([]);
        return;
      }
      if (fetchedRef.current && cacheEnabled) return;
      fetchedRef.current = true;
      setIsLoading(true);
      try {
        const resp = await fetch(`${String(app.APP_CONFIG?.api?.xylex || "")}/fetch/data`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Company-Id": String(user.company_id),
            "X-Organization-Id": String(user.organization_id),
            "X-User-Id": String(user.user_id),
            ...(cacheEnabled ? {} : { "Cache-Control": "no-cache" }),
            "x-xbp-telemetry": String(app.APP_CONFIG?.telemetry?.xbp_telemetry || ""),
          } as Record<string, string>,
          body: JSON.stringify({
            table_name: "user_permission_scopes",
            conditions: [
              { eq_column: "user_id", eq_value: user.user_id },
              { eq_column: "enabled", eq_value: true },
            ],
          }),
        });
        if (!resp.ok) {
          notification({
            message: "Could not verify permissions",
            success: false,
          });
          setScopes([]);
          return;
        }
        const json = await resp.json();
        const rows: UserScopeRecord[] = Array.isArray(json?.data)
          ? json.data
          : [];
        if (aborted) return;
        const companyId = String(user.company_id);
        const list = rows
          .filter((r) => r?.scope && r?.enabled)
          .filter((r) => r.global === true || String(r.company_id || "") === companyId)
          .map((r) => String(r.scope!));
        setScopes(Array.from(new Set(list)));
      } catch {
        if (!aborted) {
          notification({
            message: "Could not verify permissions",
            success: false,
          });
          setScopes([]);
        }
      } finally {
        if (!aborted) setIsLoading(false);
      }
    }
    load();
    return () => {
      aborted = true;
    };
  }, [user?.user_id, user?.organization_id, user?.company_id, cacheEnabled]);

  const hasScope = useMemo(() => {
    const set = new Set(scopes);
    return (required: string | string[], opts?: { all?: boolean }) => {
      const reqList = Array.isArray(required) ? required : [required];
      if (reqList.length === 0) return true;
      if (opts?.all) {
        return reqList.every((s) => set.has(String(s)));
      }
      return reqList.some((s) => set.has(String(s)));
    };
  }, [scopes]);

  return { scopes, hasScope, isLoading };
}


