"use client";

import React, { useState, useEffect } from "react";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { useNotification } from "@/components/notifications/base";
import { APP_CONFIG } from "@/config";
import { useUserStore } from "@/lib/stores";
import { insertRow } from "../utils/insert";
import { useApiClient } from "@/hooks/use-api-client";
import { SpecDrivenDialog, type FieldSpec } from "./dialog";

type FieldValue = string | number | boolean | null;

type ColumnConfig =
  | string
  | {
      column_name: string;
      header?: string;
      header_label?: string;
      hidden?: boolean;
      data_type?: string;
      // Default value to be submitted (commonly for hidden/system fields)
      default_value?: FieldValue;
      editor?: {
        type?: "text" | "number" | "boolean" | "select";
        options?: Array<{ label: string; value: string | number | boolean }>;
      };
    };

export function CreateResourceDialog(props: {
  open: boolean;
  onClose: () => void;
  required?: string[];
  optional?: string[];
  table?: string;
  onCreated?: (createdRow: any) => void;
  DialogComponent?: React.ComponentType<{
    onSubmit(values: Record<string, unknown>): void;
    onCancel(): void;
    initial?: Partial<Record<string, unknown>>;
    pending?: boolean;
  }>;
  columns?: Array<ColumnConfig>;
  title?: string;
  /**
   * Optional resource_name to fetch route config from DB when explicit props are not supplied.
   */
  resourceName?: string;
  /**
   * Control request caching headers for DB fetches.
   * When false (default), we send Cache-Control: no-cache
   */
  cacheEnabled?: boolean;
  /**
   * Provide default values that should be submitted even if not rendered as fields.
   * Useful for system/foreign key fields like customer_id.
   */
  defaultValues?: Partial<Record<string, FieldValue>>;
}) {
  const {
    open,
    onClose,
    required = [],
    optional = [],
    table,
    onCreated,
    DialogComponent,
    columns,
    title = "Create",
    resourceName,
    cacheEnabled = false,
    defaultValues = {},
  } = props;
  const { notification } = useNotification();
  const { user } = useUserStore();
  const [values, setValues] = useState<Record<string, FieldValue>>({});
  const [loading, setLoading] = useState(false);

  // Derived config from DB when explicit config is not supplied
  const [derivedTable, setDerivedTable] = useState<string | undefined>(table);
  const [derivedRequired, setDerivedRequired] = useState<string[]>(
    Array.isArray(required) ? required : [],
  );
  const [derivedOptional, setDerivedOptional] = useState<string[]>(
    Array.isArray(optional) ? optional : [],
  );
  const [derivedColumns, setDerivedColumns] = useState<Array<ColumnConfig>>(
    Array.isArray(columns) ? columns : [],
  );
  const [metadataColumn, setMetadataColumn] = useState<string>("metadata");

  useEffect(() => {
    setDerivedTable(table);
  }, [table]);
  useEffect(() => {
    setDerivedRequired(Array.isArray(required) ? required : []);
  }, [JSON.stringify(required)]);
  useEffect(() => {
    setDerivedOptional(Array.isArray(optional) ? optional : []);
  }, [JSON.stringify(optional)]);
  useEffect(() => {
    setDerivedColumns(Array.isArray(columns) ? columns : []);
  }, [JSON.stringify(columns)]);

  // Load route config if needed via data hook
  const noExplicit =
    (!table || table.trim() === "") &&
    (!Array.isArray(required) || required.length === 0) &&
    (!Array.isArray(optional) || optional.length === 0) &&
    (!Array.isArray(columns) || columns.length === 0);
  const canFetchRoute =
    Boolean(open && noExplicit && resourceName && user?.user_id && user?.company_id && user?.organization_id);

  const { data: routeByResource } = useApiClient<any>({
    table: "resource_routes",
    conditions: [{ eq_column: "resource_name", eq_value: String(resourceName || "") }],
    single: true,
    enabled: canFetchRoute,
    noCache: !cacheEnabled,
  });
  const { data: routeByTable } = useApiClient<any>({
    table: "resource_routes",
    conditions: [{ eq_column: "table", eq_value: String(resourceName || "") }],
    single: true,
    enabled: Boolean(canFetchRoute && !routeByResource),
    noCache: !cacheEnabled,
  });

  useEffect(() => {
    const row = (routeByResource as any) || (routeByTable as any) || null;
    if (!row) return;
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
    setDerivedTable(row?.table || resourceName);
    const req = toArray(row?.new_resource_mandatory_columns) as string[];
    const opt = toArray(row?.new_resource_optional_columns) as string[];
    setDerivedRequired(req);
    setDerivedOptional(opt);
    const cols = mapColumns(row?.columns);
    setDerivedColumns(cols);
    try {
      const mc = String(row?.metadata_column || "").trim();
      setMetadataColumn(mc || "metadata");
    } catch {
      setMetadataColumn("metadata");
    }
  }, [routeByResource, routeByTable, resourceName]);

  // Initialize values on open based on required/optional/columns (explicit or derived)
  useEffect(() => {
    if (open) {
      const init: Record<string, FieldValue> = {};

      // Always seed required/optional keys
      (derivedRequired || []).forEach((k) => {
        init[k] = "";
      });
      (derivedOptional || []).forEach((k) => {
        if (init[k] == null) init[k] = "";
      });

      // If using column-driven spec, include ALL columns (including hidden) so defaults can flow through
      const hasExplicitFields =
        (Array.isArray(derivedRequired) && derivedRequired.length > 0) ||
        (Array.isArray(derivedOptional) && derivedOptional.length > 0);
      if (!hasExplicitFields && Array.isArray(derivedColumns)) {
        (derivedColumns as any[]).forEach((c) => {
          const key = typeof c === "string" ? c : String((c as any)?.column_name);
          if (!key) return;
          if (init[key] == null) init[key] = "";
        });
      }

      // Overlay default values from columns (default_value) and from prop defaultValues
      if (Array.isArray(derivedColumns)) {
        for (const c of derivedColumns as any[]) {
          if (typeof c === "object" && c?.column_name) {
            const key = String(c.column_name);
            // Do not apply default_value to required fields
            if (
              Object.prototype.hasOwnProperty.call(c, "default_value") &&
              !(derivedRequired || []).includes(key)
            ) {
              init[key] = (c as any).default_value as FieldValue;
            }
          }
        }
      }
      Object.entries(defaultValues || {}).forEach(([k, v]) => {
        init[k] = v as FieldValue;
      });

      // Ensure metadata column is initialized as object for key-value editor
      try {
        const mc = metadataColumn || "metadata";
        if (mc && init[mc] == null) {
          init[mc] = {} as any;
        }
      } catch {}

      setValues(init);
    }
  }, [
    open,
    JSON.stringify(derivedRequired),
    JSON.stringify(derivedOptional),
    JSON.stringify(derivedColumns),
    JSON.stringify(defaultValues),
    metadataColumn,
  ]);

  async function handleSubmit(payload?: Record<string, unknown>) {
    try {
      // Merge defaults with user payload/values. Explicit payload overrides defaults.
      const mergedDefaults: Record<string, unknown> = {};
      if (Array.isArray(derivedColumns)) {
        for (const c of derivedColumns as any[]) {
          if (typeof c === "object" && c?.column_name) {
            const key = String(c.column_name);
            // Do not apply default_value to required fields
            if (
              Object.prototype.hasOwnProperty.call(c, "default_value") &&
              !(derivedRequired || []).includes(key)
            ) {
              mergedDefaults[key] = (c as any).default_value as unknown;
            }
          }
        }
      }
      Object.assign(mergedDefaults, defaultValues || {});
      const base = payload ?? values;
      const source = { ...mergedDefaults, ...base };
      const missing = (derivedRequired || []).filter((k) => {
        const v = source[k];
        return v == null || String(v).trim() === "";
      });
      if (missing.length > 0) {
        notification({
          message: "Please complete required fields",
          success: false,
        });
        return;
      }
      if (!derivedTable || String(derivedTable).trim() === "") {
        notification({
          message: "Unknown target table",
          success: false,
        });
        return;
      }
      setLoading(true);
      // Filter out empty-string values to avoid inserting blanks for unmapped optional/derived fields
      const body: Record<string, unknown> = {};
      Object.entries(source).forEach(([k, v]) => {
        if (v === "" || v === undefined || v === null) return;
        body[k] = v as unknown;
      });
      const result = await insertRow(derivedTable, body);
      if (!result.ok) {
        notification({
          message: "Could not create – try again",
          success: false,
        });
        return;
      }
      const j = result.data || {};
      notification({ message: "Created successfully", success: true });
      onClose?.();
      const row =
        (j?.data && Array.isArray(j.data) ? j.data[0] : j?.data) || null;
      onCreated?.(row);
    } catch {
      notification({
        message: "Could not create – try again",
        success: false,
      });
    } finally {
      setLoading(false);
    }
  }

  // Render a completely custom dialog form when provided
  if (DialogComponent) {
    return (
      <ResponsiveDialog
        isOpen={open}
        onClose={onClose}
        title={title}
        className="max-w-[620px]"
      >
        <DialogComponent
          onSubmit={(vals) => {
            void handleSubmit(vals as Record<string, unknown>);
          }}
          onCancel={onClose}
          initial={values}
          pending={loading}
        />
      </ResponsiveDialog>
    );
  }

  // Build spec from explicit required/optional or derived columns
  const hasExplicitFields =
    (Array.isArray(derivedRequired) && derivedRequired.length > 0) ||
    (Array.isArray(derivedOptional) && derivedOptional.length > 0);
  const baseSpec: FieldSpec[] = hasExplicitFields
    ? ([...(derivedRequired || []), ...(derivedOptional || [])] as FieldSpec[])
    : ((derivedColumns as unknown) as FieldSpec[]);
  const metadataSpec: FieldSpec = {
    column_name: metadataColumn || "metadata",
    header_label: "Additional fields",
    editor: { type: "keyvalue" },
  };
  const spec: FieldSpec[] = [...baseSpec, metadataSpec];

  return (
    <SpecDrivenDialog
      open={open}
      onClose={onClose}
      title={title}
      spec={spec}
      initial={values}
      pending={loading}
      submitLabel="Create"
      cancelLabel="Cancel"
      onSubmit={(vals) => void handleSubmit(vals as Record<string, unknown>)}
      stripEmpty
    />
  );
}
