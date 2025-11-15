"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  buildColumnsFromRegistry,
  type LeanColumnSpec,
} from "./column-registry";

import type { ResourceFieldSpec, BuiltColumnSpec } from "../resource-types";
import { defaultEditorByColumn } from "./column-registry";

// Build columns compatible with ResourceRoute.columns from a higher-level spec.
// - Maps field_type/options/data_source into the existing `editable` shape used by table views
// - Falls back to defaults from column-registry when field_type is omitted
// - Deduplicate based on column_name, keep the first occurrence
export function defineColumns(specs: ResourceFieldSpec[]): BuiltColumnSpec[] {
  const seen = new Set<string>();
  const deduped = specs.filter((s) => {
    if (seen.has(s.column_name)) return false;
    seen.add(s.column_name);
    return true;
  });

  return deduped.map((s) => {
    const fallbackEditor = defaultEditorByColumn[s.column_name];
    const candidateType =
      typeof s.field_type !== "undefined" ? s.field_type : fallbackEditor?.type;

    let resolvedEditorType: "text" | "boolean" | "select" | undefined;
    switch (candidateType) {
      case "select":
        resolvedEditorType = "select";
        break;
      case "boolean":
        resolvedEditorType = "boolean";
        break;
      case "text":
      case "number":
      case "date":
      case "textarea":
        resolvedEditorType = "text";
        break;
      default:
        resolvedEditorType = undefined;
    }

    const editable = resolvedEditorType
      ? {
          type: resolvedEditorType,
          update_table: s.update_table,
          update_id_column: s.update_id_column,
          update_column: s.update_column,
          options: s.options,
          // Keep data_source as metadata for option resolvers downstream
          data_source: s.data_source,
        }
      : undefined;

    return {
      column_name: s.column_name,
      header: s.header,
      header_label: s.header_label,
      use: s.use,
      order: s.order,
      href: s.href,
      hidden: s.hidden,
      label: s.label,
      category: s.category,
      cell_value_mask_label: s.cell_value_mask_label,
      formatter: s.formatter as any,
      minWidth: s.minWidth,
      maxWidth: s.maxWidth,
      widthFit: s.widthFit,
      editable,
    };
  });
}
