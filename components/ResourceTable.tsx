"use client";

import { Ellipsis } from "lucide-react";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Error as ErrorBlock, Loading } from "@/components/blocks";
import { Button } from "@/components/ui/button";
import {
  type Filter as AdvancedFilter,
  Filters as AdvancedFilters,
  createFilter as createAdvancedFilter,
  type FilterFieldConfig,
} from "@/components/ui/filters";
import { LeanTable } from "@/components/ui-responsive/lean-table";
import { ResponsiveDropdownV2 } from "@/components/ui-responsive/responsive-dropdown-v2";
import { APP_CONFIG } from "@/config";
import { useApiClient } from "@/hooks/use-api-client";
import { initInvoice } from "@/lib/actions/invoice";
import {
  RESOURCE_ROUTES,
  type ResourceRoute,
} from "../registries/resource-routes";
import { useBackButtonStore, useUserStore, useViewStore } from "@/lib/stores";
import {
  buildColumnsFromRegistry,
  type LeanColumnSpec,
} from "../constructors/column-registry";
import { cn } from "@/lib/utils";
import { useInvoiceStore } from "@/lib/zustand/useInvoiceStore";
import { handleCreateInvoice } from "@/packages/invoicing/handlers/create-invoice";
import { prettyString } from "@/utils/format-utils";
import { ScopeCell } from "@/packages/resource-framework/components/cells/ScopeCell";
import { useNotification } from "@/components/notifications/base";
import { useUserScopes } from "../hooks/useUserScopes";
import { CreateResourceDialog } from "./CreateResourceDialog";
import {
  PriorityIcon,
  type PriorityTypes,
} from "@/components/icons/PriorityIcon";

// priority helpers (same semantics as details sidebar)

const priorityLabels = {
  0: "No Priority",
  1: "Low Priority",
  2: "Medium Priority",
  3: "High Priority",
  4: "Urgent Priority",
} as const;

const stringPriorityToNumber = (p: any): PriorityTypes => {
  if (typeof p === "number") {
    return Math.max(0, Math.min(4, p)) as PriorityTypes;
  }
  const v = String(p || "").toLowerCase();
  if (v === "low") return 1 as PriorityTypes;
  if (v === "medium") return 2 as PriorityTypes;
  if (v === "high") return 3 as PriorityTypes;
  if (v === "urgent") return 4 as PriorityTypes;
  return 0 as PriorityTypes;
};

const getPriorityLabel = (priority: PriorityTypes): string => {
  return priorityLabels[priority] || "No Priority";
};

