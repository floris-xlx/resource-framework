"use client";

import type { ReactNode } from "react";

export type FieldDataType =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "json"
  | "timestamp"
  | "uuid"
  | "other";

export type FieldInputType =
  | "text"
  | "number"
  | "boolean"
  | "select"
  | "date"
  | "textarea";

export type DataSourceRef =
  | string // e.g. "table.column"
  | { table: string; column: string };

export type SelectOption = {
  value: string | number | boolean;
  label: string;
};

export type ResourceFieldSpec = {
  column_name: string;
  header?: string;
  header_label?: string;
  label?: string;
  href?: string;
  hidden?: boolean;
  category?: string;
  order?: number;
  minWidth?: number;
  maxWidth?: number;
  widthFit?: boolean;
  cell_value_mask_label?: string;
  formatter?: (
    value: any,
    row: any,
  ) => ReactNode | string | number | null | undefined;
  use?: string;
  data_type?: FieldDataType;
  field_type?: FieldInputType;
  options?: SelectOption[];
  data_source?: DataSourceRef;

  update_table?: string;
  update_id_column?: string;
  update_column?: string;
};

export type BuiltColumnSpec = {
  column_name: string;
  header?: string;
  header_label?: string;
  use?: string;
  order?: number;
  href?: string;
  hidden?: boolean;
  label?: string;
  category?: string;
  cell_value_mask_label?: string;
  formatter?: (value: any, row: any) => any;
  minWidth?: number;
  maxWidth?: number;
  widthFit?: boolean;
  editable?: {
    type: "text" | "select" | "boolean";
    update_table?: string;
    update_id_column?: string;
    update_column?: string;
    options?: Array<{ label: string; value: string | number | boolean }>;
    data_source?: string | { table: string; column: string };
  };
};
