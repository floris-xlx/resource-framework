"use client";

import React, { useEffect, useMemo, useState, FC } from "react";
import { APP_CONFIG } from "@/config";
import { useParams } from "next/navigation";

import { useApiClient } from "@/hooks/use-api-client";
import { useUpdateData } from "@/hooks/use-update-data";
import { useNotification } from "@/components/notifications/base";

import { Code2, Pencil } from "lucide-react";

import { Switch } from "@/components/ui/switch";

import { RESOURCE_DRILLDOWN_ROUTES } from "../registries/resource-drilldown-routes";
import {
  RESOURCE_ROUTES,
  type ResourceRoute,
} from "../registries/resource-routes";
import { useBackButtonStore, useUserStore, useViewStore } from "@/lib/stores";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResponsiveDropdownV2 } from "@/components/ui-responsive/responsive-dropdown-v2";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Error as ErrorBlock, Loading } from "@/components/blocks";
import { DrilldownEntityRenderer } from "@/components/drilldown/drilldown-entity-renderer";
import { DrilldownLayout } from "@/components/drilldown/drilldown-layout";
import { ScopeWrapper } from "@/packages/scopes/scope-wrapper";
import { JsonBlock } from "@/packages/ui-patterns/src";
import TabsWithContent from "@/components/tabs-content";
import { Container } from "@/components/ui/container";
import CustomerInvoiceSummaryForCustomer from "@/features/customers/CustomerInvoiceSummaryForCustomer";
import {
  buildColumnsFromRegistry,
  type LeanColumnSpec,
} from "../constructors/column-registry";
import { coerceByDatatype } from "@/packages/resource-framework";
import { safeTemplate } from "../utils/templates";
import { useUserScopes } from "../hooks/useUserScopes";