export const ResourceTable: React.FC<{ resourceName?: string }> = ({
  resourceName,
}) => {
  const params = useParams<{ resource_name: string }>();
  const resource_name = resourceName ?? params?.resource_name;
  const searchParams = useSearchParams();
  const prefIdRef = React.useRef<number | null>(null);
  const initialPrefsFetchOkRef = React.useRef<boolean | null>(null);
  const { user } = useUserStore();
  const { view, setDisplaySetting } = useViewStore();
  const { clear: clearBackButton } = useBackButtonStore();
  const router = useRouter();
  const pathname = usePathname();
  const invoiceStore = useInvoiceStore();
  const { notification } = useNotification();
  const { hasScope } = useUserScopes({ cache_enabled: true });
  const [createOpen, setCreateOpen] = useState(false);
  const cacheExperimental = hasScope("xbp_cache_experimental_v2");

  const staticResource = (RESOURCE_ROUTES as any)?.[resource_name as any];
  const [remoteResource, setRemoteResource] = useState<ResourceRoute | null>(
    null,
  );
  console.log(
    "🔍 ~  ~ packages/resource-framework/components/ResourceTable.tsx:57 ~ variable:",
    remoteResource,
  );
  const [resourceLoading, setResourceLoading] = useState(false);
  const [advFilters, setAdvFilters] = useState<AdvancedFilter[]>([]);
  const displayContext = useMemo(() => `v2_${resource_name}`, [resource_name]);
  const contextSettings = (view?.display_settings || {})[displayContext] || {};

  const resource: ResourceRoute | null = useMemo(
    () => (staticResource as ResourceRoute) || remoteResource,
    [staticResource, remoteResource],
  );

  useEffect(() => {
    try {
      const sidebarRoute = (resource as any)?.sidebar_route as
        | string
        | undefined;
      if (sidebarRoute) {
        setDisplaySetting?.("__noop__", "__noop__", null);
        (window as any).requestAnimationFrame?.(() => {
          try {
            (useViewStore.getState() as any)?.setSidebarRoute?.(sidebarRoute);
          } catch {}
        });
      } else {
        (useViewStore.getState() as any)?.setSidebarRoute?.(null);
      }
    } catch {}
  }, [resource_name, resource]);

  useEffect(() => {
    let cancelled = false;
    async function loadRoute() {
      try {
        if (
          staticResource ||
          !resource_name ||
          !user?.user_id ||
          !user?.company_id ||
          !user?.organization_id
        )
          return;
        setResourceLoading(true);
        const companyId = String(user!.company_id);
        const organizationId = String(user!.organization_id);
        const userId = String(user!.user_id);
        async function fetchRouteBy(column: "resource_name" | "table") {
          const resp = await fetch(`${APP_CONFIG.api.xylex}/fetch/data`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Company-Id": companyId,
              "X-Organization-Id": organizationId,
              "X-User-Id": userId,
              ...(cacheExperimental ? {} : { "Cache-Control": "no-cache" }),
              "x-xbp-telemetry": String(APP_CONFIG.telemetry.xbp_telemetry),
            } as Record<string, string>,
            body: JSON.stringify({
              table_name: "resource_routes",
              conditions: [{ eq_column: column, eq_value: resource_name }],
              limit: 1,
            }),
          });
          if (!resp.ok) return null;
          const json = await resp.json();
          const row =
            Array.isArray(json?.data) && json.data.length > 0
              ? json.data[0]
              : null;
          return row || null;
        }

        let row = await fetchRouteBy("resource_name");
        if (!row) {
          row = await fetchRouteBy("table");
        }
        if (!row || cancelled) return;
        const toArray = (v: any): any[] =>
          Array.isArray(v) ? v : typeof v === "string" ? [v] : [];
        const mapColumns = (cols: any): any[] => {
          const arr = toArray(cols);
          return arr
            .map((c: any) =>
              typeof c === "string"
                ? { column_name: c }
                : c && typeof c === "object" && c.column_name
                  ? c
                  : null,
            )
            .filter(Boolean);
        };
        const mapped: ResourceRoute = {
          table: row?.table || (resource_name as any),
          idColumn: row?.id_column || "id",
          path: row?.path || undefined,
          schema: row?.schema || undefined,
          force_remove_back_button_store_on_index_resource: Boolean(
            row?.force_remove_back_button_store_on_index_resource,
          ),
          enableSearch: Boolean(row?.enable_search),
          searchBy: row?.search_by || undefined,
          avatar_column: row?.avatar_column || undefined,
          icon: row?.icon || undefined,
          page_label: row?.page_label || undefined,
          enableNewResourceCreation: Boolean(row?.enable_new_resource_creation),
          newResourceButtonText: row?.new_resource_button_text || undefined,
          newResourceHref: row?.new_resource_href || undefined,
          forceWrappingHeaderLabels: Boolean(row?.force_wrapping_header_labels),
          disableCompanyFilter: Boolean(row?.disable_company_filter),
          columns: mapColumns(row?.columns),
          companyIdColumn: row?.company_id_column || undefined,
          drilldownRoutePrefix: row?.drilldown_route_prefix || undefined,
          permanent_edit_state: row?.permanent_edit_state || false,
          sidebar_route: row?.sidebar_route || undefined,
          drilldownHref: row?.drilldown_href || undefined,
          edit: {
            enabled: Boolean(row?.enable_edit),
            allowedColumns: toArray(row?.allowed_columns_edit),
            deniedColumns: toArray(row?.denied_columns_edit),
            scope: row?.scope || undefined,
            IgnoreCompanyCheckBeforeMutation: Boolean(
              row?.ignore_company_check_before_mutation,
            ),
          },
          // Map DB-driven create configuration
          create: (() => {
            const req = toArray(row?.new_resource_mandatory_columns);
            const opt = toArray(row?.new_resource_optional_columns);
            const createScope = toArray(row?.create_scope);
            const showButtonScope = toArray(row?.create_show_button_scope);
            const hasReqOpt = (req && req.length) || (opt && opt.length);
            const hasScopes =
              (createScope && createScope.length) ||
              (showButtonScope && showButtonScope.length);
            if (hasReqOpt || hasScopes) {
              return {
                scope: createScope,
                showButtonScope,
                required: req,
                optional: opt,
              };
            }
            return undefined;
          })(),
        } as ResourceRoute;
        setRemoteResource(mapped);
      } finally {
        if (!cancelled) setResourceLoading(false);
      }
    }
    loadRoute();
    return () => {
      cancelled = true;
    };
  }, [
    staticResource,
    resource_name,
    user?.user_id,
    user?.company_id,
    user?.organization_id,
  ]);

  useEffect(() => {
    try {
      if ((resource as any)?.force_remove_back_button_store_on_index_resource) {
        clearBackButton?.();
      }
    } catch {}
  }, [
    resource?.table,
    (resource as any)?.force_remove_back_button_store_on_index_resource,
    clearBackButton,
  ]);

  const conditions = useMemo(() => {
    const list = [] as any[];
    if (
      resource &&
      user?.company_id &&
      !(resource as any)?.disableCompanyFilter
    ) {
      list.push({
        eq_column: (resource as any)?.companyIdColumn || "company_id",
        eq_value: user.company_id,
      });
    }
    return list;
  }, [resource, user?.company_id]);

  const querySort = useMemo(() => {
    try {
      const sortBy = searchParams?.get("sortby");
      const sortDir = (searchParams?.get("sortdir") || "desc").toLowerCase();
      if (sortBy && typeof sortBy === "string") {
        return { id: sortBy, desc: sortDir !== "asc" } as {
          id: string;
          desc: boolean;
        };
      }
    } catch {}
    return null as { id: string; desc: boolean } | null;
  }, [searchParams?.toString()]);

  // --- filters from query: always column=val, no eq_column/eq_value ---
  const queryFilters = useMemo(() => {
    const filters: Array<{ column: string; op: string; value: any }> = [];
    try {
      if (searchParams) {
        const operatorRegex = /^(.*?)(>=|<=|!=|>|<|~|!~|\^|\$|==)$/;
        for (const [rawKey, rawValue] of (searchParams as any).entries()) {
          // Skip sort parameters
          if (
            rawKey === "sortby" ||
            rawKey === "sortdir" ||
            rawKey === "rows_per_page" ||
            rawKey === "per_page" ||
            rawKey === "page"
          )
            continue;

          const key = String(rawKey);
          const val = String(rawValue ?? "");

          // Try "columnOP" style, e.g. age>=
          const keyMatch = key.match(operatorRegex);
          if (keyMatch) {
            const column = keyMatch[1].trim();
            const op = keyMatch[2];
            const value = val;
            const meta = (typeof window !== "undefined" &&
              (window as any).__filterableMeta)?.[column];
            if (column && (!meta || meta.filterable)) {
              filters.push({ column, op, value });
              continue;
            }
          }

          // Try value operator, e.g. age=!= 55, age=>= 10
          const valueOpMatch = val.match(
            /^(>=|<=|!=|>|<|~|!~|\^|\$|==)\s*(.*)$/,
          );
          const namedOpMatch = val.match(
            /^(contains|not_contains|starts_with|ends_with|equals)\s*=\s*(.*)$/i,
          );

          if (valueOpMatch) {
            const column = key;
            const op = valueOpMatch[1];
            const rhs = valueOpMatch[2];
            const meta = (typeof window !== "undefined" &&
              (window as any).__filterableMeta)?.[column];

            if (!meta || meta.filterable) {
              filters.push({ column, op, value: rhs });
            }
            continue;
          }

          if (namedOpMatch) {
            const column = key;
            const opName = (namedOpMatch[1] || "").toLowerCase();
            const rhs = namedOpMatch[2] || "";
            const opMap: Record<string, string> = {
              contains: "contains",
              not_contains: "not_contains",
              starts_with: "starts_with",
              ends_with: "ends_with",
              equals: "==",
            };
            const op = opMap[opName];
            const meta = (typeof window !== "undefined" &&
              (window as any).__filterableMeta)?.[column];
            if ((!meta || meta.filterable) && op) {
              filters.push({ column, op, value: rhs });
            }
            continue;
          }

          // Default: equality
          const meta = (typeof window !== "undefined" &&
            (window as any).__filterableMeta)?.[key];
          if (!meta || meta.filterable) {
            filters.push({
              column: key,
              op: "eq",
              value: val,
            });
          }
        }
      }
    } catch {}
    return filters;
  }, [searchParams?.toString()]);

  const { data, isLoading, isError, error } = useApiClient<any[]>({
    table: (resource as any)?.table || "",
    schema: (resource as any)?.schema || "public",
    conditions,
    columns: useMemo(() => {
      try {
        const configured = (resource as any)?.columns;
        if (!Array.isArray(configured) || configured.length === 0) {
          return [] as any[];
        }
        const base = configured
          .filter((c: any) => !(typeof c === "object" && c?.hidden))
          .map((c: any) => (typeof c === "string" ? c : c.column_name));
        const withId = new Set<string>(
          [
            ...base,
            (resource as any)?.idColumn || "id",
            (resource as any)?.avatar_column || undefined,
          ].filter(Boolean) as string[],
        );
        return Array.from(withId);
      } catch {
        return [] as any[];
      }
    }, [
      (resource as any)?.columns,
      (resource as any)?.idColumn,
      (resource as any)?.avatar_column,
    ]),
    enabled: Boolean(
      (resource as any)?.table &&
        user?.user_id &&
        user?.organization_id &&
        user?.company_id,
    ),
    noCache: !cacheExperimental,
    limit: 5000,
  });

  const columns = useMemo(() => {
    const first = Array.isArray(data) && data.length > 0 ? data[0] : null;
    const configured = (resource as any)?.columns;
    const hasConfigured = Array.isArray(configured) && configured.length > 0;
    const specs: Array<LeanColumnSpec<any>> = (
      hasConfigured
        ? (configured as any[])
            .filter((c: any) => !(typeof c === "object" && c?.hidden))
            .map((c: any) =>
              typeof c === "string"
                ? { key: c, header: c.replace(/_/g, " ") }
                : {
                    key: c.column_name,
                    header:
                      c.header_label ||
                      c.header ||
                      c.column_name.replace(/_/g, " "),
                    use: c.use,
                    label: c.label,
                    href: c.href,
                    cell_value_mask_label: c.cell_value_mask_label,
                    order: c.order,
                    formatter: c.formatter,
                    minWidth: c.minWidth,
                    maxWidth: c.maxWidth,
                    widthFit: c.widthFit,
                  },
            )
        : (first ? Object.keys(first) : []).map((k) => ({
            key: k,
            header: k.replace(/_/g, " "),
          }))
    ) as any;
    const finalSpecs =
      Array.isArray(specs) && specs.length > 0
        ? specs
        : ((first ? Object.keys(first) : []).map((k) => ({
            key: k,
            header: k.replace(/_/g, " "),
          })) as any);
    // Remove avatar column from visible specs if configured
    try {
      const avatarKey = (resource as any)?.avatar_column;
      if (avatarKey) {
        for (let i = finalSpecs.length - 1; i >= 0; i -= 1) {
          const s = finalSpecs[i] as any;
          const key = typeof s === "string" ? s : s?.key;
          if (key === avatarKey) {
            finalSpecs.splice(i, 1);
          }
        }
      }
    } catch {}
    const built = buildColumnsFromRegistry<any>(finalSpecs);

    // use ScopeCell for the scope column and PriorityIcon for priority
    const builtWithScope = (built as any[]).map((col: any) => {
      const key = (col?.accessorKey as string) || (col?.id as string);
      if (key === "scope") {
        return {
          ...col,
          cell: ({ row }: any) => <ScopeCell scope={row.original?.scope} />,
        };
      }
      if (key === "priority") {
        return {
          ...col,
          cell: ({ row }: any) => {
            const raw = row.original?.priority;
            const num = stringPriorityToNumber(raw);
            return (
              <div className="inline-flex items-center gap-2">
                <PriorityIcon priority={num} width={14} height={14} />
                <span className="text-xs font-medium text-primary">
                  {getPriorityLabel(num)}
                </span>
              </div>
            );
          },
        };
      }
      return col;
    });

    // Build a quick set of filterable columns from column meta
    const filterableMeta: Record<
      string,
      { filterable?: boolean; datatype?: string }
    > = {};
    (builtWithScope as any[]).forEach((col: any) => {
      const key = (col?.accessorKey as string) || (col?.id as string);
      if (!key) return;
      const meta = (col?.meta as any) || {};
      filterableMeta[key] = {
        filterable: Boolean(meta.filterable),
        datatype: meta.datatype,
      };
    });
    try {
      (window as any).__filterableMeta = filterableMeta;
    } catch {}

    const filteredBuilt =
      Array.isArray(data) && data.length > 0
        ? (builtWithScope as any[]).filter((col: any) => {
            const key = (col?.accessorKey as string) || undefined;
            if (!key) return true;
            return data.some((row: any) => row?.[key] != null);
          })
        : builtWithScope;
    filteredBuilt.push({
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }: any) => {
        const items = [
          {
            buttonText: "Open",
            onClick: () => {
              try {
                const id = row.original?.[(resource as any)?.idColumn || "id"];
                const custom = (resource as any)?.drilldownHref;
                if (typeof custom === "function") {
                  const href = custom(row.original);
                  if (href && typeof href === "string") {
                    window.location.href = href;
                    return;
                  }
                } else if (typeof custom === "string" && custom.trim() !== "") {
                  const href = custom.replace(
                    /\{\{(.*?)\}\}/g,
                    (_: any, key: string) =>
                      String(row.original?.[key.trim()] ?? ""),
                  );
                  window.location.href = href;
                  return;
                }
                window.location.href = `/v2/${resource_name}/${id}`;
              } catch {
                const fallbackId =
                  row.original?.[(resource as any)?.idColumn || "id"];
                window.location.href = `/v2/${resource_name}/${fallbackId}`;
              }
            },
          },
          ...(Array.isArray((resource as any)?.rowActions)
            ? ((resource as any)?.rowActions as any[]).map((a: any) =>
                a?.type === "separator"
                  ? { type: "separator" }
                  : {
                      buttonText: a.label,
                      onClick: () => a.onClick?.(row.original),
                      variant: a.destructive ? "destructive" : "default",
                      disabled:
                        typeof a.disabled === "function"
                          ? Boolean(a.disabled(row.original))
                          : Boolean(a.disabled),
                    },
              )
            : []),
        ];
        return (
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex justify-end"
          >
            <ResponsiveDropdownV2
              items={items as any}
              triggerButton={
                <Button
                  size="icon"
                  variant="icon_v3"
                  aria-label="Row actions"
                  icon={
                    <Ellipsis size={16} strokeWidth={2} aria-hidden="true" />
                  }
                />
              }
            />
          </div>
        );
      },
      size: 60,
      enableHiding: false,
      meta: {
        className: "sticky right-0",
        // explicitly mark actions as non-filterable so parsers/fields skip it
        filterable: false,
      },
    } as any);

    return filteredBuilt as any;
  }, [data, resource?.columns, resource, resource_name]);

  const filterFields = useMemo<FilterFieldConfig<any>[]>(() => {
    try {
      const asArray = Array.isArray(columns) ? (columns as any[]) : [];
      return asArray
        .map((c: any) => {
          const key = (c?.accessorKey as string) ?? (c?.id as string);
          if (!key) return null;
          // blacklist: never expose actions in filter fields
          if (key === "actions") return null;
          const meta = (c?.meta as any) || {};
          const headerText = meta?.headerText;
          const header = c?.header;
          const label =
            (typeof headerText === "string" && headerText) ||
            (typeof header === "string" ? header : prettyString(String(key)));
          const dt = String(meta?.datatype || "").toLowerCase();
          const type: "text" | "number" | "date" | "boolean" = dt.includes(
            "bool",
          )
            ? "boolean"
            : dt.includes("num") ||
                dt.includes("int") ||
                dt.includes("decimal") ||
                dt.includes("currency")
              ? "number"
              : dt.includes("date") || dt.includes("time")
                ? "date"
                : "text";
          return { key, label, type } as FilterFieldConfig<any>;
        })
        .filter(Boolean) as FilterFieldConfig<any>[];
    } catch {
      return [] as FilterFieldConfig<any>[];
    }
  }, [columns]);

  useEffect(() => {
    try {
      const next: AdvancedFilter[] = [];
      if (searchParams) {
        // NEW: pull only column=value (no eq_column)
        const operatorValueRegex = /^(>=|<=|!=|>|<)\s*(.*)$/;
        const perColumnOps = new Map<string, { op: string; value: string }[]>();
        const eqGrouped = new Map<string, string[]>();
        const fieldKeys = new Set<string>(
          (filterFields || []).map((f) => String(f.key)),
        );
        for (const [k, v] of (searchParams as any).entries()) {
          const key = String(k);
          if (!fieldKeys.has(key)) continue;
          const val = String(v ?? "");
          const m = val.match(operatorValueRegex);
          if (m) {
            const op = m[1];
            const rhs = m[2];
            const arr = perColumnOps.get(key) || [];
            arr.push({ op, value: rhs });
            perColumnOps.set(key, arr);
          } else if (val.trim() !== "") {
            const arr = eqGrouped.get(key) || [];
            arr.push(val);
            eqGrouped.set(key, arr);
          }
        }
        perColumnOps.forEach((pairs, field) => {
          const gte = pairs.find((p) => p.op === ">=");
          const lte = pairs.find((p) => p.op === "<=");
          if (gte && lte) {
            next.push(
              createAdvancedFilter<string>(field, "between", [
                gte.value,
                lte.value,
              ]),
            );
          }
        });
        perColumnOps.forEach((pairs, field) => {
          pairs.forEach((p) => {
            if (
              (p.op === ">=" || p.op === "<=") &&
              perColumnOps
                .get(field)
                ?.some(
                  (x) =>
                    (x.op === ">=" && p.op === "<=") ||
                    (x.op === "<=" && p.op === ">="),
                )
            ) {
              return;
            }
            const opMap: Record<string, string> = {
              ">": "greater_than",
              "<": "less_than",
              ">=": "greater_than",
              "<=": "less_than",
              "!=": "not_equals",
            };
            const mapped = opMap[p.op] || "is";
            next.push(createAdvancedFilter<string>(field, mapped, [p.value]));
          });
        });
        eqGrouped.forEach((values, field) => {
          next.push(createAdvancedFilter<string>(field, "is", values));
        });
      }
      setAdvFilters(next);
    } catch {}
  }, [searchParams?.toString(), filterFields]);

  const handleAdvFiltersChange = React.useCallback(
    (nextFilters: AdvancedFilter[]) => {
      setAdvFilters(nextFilters);
      try {
        const current = new URLSearchParams(searchParams?.toString());
        // Remove all filter fields for our columns
        const fieldKeys = new Set<string>(
          (filterFields || []).map((f) => String(f.key)),
        );
        Array.from(current.keys()).forEach((k) => {
          if (fieldKeys.has(k)) current.delete(k);
        });
        // Remove any old eq_column/eq_value for migration cleanup
        current.delete("eq_column");
        current.delete("eq_value");
        nextFilters.forEach((f) => {
          const field = String(f.field);
          if (!field) return;
          const vals = Array.isArray(f.values) ? f.values : [];
          const cleanVals = vals
            .map((v) => (v == null ? "" : String(v)))
            .filter((s) => s.trim() !== "");
          if (f.operator === "empty" || f.operator === "not_empty") return;
          if (
            f.operator === "is" ||
            f.operator === "equals" ||
            f.operator === "is_any_of"
          ) {
            cleanVals.forEach((s) => {
              current.append(field, s);
            });
            return;
          }
          if (f.operator === "not_equals") {
            cleanVals.forEach((s) => current.append(field, `!= ${s}`));
            return;
          }
          if (f.operator === "greater_than") {
            cleanVals.forEach((s) => current.append(field, `> ${s}`));
            return;
          }
          if (f.operator === "less_than") {
            cleanVals.forEach((s) => current.append(field, `< ${s}`));
            return;
          }
          if (f.operator === "contains") {
            cleanVals.forEach((s) => current.append(field, `contains=${s}`));
            return;
          }
          if (f.operator === "not_contains") {
            cleanVals.forEach((s) =>
              current.append(field, `not_contains=${s}`),
            );
            return;
          }
          if (f.operator === "starts_with") {
            cleanVals.forEach((s) => current.append(field, `starts_with=${s}`));
            return;
          }
          if (f.operator === "ends_with") {
            cleanVals.forEach((s) => current.append(field, `ends_with=${s}`));
            return;
          }
          if (f.operator === "between") {
            const start = cleanVals[0];
            const end = cleanVals[1];
            if (start != null) current.append(field, `>= ${start}`);
            if (end != null) current.append(field, `<= ${end}`);
            return;
          }
          // Fallback: treat as equals
          cleanVals.forEach((s) => {
            current.append(field, s);
          });
        });
        const qs = current.toString();
        const href = qs ? `${pathname}?${qs}` : `${pathname}`;
        router.replace(href as any);
      } catch {}
    },
    [router, pathname, searchParams?.toString(), JSON.stringify(filterFields)],
  );

  const filteredData = useMemo(() => {
    const rows = Array.isArray(data) ? data : [];
    if (!Array.isArray(rows) || rows.length === 0) return rows;
    if (!Array.isArray(queryFilters) || queryFilters.length === 0) return rows;

    const coerce = (v: any) => {
      if (v === null || v === undefined) return v;
      const asNum = Number(v);
      if (!isNaN(asNum) && String(v).trim() !== "") return asNum;
      if (String(v).toLowerCase() === "true") return true;
      if (String(v).toLowerCase() === "false") return false;
      // try date
      const ts = Date.parse(String(v));
      if (!isNaN(ts)) return ts;
      return v;
    };

    return rows?.filter((row: any) => {
      for (const f of queryFilters) {
        const lhsRaw = row?.[f.column];
        const rhsRaw = f.value;
        const lhs = coerce(lhsRaw);
        const rhs = coerce(rhsRaw);

        switch (f.op) {
          case "eq":
            if (lhs == null) return false;
            if (typeof lhs === "number" && typeof rhs === "number") {
              if (!(lhs === rhs)) return false;
            } else {
              if (String(lhs) !== String(rhs)) return false;
            }
            break;
          case "==": {
            if (lhs == null) return false;
            if (typeof lhs === "number" && typeof rhs === "number") {
              if (!(lhs === rhs)) return false;
            } else {
              if (String(lhs) !== String(rhs)) return false;
            }
            break;
          }
          case "!=":
            if (typeof lhs === "number" && typeof rhs === "number") {
              if (lhs === rhs) return false;
            } else if (String(lhs) === String(rhs)) return false;
            break;
          case ">":
            if (!(Number(lhs) > Number(rhs))) return false;
            break;
          case ">=":
            if (!(Number(lhs) >= Number(rhs))) return false;
            break;
          case "<":
            if (!(Number(lhs) < Number(rhs))) return false;
            break;
          case "<=":
            if (!(Number(lhs) <= Number(rhs))) return false;
            break;
          case "~": {
            const l = String(lhs ?? "").toLowerCase();
            const r = String(rhs ?? "").toLowerCase();
            if (!l.includes(r)) return false;
            break;
          }
          case "!~": {
            const l = String(lhs ?? "").toLowerCase();
            const r = String(rhs ?? "").toLowerCase();
            if (l.includes(r)) return false;
            break;
          }
          case "^": {
            const l = String(lhs ?? "").toLowerCase();
            const r = String(rhs ?? "").toLowerCase();
            if (!l.startsWith(r)) return false;
            break;
          }
          case "$": {
            const l = String(lhs ?? "").toLowerCase();
            const r = String(rhs ?? "").toLowerCase();
            if (!l.endsWith(r)) return false;
            break;
          }
          case "contains": {
            const l = String(lhs ?? "").toLowerCase();
            const r = String(rhs ?? "").toLowerCase();
            if (!l.includes(r)) return false;
            break;
          }
          case "not_contains": {
            const l = String(lhs ?? "").toLowerCase();
            const r = String(rhs ?? "").toLowerCase();
            if (l.includes(r)) return false;
            break;
          }
          case "starts_with": {
            const l = String(lhs ?? "").toLowerCase();
            const r = String(rhs ?? "").toLowerCase();
            if (!l.startsWith(r)) return false;
            break;
          }
          case "ends_with": {
            const l = String(lhs ?? "").toLowerCase();
            const r = String(rhs ?? "").toLowerCase();
            if (!l.endsWith(r)) return false;
            break;
          }
          default:
            break;
        }
      }
      return true;
    });
  }, [Array.isArray(data) ? data : [], JSON.stringify(queryFilters)]);

  const displayConfig = useMemo(() => {
    const cols = (columns || []).map((c: any) => {
      const accessor = (c as any)?.accessorKey ?? (c as any)?.id;
      const headerText = (c as any)?.meta?.headerText;
      const header = (c as any)?.header;
      const label =
        (typeof headerText === "string" && headerText) ||
        (typeof header === "string"
          ? header
          : prettyString(String(accessor ?? "field")));
      return {
        label,
        value: `show_${String(accessor)}`,
        type: "toggle" as const,
      };
    });
    const sortOptions = (columns || [])
      .filter((c: any) => c?.enableSorting !== false)
      .flatMap((c: any) => {
        const accessor = (c as any)?.accessorKey ?? (c as any)?.id;
        const headerText = (c as any)?.meta?.headerText;
        const header = (c as any)?.header;
        const label =
          (typeof headerText === "string" && headerText) ||
          (typeof header === "string"
            ? header
            : prettyString(String(accessor ?? "field")));
        return [
          { label: `${label} (A-Z/asc)`, value: `${String(accessor)}_asc` },
          { label: `${label} (Z-A/desc)`, value: `${String(accessor)}_desc` },
        ];
      });

    // Pick default rows per page from URL (?per_page or ?rows_per_page)
    let defaultRowsPerPage = "25";
    try {
      const qPer = searchParams?.get("per_page");
      const qRows = searchParams?.get("rows_per_page");
      defaultRowsPerPage =
        (qPer && String(qPer)) ||
        (qRows && String(qRows)) ||
        defaultRowsPerPage;
    } catch {}

    return [
      ...cols,
      ...(sortOptions?.length
        ? ([
            {
              label: "Sort by",
              value: "sort_by",
              type: "sort" as const,
              options: sortOptions,
            },
          ] as const)
        : []),
      {
        label: "Items per page",
        value: "rows_per_page",
        type: "rows_per_page" as const,
        options: [
          { label: "10 rows", value: "10" },
          { label: "25 rows", value: "25" },
          { label: "50 rows", value: "50" },
          { label: "100 rows", value: "100" },
          { label: "1000 rows", value: "1000" },
        ],
        defaultValue: defaultRowsPerPage,
      },
    ];
  }, [columns, searchParams?.toString()]);

  useEffect(() => {
    let aborted = false;
    async function loadPrefs() {
      try {
        if (!user?.user_id || !user?.company_id || !user?.organization_id)
          return;
        const resp = await fetch(`${APP_CONFIG.api.xylex}/fetch/data`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Company-Id": user.company_id,
            "X-Organization-Id": user.organization_id,
            "X-User-Id": user.user_id,
            ...(cacheExperimental ? {} : { "Cache-Control": "no-cache" }),
          },
          body: JSON.stringify({
            table_name: "user_preferences",
            conditions: [
              { eq_column: "user_id", eq_value: user.user_id },
              { eq_column: "table_name", eq_value: resource?.table },
            ],
            limit: 1,
          }),
        });
        if (!resp.ok) {
          initialPrefsFetchOkRef.current = false;
          return;
        }
        initialPrefsFetchOkRef.current = true;
        const json = await resp.json();
        const rows = Array.isArray(json?.data) ? json.data : [];
        if (aborted) return;
        if (rows.length > 0) {
          const row = rows[0] as any;
          prefIdRef.current = Number(row?.id) || null;
          const settings = (row?.settings as any) || {};

          Object.entries(settings).forEach(([k, v]) => {
            try {
              setDisplaySetting?.(displayContext, String(k), v as any);
            } catch {}
          });
        }
      } catch {
        initialPrefsFetchOkRef.current = false;
      }
    }
    loadPrefs();
    return () => {
      aborted = true;
    };
  }, [
    user?.user_id,
    user?.company_id,
    user?.organization_id,
    resource?.table,
    displayContext,
  ]);

  useEffect(() => {
    if (!user?.user_id || !user?.company_id || !user?.organization_id) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const settings = contextSettings || {};
        const headers = {
          "Content-Type": "application/json",
          "X-Company-Id": String(user.company_id),
          "X-Organization-Id": String(user.organization_id),
          "X-User-Id": String(user.user_id),
          "x-xbp-telemetry": String(APP_CONFIG.telemetry.xbp_telemetry),
        } as Record<string, string>;

        let idToUse = prefIdRef.current;
        if (idToUse == null) {
          const check = await fetch(`${APP_CONFIG.api.xylex}/fetch/data`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              table_name: "user_preferences",
              conditions: [
                { eq_column: "user_id", eq_value: user.user_id },
                { eq_column: "table_name", eq_value: resource!.table },
              ],
              limit: 1,
            }),
            signal: controller.signal,
          });
          if (check.ok) {
            const j = await check.json();
            const rows = Array.isArray(j?.data) ? j.data : [];
            if (rows.length > 0) idToUse = Number(rows[0]?.id) || null;
          }
        }

        if (idToUse != null) {
          await fetch(`${APP_CONFIG.api.xylex}/update/data`, {
            method: "PUT",
            headers,
            body: JSON.stringify({
              table_name: "user_preferences",
              x_column: "user_id",
              x_id: String(user.user_id),
              update_body: { settings },
            }),
            signal: controller.signal,
          });
          prefIdRef.current = idToUse;
        } else if (initialPrefsFetchOkRef.current === true) {
          const ins = await fetch(`${APP_CONFIG.api.xylex}/data/insert`, {
            method: "PUT",
            headers,
            body: JSON.stringify({
              table_name: "user_preferences",
              insert_body: {
                user_id: user.user_id,
                table_name: resource!.table,
                settings,
              },
            }),
            signal: controller.signal,
          });
          if (ins.ok) {
            try {
              const j = await ins.json();
              const row =
                (j?.data && Array.isArray(j.data) ? j.data[0] : j?.data) || {};
              if (row?.id != null) prefIdRef.current = Number(row.id);
            } catch {}
          }
        }
      } catch {}
    }, 800);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    JSON.stringify(contextSettings),
    user?.user_id,
    user?.company_id,
    user?.organization_id,
    resource?.table,
  ]);

  useEffect(() => {
    if (querySort) {
      try {
        const val = `${querySort.id}_${querySort.desc ? "desc" : "asc"}`;
        setDisplaySetting?.(`v2_${resource_name}`, "sort_by", val);
      } catch {}
    }
  }, [querySort?.id, querySort?.desc, resource_name, setDisplaySetting]);

  if (isLoading) {
    return <Loading loading={true} message={`Loading ${resource_name}...`} />;
  }
  if (isError) {
    return <ErrorBlock message={error || `Failed to load ${resource_name}`} />;
  }

  // For invoices page, supply add invoice button handlers
  let addResourceProps: {
    addResourceLabel?: string;
    onAddResourceButton?: () => void;
    addResourceButton?: React.ReactNode;
  } = {};

  // New: scoped create config
  const createCfg: any = (resource as any)?.create || null;
  const createScope = Array.isArray(createCfg?.scope)
    ? (createCfg.scope as string[])
    : createCfg?.scope
      ? [String(createCfg.scope)]
      : [];
  const showButtonScope = Array.isArray(createCfg?.showButtonScope)
    ? (createCfg.showButtonScope as string[])
    : createCfg?.showButtonScope
      ? [String(createCfg.showButtonScope)]
      : createScope;
  const canSeeCreate = createCfg ? hasScope(showButtonScope) : false;
  const canCreate = createCfg ? hasScope(createScope) : false;
  if (resource_name === "invoices") {
    const { clearState, setInvoice, setLineItems, setLoading, setError } =
      invoiceStore;
    const onAddResourceButton = async () => {
      await handleCreateInvoice({
        user: user as any,
        clearState,
        setInvoice,
        setLineItems,
        setLoading,
        setError,
        router,
        initInvoiceFn: initInvoice,
      } as any);
    };
    addResourceProps = {
      addResourceLabel: "Add invoice",
      onAddResourceButton,
      addResourceButton: (
        <Button
          variant="brand"
          type="button"
          className="pl-4"
          style={{
            marginRight:
              typeof window !== "undefined" && window.innerWidth < 1525
                ? "1rem"
                : undefined,
          }}
        >
          Add invoice
          <div className="ml-2 flex h-4 min-w-4 items-center justify-center rounded bg-slate-200/40 px-1 text-xs font-medium text-muted-foreground text-white">
            n
          </div>
        </Button>
      ),
    };
  }

  return (
    <div
      className={cn(
        "mx-auto w-full space-y-5 p-4 px-0 py-4 sm:px-0",
        view?.styling?.tables_extra_side_padding ? "sm.max-w-[1280px]" : "",
        typeof window !== "undefined" && window.innerWidth < 1540 ? "px-4" : "",
      )}
    >
      {(() => {
        try {
          const Comp = (resource as any)?.customComponent;
          if (!Comp) return null;
          return (
            <div className="px-4 sm:px-0">
              {typeof Comp === "function" || typeof Comp === "object" ? (
                React.isValidElement(Comp) ? (
                  Comp
                ) : (
                  <Comp />
                )
              ) : null}
            </div>
          );
        } catch {
          return null;
        }
      })()}
      <LeanTable
        columns={columns as any}
        data={filteredData}
        title={`${(resource as any)?.page_label || resource_name}`}
        disableFullscreenView={true}
        onAddItem={(() => {
          if (!(resource as any)?.enableNewResourceCreation) return undefined;
          if (addResourceProps.onAddResourceButton) return undefined;
          if (createCfg) {
            // Hide the button entirely if user cannot see it
            if (!canSeeCreate) return undefined;
            return () => {
              if (!canCreate) {
                notification({
                  message: "You don’t have permission to create this resource",
                  success: false,
                });
                return;
              }
              setCreateOpen(true);
            };
          }
          // Default behavior (no scoped create configured)
          return () => {
            const joinRoute = (...parts: string[]) =>
              `/${parts.join("/")}`.replace(/\/+/g, "/");
            const seg = String(
              (resource as any)?.path || resource_name || "",
            ).replace(/^\/+/, "");
            const href =
              (resource as any)?.newResourceHref || joinRoute("v2", seg, "new");
            window.location.href = href;
          };
        })()}
        addItemLabel={
          (() => {
            if (!(resource as any)?.enableNewResourceCreation) return undefined;
            if (addResourceProps.addResourceLabel) return undefined;
            if (createCfg && !canSeeCreate) return undefined;
            return (
              (resource as any)?.newResourceButtonText ||
              `New ${prettyString((resource as any)?.page_label || resource_name)}`
            );
          })()
        }
        href={(row) => {
          try {
            const id = (row as any)[(resource as any)?.idColumn || "id"];
            const custom = (resource as any)?.drilldownHref;
            // Preserve pagination params (page, per_page) if present
            const preserved = (() => {
              try {
                const qp = new URLSearchParams(searchParams?.toString());
                const kept = new URLSearchParams();
                const page = qp.get("page");
                const perPage = qp.get("per_page") || qp.get("rows_per_page");
                if (page) kept.set("page", page);
                if (perPage) kept.set("per_page", perPage);
                const s = kept.toString();
                return s ? `?${s}` : "";
              } catch {
                return "";
              }
            })();
            if (typeof custom === "function") {
              const href = custom(row);
              if (href && typeof href === "string") return `${href}${preserved}`;
            } else if (typeof custom === "string" && custom.trim() !== "") {
              const href = custom.replace(
                /\{\{(.*?)\}\}/g,
                (_: any, key: string) =>
                  String((row as any)?.[key.trim()] ?? ""),
              );
              if (href) return `${href}${preserved}`;
            }
            const prefix = (resource as any)?.drilldownRoutePrefix;
            if (typeof prefix === "string" && prefix.trim() !== "") {
              const base = prefix.startsWith("/") ? prefix : `/${prefix}`;
              return `${base}/${id}${preserved}`;
            }
            const joinRoute = (...parts: string[]) =>
              `/${parts.join("/")}`.replace(/\/+/g, "/");
            const seg = String(
              (resource as any)?.path || resource_name || "",
            ).replace(/^\/+/, "");
            return `${joinRoute("v2", seg, String(id))}${preserved}`;
          } catch {
            const id = (row as any)[(resource as any)?.idColumn || "id"];
            const joinRoute = (...parts: string[]) =>
              `/${parts.join("/")}`.replace(/\/+/g, "/");
            const seg = String(
              (resource as any)?.path || resource_name || "",
            ).replace(/^\/+/, "");
            return joinRoute("v2", seg, String(id));
          }
        }}
        filterColumn={(columns as any)?.[0]?.accessorKey as string}
        filterPlaceholder={`Search in ${(resource as any)?.page_label || resource_name}...`}
        defaultSorting={
          querySort
            ? [querySort]
            : columns?.length
              ? [{ id: columns[0].accessorKey as string, desc: true }]
              : []
        }
        displayContext={displayContext}
        displayConfig={displayConfig}
        allowDownloadCsv={true}
        forceWrappingHeaderLabels={Boolean(
          (resource as any)?.forceWrappingHeaderLabels,
        )}
        customComponent={
          <div className="px-2.5">
            <ErrorBoundary fallbackRender={() => null}>
              <AdvancedFilters
                size="sm"
                radius="md"
                filters={Array.isArray(advFilters) ? advFilters : []}
                fields={Array.isArray(filterFields) ? filterFields : []}
                onChange={handleAdvFiltersChange}
              />
            </ErrorBoundary>
          </div>
        }
        {...addResourceProps}
      />
      {!resource && resourceLoading && (
        <Loading loading={true} message={`Loading ${resource_name}...`} />
      )}
      {!resource && !resourceLoading && (
        <div className="p-6">
          <ErrorBlock message={`Unknown resource: ${resource_name}`} />
        </div>
      )}

      {createCfg && (resource as any)?.enableNewResourceCreation && (
        <CreateResourceDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          title={`New ${prettyString((resource as any)?.page_label || resource_name)}`}
          required={Array.isArray(createCfg?.required) ? createCfg.required : []}
          optional={Array.isArray(createCfg?.optional) ? createCfg.optional : []}
          columns={Array.isArray((resource as any)?.columns) ? (resource as any).columns : []}
          DialogComponent={(createCfg as any)?.dialog}
          table={(resource as any)?.table}
          onCreated={(row: any) => {
            try {
              const idColumn = (resource as any)?.idColumn || "id";
              const id = row?.[idColumn];
              if (id != null) {
                const prefix = (resource as any)?.drilldownRoutePrefix;
                const joinRoute = (...parts: string[]) =>
                  `/${parts.join("/")}`.replace(/\/+/g, "/");
                if (typeof prefix === "string" && prefix.trim() !== "") {
                  const base = prefix.startsWith("/") ? prefix : `/${prefix}`;
                  window.location.href = `${base}/${id}`;
                  return;
                }
                const seg = String(
                  (resource as any)?.path || resource_name || "",
                ).replace(/^\/+/, "");
                window.location.href = joinRoute("v2", seg, String(id));
              } else {
                window.location.reload();
              }
            } catch {
              window.location.reload();
            }
          }}
        />
      )}
    </div>
  );
};
