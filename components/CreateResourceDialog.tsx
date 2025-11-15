"use client";

import React from "react";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNotification } from "@/components/notifications/base";
import { insertRow } from "../utils/insert";

type FieldValue = string | number | boolean | null;

export function CreateResourceDialog(props: {
  open: boolean;
  onClose: () => void;
  required?: string[];
  optional?: string[];
  table: string;
  onCreated?: (createdRow: any) => void;
  /**
   * When provided, the dialog will render this component instead of the default generated form.
   * The component should collect values and call onSubmit with the payload to insert.
   */
  DialogComponent?: React.ComponentType<{
    onSubmit(values: Record<string, unknown>): void;
    onCancel(): void;
    initial?: Partial<Record<string, unknown>>;
    pending?: boolean;
  }>;
  /**
   * Optional column specs to auto-map fields by column_name when required/optional are not supplied.
   * Accepts either a string column name or an object with at least { column_name }.
   */
  columns?: Array<
    | string
    | {
        column_name: string;
        header?: string;
        header_label?: string;
        hidden?: boolean;
        data_type?: string;
        editor?: {
          type?: "text" | "number" | "boolean" | "select";
          options?: Array<{ label: string; value: string | number | boolean }>;
        };
      }
  >;
  title?: string;
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
  } = props;
  const { notification } = useNotification();
  const [values, setValues] = React.useState<Record<string, FieldValue>>({});
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      const init: Record<string, FieldValue> = {};
      (required || []).forEach((k) => {
        init[k] = "";
      });
      (optional || []).forEach((k) => {
        if (init[k] == null) init[k] = "";
      });
      // If no explicit fields provided, but columns exist, initialize from columns
      if ((!required || required.length === 0) && (!optional || optional.length === 0)) {
        const derivedKeys: string[] = Array.isArray(columns)
          ? (columns as any[])
              .filter((c) => {
                const isHidden = typeof c === "object" ? Boolean((c as any)?.hidden) : false;
                return !isHidden;
              })
              .map((c) => (typeof c === "string" ? c : String((c as any)?.column_name)))
              .filter((k) => typeof k === "string" && k.trim() !== "")
          : [];
        derivedKeys.forEach((k) => {
          if (init[k] == null) init[k] = "";
        });
      }
      setValues(init);
    }
  }, [open, JSON.stringify(required), JSON.stringify(optional), JSON.stringify(columns)]);

  async function handleSubmit(payload?: Record<string, unknown>) {
    try {
      const source = payload ?? values;
      const missing = (required || []).filter((k) => {
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
      setLoading(true);
      // Filter out empty-string values to avoid inserting blanks for unmapped optional/derived fields
      const body: Record<string, unknown> = {};
      Object.entries(source).forEach(([k, v]) => {
        if (v === "" || v === undefined || v === null) return;
        body[k] = v as unknown;
      });
      const result = await insertRow(table, body);
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

  // Decide which fields to render: explicit required/optional or derived from columns
  const hasExplicitFields =
    (Array.isArray(required) && required.length > 0) ||
    (Array.isArray(optional) && optional.length > 0);

  const derivedColumns: Array<{
    key: string;
    label: string;
    type: "text" | "number" | "boolean";
  }> = !hasExplicitFields && Array.isArray(columns)
    ? (columns as any[])
        .filter((c) => !(typeof c === "object" && (c as any)?.hidden))
        .map((c) => {
          const key = typeof c === "string" ? c : String((c as any)?.column_name);
          const header =
            typeof c === "object"
              ? (String((c as any)?.header_label || (c as any)?.header || key) as string)
              : key;
          const dt =
            typeof c === "object"
              ? String(((c as any)?.data_type || "") as string).toLowerCase()
              : "";
          let type: "text" | "number" | "boolean" = "text";
          if (dt.includes("bool")) type = "boolean";
          else if (
            dt.includes("num") ||
            dt.includes("int") ||
            dt.includes("decimal") ||
            dt.includes("currency")
          )
            type = "number";
          return { key, label: header.replace(/_/g, " "), type };
        })
        .filter((c) => typeof c.key === "string" && c.key.trim() !== "")
    : [];

  return (
    <ResponsiveDialog
      isOpen={open}
      onClose={onClose}
      title={title}
      className="max-w-[620px]"
    >
      <div className="space-y-4 px-1">
        {hasExplicitFields &&
          (required || []).map((key) => (
          <label key={key} className="flex flex-col gap-1">
            <span className="text-sm font-medium capitalize text-secondary">
              {String(key).replace(/_/g, " ")}
            </span>
            <Input
              value={values[key] == null ? "" : String(values[key] ?? "")}
              onChange={(e) =>
                setValues((s) => ({ ...s, [key]: e.target.value }))
              }
              className="h-8"
            />
          </label>
        ))}

        {hasExplicitFields && (optional || []).length > 0 && (
          <div className="space-y-3 pt-2">
            {(optional || []).map((key) => (
              <label key={key} className="flex flex-col gap-1">
                <span className="text-sm font-medium capitalize text-secondary">
                  {String(key).replace(/_/g, " ")} <span className="opacity-60">(optional)</span>
                </span>
                <Input
                  value={values[key] == null ? "" : String(values[key] ?? "")}
                  onChange={(e) =>
                    setValues((s) => ({ ...s, [key]: e.target.value }))
                  }
                  className="h-8"
                />
              </label>
            ))}
          </div>
        )}

        {!hasExplicitFields &&
          derivedColumns.map((col) => (
            <label key={col.key} className="flex flex-col gap-1">
              <span className="text-sm font-medium capitalize text-secondary">
                {col.label}
              </span>
              {col.type === "boolean" ? (
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="rounded-sm"
                    checked={Boolean(values[col.key])}
                    onChange={(e) =>
                      setValues((s) => ({ ...s, [col.key]: e.target.checked }))
                    }
                  />
                  <span className="text-xs text-secondary">
                    {values[col.key] ? "yes" : "no"}
                  </span>
                </label>
              ) : (
                <Input
                  className="h-8"
                  type={col.type === "number" ? "number" : "text"}
                  value={values[col.key] == null ? "" : String(values[col.key] ?? "")}
                  onChange={(e) =>
                    setValues((s) => ({ ...s, [col.key]: e.target.value }))
                  }
                />
              )}
            </label>
          ))}
      </div>
      <div className="mt-4 flex justify-end gap-2 px-1">
        <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="brand" size="sm" onClick={() => void handleSubmit()} disabled={loading}>
          Create
        </Button>
      </div>
    </ResponsiveDialog>
  );
}