export const ResourceDrilldown: FC<{
  resourceName?: string;
  resourceId?: string;
}> = ({ resourceName, resourceId }) => {
  const params = useParams<{
    resource_name: string;
    resource_id: string;
  }>();
  const resource_name = resourceName ?? params?.resource_name;
  const resource_id = resourceId ?? params?.resource_id;
  const { user } = useUserStore();
  const { view } = useViewStore();
  const { setBackLink } = useBackButtonStore();
  const { notification } = useNotification();
  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState<Record<string, any>>({});
  const [activeEditTabIndex, setActiveEditTabIndex] = useState(0);

  const staticResource = (RESOURCE_ROUTES as any)?.[resource_name as any];
  const [remoteResource, setRemoteResource] = useState<ResourceRoute | null>(
    null,
  );
  const [resourceLoading, setResourceLoading] = useState(false);
  const { hasScope } = useUserScopes({ cache_enabled: true });
  const cacheExperimental = hasScope("xbp_cache_experimental_v2");
  const resource: ResourceRoute | null = useMemo(
    () => (staticResource as ResourceRoute) || remoteResource,
    [staticResource, remoteResource],
  );
  const [showJson, setShowJson] = useState(false);

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
        async function fetchRouteBy(column: "resource_name" | "table") {
          const resp = await fetch(`${APP_CONFIG.api.xylex}/fetch/data`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Company-Id": String(user?.company_id),
              "X-Organization-Id": String(user?.organization_id),
              "X-User-Id": String(user?.user_id),
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
          schema: row?.schema || undefined,
          permanent_edit_state: Boolean(row?.permanent_edit_state),
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
          edit: {
            enabled: Boolean(row?.enable_edit),
            allowedColumns: toArray(row?.allowed_columns_edit),
            deniedColumns: toArray(row?.denied_columns_edit),
            scope: row?.scope || undefined,
            IgnoreCompanyCheckBeforeMutation: Boolean(
              row?.ignore_company_check_before_mutation,
            ),
          },
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
    if (resource_id && (resource as any)?.idColumn) {
      list.push({
        eq_column: (resource as any)?.idColumn,
        eq_value: resource_id,
      });
    }
    return list;
  }, [user?.company_id, resource_id, resource?.idColumn]);

  const { data, isLoading, isError, error } = useApiClient<any>({
    table: (resource as any)?.table || "",
    schema: (resource as any)?.schema || "public",
    conditions,
    columns: useMemo(() => {
      try {
        const configured = (resource as any)?.columns;
        const base = Array.isArray(configured)
          ? configured
              .filter((c: any) => !(typeof c === "object" && c?.hidden))
              .map((c: any) => (typeof c === "string" ? c : c.column_name))
          : [];
        const withId = new Set<string>(
          [
            ...base,
            (resource as any)?.idColumn || "id",
            (resource as any)?.avatar_column || undefined,
          ].filter(Boolean) as string[],
        );
        return Array.from(withId);
      } catch {
        const cols = new Set<string>(
          [
            (resource as any)?.idColumn || "id",
            (resource as any)?.avatar_column || undefined,
          ].filter(Boolean) as string[],
        );
        return Array.from(cols);
      }
    }, [(resource as any)?.columns, (resource as any)?.idColumn]),
    enabled: Boolean(
      (resource as any)?.table &&
        user?.user_id &&
        user?.organization_id &&
        user?.company_id,
    ),
    noCache: !cacheExperimental,
    single: true,
  });

  useEffect(() => {
    try {
      if (data && (isEditing || resource?.permanent_edit_state)) {
        setFormState({ ...(data as any) });
      }
    } catch {}
  }, [isEditing, data, resource?.permanent_edit_state]);

  // Force edit mode when permanent_edit_state is enabled
  useEffect(() => {
    if (resource?.permanent_edit_state) {
      setIsEditing(true);
    }
  }, [resource?.permanent_edit_state]);

  //   handles saving data after having edited
  const { update, isLoading: isSaving } = useUpdateData({
    table: (resource as any)?.table,
    column: (resource as any)?.idColumn,
    id: String(resource_id),
    updateBody: {},
    config: {
      onSuccess: () => notification({ message: "Saved", success: true }),
      onError: () => notification({ message: "Save failed", success: false }),
    },
  } as any);

  async function handleSaveAll() {
    try {
      const original = (data as any) || {};
      const editCfg = (resource as any)?.edit || {};
      const ignoreCompany = Boolean(
        editCfg?.IgnoreCompanyCheckBeforeMutation ||
          (resource as any)?.disableCompanyFilter,
      );

      if (!ignoreCompany) {
        const companyColumn =
          (resource as any)?.companyIdColumn || "company_id";
        const originalCompany = original?.[companyColumn];
        const currentCompany = user?.company_id;
      }
      const updates: Record<string, any> = {};

      const configured = (resource as any)?.columns;
      const keys: string[] = Array?.isArray(configured)
        ? configured
            .filter((c: any) => !(typeof c === "object" && c?.hidden))
            .map((c: any) => (typeof c === "string" ? c : c?.column_name))
        : Object?.keys(original);

      const specs: Array<LeanColumnSpec<any>> = (
        Array.isArray(configured)
          ? configured.map((c: any) =>
              typeof c === "string"
                ? { key: c, header: c.replace(/_/g, " ") }
                : {
                    key: c?.column_name,
                    header: c?.header || c?.header_label,
                    use: c?.use,
                    label: c?.label,
                    order: c?.order,
                    formatter: c?.formatter,
                    minWidth: c?.minWidth,
                    widthFit: c?.widthFit,
                  },
            )
          : Object.keys(original).map((k) => ({ key: k, header: k }))
      ) as any;
      const colDefs = buildColumnsFromRegistry<any>(specs);
      const datatypeByKey = new Map<string, string | undefined>();
      (colDefs as any[]).forEach((col: any) => {
        const k = (col?.accessorKey as string) || (col?.id as string);
        const dt = (col?.meta as any)?.datatype as string | undefined;
        if (k) datatypeByKey.set(k, dt);
      });

      keys.forEach((k) => {
        const nextRaw = (formState as any)[k];
        const prevRaw = (original as any)[k];
        const dt = datatypeByKey.get(k);
        const next = coerceByDatatype(nextRaw, dt);
        const prev = coerceByDatatype(prevRaw, dt);
        const changed = JSON.stringify(next) !== JSON.stringify(prev);
        if (changed) updates[k] = next;
      });

      if (Object.keys(updates).length === 0) {
        notification({ message: "Nothing to save", success: true });
        if (!(resource as any)?.permanent_edit_state) {
          setIsEditing(false);
        }
        return;
      }

      const ok = await update(updates);
      if (ok) {
        if (!(resource as any)?.permanent_edit_state) {
          setIsEditing(false);
        }
        try {
          window.location.reload();
        } catch {}
      }
    } catch (e) {
      notification({ message: "Save failed", success: false });
    }
  }

  // Build fields for entity renderer using the column registry (reuse table formatting)
  const fields = useMemo(() => {
    const row = data || {};
    const configured = (resource as any)?.columns;

    const hrefByKey = new Map<string, string>();
    if (Array.isArray(configured)) {
      configured.forEach((c: any) => {
        if (
          typeof c === "object" &&
          c?.column_name &&
          typeof c.href === "string" &&
          c.href.length > 0
        ) {
          hrefByKey.set(String(c.column_name), String(c.href));
        }
      });
    }

    const specs: Array<LeanColumnSpec<any>> = (
      configured
        ? configured
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
                    widthFit: c.widthFit,
                  },
            )
        : Object.keys(row).map((k) => ({
            key: k,
            header: k.replace(/_/g, " "),
          }))
    ) as any;

    const colDefs = buildColumnsFromRegistry<any>(specs);
    const colByKey = new Map<string, any>();
    for (const col of colDefs as any[]) {
      const key = (col.accessorKey || col.id) as string;
      if (key) colByKey.set(key, col);
    }

    return specs.map((s: any) => {
      const key = (typeof s === "object" ? s.key : s) as string;
      const fallbackLabel =
        (typeof s === "object" ? s.header : undefined) ||
        String(key).replace(/_/g, " ");
      const col = colByKey.get(String(key));
      const headerFromMeta = (col as any)?.meta?.headerText as
        | string
        | undefined;
      const headerFromCol =
        typeof col?.header === "string" ? (col.header as string) : undefined;
      const label = headerFromMeta || headerFromCol || fallbackLabel;
      const editable = typeof s === "object" ? (s as any)?.editable : undefined;

      return {
        key: String(key),
        label: String(label),
        href: hrefByKey.get(String(key)),
        render: () => {
          try {
            if (col && typeof col.cell === "function") {
              return (col.cell as any)({ row: { original: row } });
            }
          } catch {}
          const value = (row as any)[key];

          if (editable) {
            const EditableField: FC = () => {
              const { notification } = useNotification();
              const updateTable =
                editable?.update_table || (resource as any)?.table;
              const updateIdColumn =
                editable.update_id_column || (resource as any).idColumn;
              const updateColumn = editable?.update_column || key;

              const { update, isLoading } = useUpdateData({
                table: updateTable,
                column: updateIdColumn,
                id: String(resource_id),
                updateBody: {},
                config: {
                  onSuccess: () =>
                    notification({
                      message: "Updated successfully",
                      success: true,
                    }),
                  onError: () =>
                    notification({ message: "Update failed", success: false }),
                },
              } as any);

              if (
                editable.type === "select" &&
                Array.isArray(editable.options)
              ) {
                return (
                  <select
                    className="min-w-[180px] rounded-sm border bg-background px-2 py-1 text-sm"
                    disabled={isLoading}
                    value={String((row as any)[key] ?? "")}
                    onChange={async (e) => {
                      const nextVal = e.target.value;
                      await update({ [updateColumn]: nextVal });
                    }}
                  >
                    {editable.options.map((opt: any) => (
                      <option key={String(opt.value)} value={String(opt.value)}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                );
              }

              if (editable.type === "boolean") {
                const checked = Boolean((row as any)[key]);
                return (
                  <div className="inline-flex items-center gap-2 text-sm">
                    <Switch
                      checked={checked}
                      disabled={isLoading}
                      onCheckedChange={async (val) => {
                        await update({ [updateColumn]: val });
                      }}
                    />
                    <span className="text-secondary">
                      {checked ? "yes" : "no"}
                    </span>
                  </div>
                );
              }

              return (
                <Input
                  className="h-8 max-w-[260px]"
                  defaultValue={
                    (row as any)[key] == null ? "" : String((row as any)[key])
                  }
                  onBlur={async (e) => {
                    const nextVal = e.currentTarget.value;
                    if (nextVal !== String((row as any)[key] ?? "")) {
                      await update({ [updateColumn]: nextVal });
                    }
                  }}
                />
              );
            };

            return <EditableField />;
          }

          return value == null ? "-" : String(value);
        },
      } as any;
    });
  }, [data, (resource as any)?.columns]);

  useEffect(() => {
    const seg = String((resource as any)?.path || resource_name || "").replace(
      /^\/+/,
      "",
    );
    const href = `/${["v2", seg].join("/")}`.replace(/\/+/g, "/");
    setBackLink({
      href,
      label: `Back to ${(resource as any)?.page_label || resource_name}`,
      padding: true,
    });
    return () => setBackLink(null);
  }, [resource_name, setBackLink]);

  if (isLoading || resourceLoading) {
    return <Loading loading={true} message={`Loading ${resource_name}...`} />;
  }
  if (isError || !resource) {
    return <ErrorBlock message={error || `Failed to load ${resource_name}`} />;
  }

  const drilldownCfg = (RESOURCE_DRILLDOWN_ROUTES as any)?.[
    resource_name as any
  ];

  return (
    <div className="mx-auto w-full space-y-5 py-4 sm:max-w-[1280px] sm:px-0 sm:py-8">
      <DrilldownLayout
        title={(() => {
          const raw =
            drilldownCfg?.title
              ? drilldownCfg.title(data)
              : `${(resource as any)?.page_label || resource_name}`;
          if (typeof raw === "string" && raw.includes("{{")) {
            return safeTemplate(raw, (data as any) || {});
          }
          return raw;
        })()}
        subtitle={
          drilldownCfg?.subtitle ? drilldownCfg.subtitle(data) : undefined
        }
        avatarUrl={(() => {
          try {
            const key = (resource as any)?.avatar_column as string | undefined;
            if (key && (data as any) && (data as any)[key]) {
              return String((data as any)[key]);
            }
          } catch {}
          return undefined;
        })()}
        iconName={(resource as any)?.icon}
        actions={
          <div className="flex items-center gap-2 px-4">
            {(() => {
              const scope = (resource as any)?.edit?.scope as
                | string
                | undefined;
              const enabled = (resource as any)?.edit?.enabled !== false;
              if (!enabled) return null;
              const content = (
                <div className="flex items-center gap-2">
                  <Button
                    variant={"icon_v2"}
                    size="icon_v2"
                    onClick={() => setIsEditing((v) => !v)}
                  >
                    <Pencil className="stroke-icon h-5 w-5" />
                  </Button>
                  {isEditing && (
                    <Button
                      variant="brand"
                      size="xs"
                      onClick={handleSaveAll}
                      disabled={isSaving}
                    >
                      Save
                    </Button>
                  )}
                </div>
              );
              return scope ? (
                <ScopeWrapper scope={scope} emptyLoader fallback={null}>
                  {content}
                </ScopeWrapper>
              ) : (
                content
              );
            })()}
            {Array.isArray(drilldownCfg?.actions) &&
              drilldownCfg!.actions!.length > 0 && (
                <ResponsiveDropdownV2
                  dropdownLabel="Actions"
                  items={
                    drilldownCfg!.actions!.map((a: any) =>
                      a?.type === "separator"
                        ? { type: "separator" }
                        : {
                            buttonText: a.label,
                            onClick: () => a.onClick?.(data),
                            variant: a.destructive ? "destructive" : "default",
                            disabled:
                              typeof a.disabled === "function"
                                ? Boolean(a.disabled(data))
                                : Boolean(a.disabled),
                          },
                    ) as any
                  }
                />
              )}
            {view?.debug_mode === true && (
              <Button
                variant="icon_v2"
                size="icon_v2"
                className="rounded-sm"
                onClick={() => setShowJson(true)}
              >
                <Code2 className="stroke-icon h-5 w-5" />
              </Button>
            )}
          </div>
        }
        main={(() => {
          try {
            const Comp = (resource as any)?.drilldownCustomComponent;
            if (!Comp) return undefined;
            return (
              <div className="px-4 sm:px-0">
                {React.isValidElement(Comp) ? (
                  Comp
                ) : (
                  <Comp resourceId={String(resource_id)} resource={resource} />
                )}
              </div>
            );
          } catch {
            return undefined;
          }
        })()}
      >
        <ResponsiveDialog
          isOpen={showJson}
          onClose={() => setShowJson(false)}
          title="Raw JSON"
          disableMaxWidth={true}
          className="max-w-[700px]"
        >
          <div className="max-h-[70vh] overflow-auto">
            <JsonBlock data={data ?? {}} />
          </div>
        </ResponsiveDialog>

        {resource_name === "customers" && (data as any)?.customer_id && (
          <Container>
            <CustomerInvoiceSummaryForCustomer
              customerId={String((data as any).customer_id)}
            />
          </Container>
        )}

        {isEditing ? (
          (() => {
            const configured = (resource as any).columns;
            const row = (data as any) || {};
            let keys: string[] = Array.isArray(configured)
              ? configured
                  .filter((c: any) => !(typeof c === "object" && c?.hidden))
                  .map((c: any) => (typeof c === "string" ? c : c.column_name))
              : Object.keys(row);

            // Apply allowed/denied filters from resource.edit
            const editCfg = (resource as any)?.edit || {};
            const allowed = Array.isArray(editCfg.allowedColumns)
              ? new Set<string>(editCfg.allowedColumns as string[])
              : null;
            const denied = Array.isArray(editCfg.deniedColumns)
              ? new Set<string>(editCfg.deniedColumns as string[])
              : new Set<string>();
            denied.add((resource as any).idColumn);
            keys = keys.filter(
              (k) => (allowed ? allowed.has(k) : true) && !denied.has(k),
            );

            const specs: Array<LeanColumnSpec<any>> = (
              Array.isArray(configured)
                ? configured.map((c: any) =>
                    typeof c === "string"
                      ? { key: c, header: c.replace(/_/g, " ") }
                      : {
                          key: c.column_name,
                          header: c.header || c.header_label,
                          editor: (c as any).editor,
                        },
                  )
                : Object.keys(row).map((k) => ({ key: k, header: k }))
            ) as any;
            const colDefs = buildColumnsFromRegistry<any>(specs);
            const metaByKey = new Map<string, any>();
            (colDefs as any[]).forEach((col: any) => {
              const k = (col?.accessorKey as string) || (col?.id as string);
              metaByKey.set(k, col?.meta || {});
            });

            const renderFields = (list: string[]) =>
              list.map((k) => {
                const meta = metaByKey.get(k) || {};
                const headerText = meta.headerText || k.replace(/_/g, " ");
                const datatype = meta.datatype as string | undefined;
                const editorCfg = (meta as any)?.editor as
                  | {
                      type?: string;
                      options?: Array<{ value: any; label: string }>;
                    }
                  | undefined;
                const value = (formState as any)[k];
                return (
                  <label key={k} className="flex flex-col gap-1">
                    <span className="select-none text-sm font-medium capitalize text-secondary">
                      {headerText}
                    </span>
                    {editorCfg?.type === "select" &&
                    Array.isArray(editorCfg.options) ? (
                      <Select
                        value={value == null ? "" : String(value)}
                        onValueChange={(val: string) => {
                          const opt = editorCfg.options!.find(
                            (o) => String(o.value) === val,
                          );
                          const nextVal = opt ? opt.value : val;
                          setFormState((s) => ({ ...s, [k]: nextVal }));
                        }}
                      >
                        <SelectTrigger className="min-w-[180px] rounded-sm">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {editorCfg.options.map((opt) => (
                            <SelectItem
                              key={String(opt.value)}
                              value={String(opt.value)}
                            >
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : editorCfg?.type === "boolean" ||
                      datatype === "boolean" ? (
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="rounded-sm"
                          checked={Boolean(value)}
                          onChange={(e) =>
                            setFormState((s) => ({
                              ...s,
                              [k]: e.target.checked,
                            }))
                          }
                        />
                        <span className="text-xs text-secondary">
                          {value ? "yes" : "no"}
                        </span>
                      </label>
                    ) : (
                      <Input
                        className="h-8"
                        type={
                          editorCfg?.type === "number" || datatype === "number"
                            ? "number"
                            : "text"
                        }
                        value={value == null ? "" : String(value)}
                        onChange={(e) =>
                          setFormState((s) => ({ ...s, [k]: e.target.value }))
                        }
                      />
                    )}
                  </label>
                );
              });

            // If drilldown sections are configured, mirror them in edit mode
            if (
              Array.isArray(drilldownCfg?.sections) &&
              drilldownCfg!.sections!.length > 0
            ) {
              const gridCols = (n?: number) => {
                switch (n) {
                  case 1:
                    return "grid-cols-1";
                  case 3:
                    return "grid-cols-1 sm:grid-cols-3";
                  case 4:
                    return "grid-cols-1 sm:grid-cols-4";
                  case 2:
                  default:
                    return "grid-cols-1 sm:grid-cols-2";
                }
              };

              return (
                <div className="space-y-6 px-4">
                  {drilldownCfg!.sections!.map((section: any, idx: number) => {
                    // Build list of visible keys in this section, filtered by edit-allowed keys
                    const sectionKeys = (section.fields || [])
                      .map((f: any) => (typeof f === "string" ? f : f?.key))
                      .filter((k: any) => typeof k === "string" && keys.includes(k))
                      .filter((k: string) => {
                        const f = (section.fields || []).find((ff: any) =>
                          typeof ff === "string" ? ff === k : ff?.key === k,
                        );
                        const hidden =
                          typeof f === "object" ? Boolean((f as any).hidden) : false;
                        return !hidden;
                      });

                    if (sectionKeys.length === 0) return null;

                    return (
                      <div key={idx} className="space-y-3">
                        {section.title && (
                          <div className="text-primary text-base font-medium">
                            {section.title}
                          </div>
                        )}
                        <div className={`grid ${gridCols(section.columns)} gap-4`}>
                          {renderFields(sectionKeys)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            }

            // Build category index from configured columns (if any)
            const categoryByKey = new Map<string, string | undefined>();
            if (Array.isArray(configured)) {
              configured.forEach((c: any) => {
                if (typeof c === "object" && c?.column_name) {
                  const cat = (c as any).category as string | undefined;
                  categoryByKey.set(String(c.column_name), cat);
                }
              });
            }

            const declaredCategories = Array.isArray(
              (resource as any).categories,
            )
              ? ((resource as any).categories as string[])
              : [];

            // Partition keys
            const grouped: Record<string, string[]> = {};
            const uncategorized: string[] = [];
            keys.forEach((k) => {
              const cat = categoryByKey.get(k);
              if (cat && typeof cat === "string" && cat.length > 0) {
                if (!grouped[cat]) grouped[cat] = [];
                grouped[cat]!.push(k);
              } else {
                uncategorized.push(k);
              }
            });

            // If no categories declared and none assigned, fall back to flat grid
            const anyCategories =
              declaredCategories.length > 0 || Object.keys(grouped).length > 0;
            if (!anyCategories) {
              return (
                <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2">
                  {renderFields(keys)}
                </div>
              );
            }

            // Compose tab order
            const dynamicCats = Object.keys(grouped).filter(
              (c) => !declaredCategories.includes(c),
            );
            const ordered = [...declaredCategories, ...dynamicCats];

            // Build tabs
            const tabs: Array<{
              key: string;
              label: string;
              content: React.ReactNode;
            }> = [];

            if (uncategorized.length > 0) {
              tabs.push({
                key: "General",
                label: "General",
                content: (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {renderFields(uncategorized)}
                  </div>
                ),
              });
            }

            ordered.forEach((cat) => {
              const list = grouped[cat] || [];
              if (list.length === 0) return;
              tabs.push({
                key: cat,
                label: cat,
                content: (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {renderFields(list)}
                  </div>
                ),
              });
            });

            return (
              <div className="px-4">
                <TabsWithContent
                  tabs={tabs}
                  activeIndex={activeEditTabIndex}
                  onTabChange={setActiveEditTabIndex}
                />
              </div>
            );
          })()
        ) : Array.isArray(drilldownCfg?.sections) &&
          drilldownCfg!.sections!.length > 0 ? (
          drilldownCfg!.sections!.map((section: any, idx: number) => {
            const sectionFields = (section.fields || []).map((f: any) => {
              const key = typeof f === "string" ? f : f.key;
              const base = (fields as any[]).find((ff) => ff.key === key);
              const label =
                (typeof f === "object" && f.label) ||
                base?.label ||
                String(key).replace(/_/g, " ");
              return {
                key,
                label,
                hidden: typeof f === "object" ? Boolean(f.hidden) : false,
                render: base?.render,
                href: base?.href,
              } as any;
            });
            return (
              <DrilldownEntityRenderer
                key={idx}
                entity={data || {}}
                fields={sectionFields as any}
                columns={section.columns || 2}
                title={section.title}
              />
            );
          })
        ) : (
          <DrilldownEntityRenderer
            entity={data || {}}
            fields={fields as any}
            title={`${(resource as any)?.page_label || resource_name}`}
          />
        )}
      </DrilldownLayout>
    </div>
  );
};
