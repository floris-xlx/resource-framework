"use client";
import type { ColumnDef, HeaderContext, Row } from "@tanstack/react-table";
import type React from "react";
import { Flag } from "../adapters/proxies";
import { Badge } from "../adapters/proxies";
import { Button } from "../adapters/proxies";
import { formatUnixSecondsToDate, formatUnixSecondsToMonthDayTime, prettyString } from "../utils/format";
import { AssigneesCell } from "../components/cells/AssigneesCell";

export type RegistryRenderer<TData> = {
  build: (opts: {
    key: Extract<keyof TData, string | number>;
    header?: string;
  }) => ColumnDef<TData>;
  order?: number;
  filterable?: boolean;
  datatype?: "string" | "number" | "boolean" | "date" | "json" | "other";
};

export type ColumnRegistry<TData> = Record<string, RegistryRenderer<TData>>;

function defaultTextCell<TData>(key: keyof TData) {
  return ({ row }: { row: { original: TData } }) => {
    const value: any = (row.original as any)[key];
    return <span className="truncate text-primary">{String(value ?? "")}</span>;
  };
}

function renderHeader(header: string) {
  return (
    <span className="text-[12px] capitalize text-secondary">{header}</span>
  );
}

// Status -> Badge renderer with custom sort order
export const STATUS_SORT_ORDER = [
  "draft",
  "pending",
  "draft_booking",
  "open",
  "active",
  "paid",
  "without_document",
  "to_be_received",
  "accepted",
  "match",
  "completed",
  "overdue",
  "uncollectable",
  "cancelled",
  "expired",
  "no_match",
];

const MONTH_SORT_ORDER = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
];

function getStatusSortIndex(status: string) {
  const idx = STATUS_SORT_ORDER.indexOf(status);
  return idx === -1 ? STATUS_SORT_ORDER.length : idx;
}

// Month -> Normal text renderer with custom sort order
function buildMonthColumn<TData>(opts: {
  key: Extract<keyof TData, string | number>;
  header?: string;
}): ColumnDef<TData> {
  const { key, header } = opts;
  return {
    header: () => renderHeader(header ?? prettyString(String(key))),
    accessorKey: key as string,
    cell: ({ row }: { row: { original: TData } }) => {
      const value = (row.original as any)[key];
      return (
        <span className="truncate text-primary">{String(value ?? "")}</span>
      );
    },
    size: 120,
    enableSorting: true,
    sortingFn: (rowA, rowB, columnId) => {
      const a = rowA.getValue(columnId);
      const b = rowB.getValue(columnId);
      const aIdx = MONTH_SORT_ORDER.indexOf(String(a ?? "").toUpperCase());
      const bIdx = MONTH_SORT_ORDER.indexOf(String(b ?? "").toUpperCase());
      if (aIdx === bIdx) {
        return String(a ?? "").localeCompare(String(b ?? ""));
      }
      return (
        (aIdx === -1 ? MONTH_SORT_ORDER.length : aIdx) -
        (bIdx === -1 ? MONTH_SORT_ORDER.length : bIdx)
      );
    },
  };
}

// Status -> Badge renderer with custom sort order
function buildStatusColumn<TData>(opts: {
  key: Extract<keyof TData, string | number>;
  header?: string;
}): ColumnDef<TData> {
  const { key, header } = opts;

  return {
    header: () => renderHeader(header ?? prettyString(String(key))),
    accessorKey: key as string,
    cell: ({ row }: { row: { original: TData } }) => {
      const value = (row.original as any)[key];
      if (!value) return null;
      const text = String(value);
      return (
        <Badge variant={text.toLowerCase() as any} size="sm">
          {prettyString(text)}
        </Badge>
      );
    },
    size: 120,
    enableSorting: true,
    sortingFn: (rowA, rowB, columnId) => {
      const a = rowA.getValue(columnId);
      const b = rowB.getValue(columnId);
      const aIdx = getStatusSortIndex(String(a ?? "").toLowerCase());
      const bIdx = getStatusSortIndex(String(b ?? "").toLowerCase());
      if (aIdx === bIdx) {
        return String(a ?? "").localeCompare(String(b ?? ""));
      }
      return aIdx - bIdx;
    },
  };
}

// Render a percentage column, formatting numbers (0.12 => '12%') and supporting sorting/filtering.
function buildPercentageColumn<TData>(
  opts: {
    key?: Extract<keyof TData, string | number>;
    header?: string;
  } = {},
): ColumnDef<TData> {
  const { key, header } = opts as any;
  const columnKey = key as string;

  return {
    header: () => renderHeader(header ?? prettyString(columnKey)),
    accessorKey: columnKey,
    cell: ({ row }: { row: { original: TData } }) => {
      const value = (row.original as any)[columnKey];
      if (value === undefined || value === null || isNaN(Number(value)))
        return <span className="text-secondary">—</span>;
      let percentValue = Number(value);
      // If value is in decimals (e.g., 0.15), convert to percentage
      if (percentValue > 0 && percentValue <= 1)
        percentValue = percentValue * 100;
      return (
        <div className="flex flex-row font-medium text-primary">
          {percentValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          <div className="w-[1px]"></div>%
        </div>
      );
    },
    size: 110,
    enableSorting: true,
    sortingFn: (rowA, rowB, columnId) => {
      const a = Number(rowA.getValue(columnId));
      const b = Number(rowB.getValue(columnId));
      return (isNaN(a) ? -Infinity : a) - (isNaN(b) ? -Infinity : b);
    },
    filterFn: (row, columnId, filterValue) => {
      // basic filter for percentage: supports single value or range: "10" or "10-20"
      const raw = row.getValue(columnId);
      let val = Number(raw);
      if (val > 0 && val <= 1) val = val * 100;
      if (!filterValue) return true;
      if (typeof filterValue === "string" && filterValue.includes("-")) {
        const [min, max] = filterValue.split("-").map(Number);
        return val >= (min || 0) && val <= (max || 100);
      }
      const target = Number(filterValue);
      return !isNaN(target) ? val === target : true;
    },
  };
}

// Time (unix ms or ISO date string) -> relative timestamp
// MMM DD, HH:MM
// Jan 12, 08:12
function buildTimeColumn<TData>(opts: {
  key: Extract<keyof TData, string | number>;
  header?: string;
}): ColumnDef<TData> {
  const { key, header } = opts;

  function parseToUnixSeconds(val: any): number | null {
    if (val == null) return null;
    if (typeof val === "number") {
      if (val > 1e12) return Math.floor(val / 1000);
      return val;
    }
    if (typeof val === "string") {
      const isoDateOnlyMatch = /^\d{4}-\d{2}-\d{2}$/.test(val);
      if (isoDateOnlyMatch) {
        const date = new Date(val + "T00:00:00Z");
        if (!isNaN(date.getTime())) {
          return Math.floor(date.getTime() / 1000);
        }
      }
      const isoWithTimeMatch =
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?([+-]\d{2}:\d{2}|Z)?$/.test(
          val,
        );
      if (isoWithTimeMatch) {
        const date = new Date(val);
        if (!isNaN(date.getTime())) {
          return Math.floor(date.getTime() / 1000);
        }
      }
      const asNum = Number(val);
      if (!isNaN(asNum)) {
        if (asNum > 1e12) return Math.floor(asNum / 1000);
        return asNum;
      }
      const parsed = Date.parse(val);
      if (!isNaN(parsed)) {
        return Math.floor(parsed / 1000);
      }
    }
    return null;
  }

  return {
    header: () => renderHeader(header ?? prettyString(String(key))),
    accessorKey: key as string,
    cell: ({ row }: { row: { original: TData } }) => {
      const value = (row.original as any)[key];
      const unixSeconds = parseToUnixSeconds(value);
      if (unixSeconds == null) return null as unknown as React.ReactNode;
      return (
        <span className="whitespace-nowrap text-secondary">
          {formatUnixSecondsToMonthDayTime(unixSeconds)}
        </span>
      ) as unknown as React.ReactNode;
    },
    enableSorting: true,
    sortingFn: (rowA: Row<TData>, rowB: Row<TData>, columnId: string) => {
      const a = parseToUnixSeconds(rowA.getValue(columnId));
      const b = parseToUnixSeconds(rowB.getValue(columnId));
      return Number(a ?? 0) - Number(b ?? 0);
    },
  } as unknown as ColumnDef<TData>;
}

// Time (unix ms) -> relative timestamp
// MMM DD
// Jan 12
function buildDayColumn<TData>(opts: {
  key: Extract<keyof TData, string | number>;
  header?: string;
}): ColumnDef<TData> {
  const { key, header } = opts;
  return {
    header: () => renderHeader(header ?? prettyString(String(key))),
    accessorKey: key as string,
    cell: ({ row }: { row: { original: TData } }) => {
      const value = (row.original as any)[key];
      if (value == null) return null as unknown as React.ReactNode;
      return (
        <span className="whitespace-nowrap text-secondary">
          {formatUnixSecondsToDate(Number(value))}
        </span>
      ) as unknown as React.ReactNode;
    },
    enableSorting: true,
    sortingFn: (rowA: Row<TData>, rowB: Row<TData>, columnId: string) => {
      // Sort by the raw unix time value for easier comparison
      const a = rowA.getValue(columnId);
      const b = rowB.getValue(columnId);
      return Number(a ?? 0) - Number(b ?? 0);
    },
  } as unknown as ColumnDef<TData>;
}

function buildBooleanYesNoColumn<TData>(opts: {
  key: Extract<keyof TData, string | number>;
  header?: string;
}): ColumnDef<TData> {
  const { key, header } = opts;
  return {
    header: () => renderHeader(header ?? prettyString(String(key))),
    accessorKey: key as string,
    cell: ({ row }: { row: { original: TData } }) => {
      const value = Boolean((row.original as any)[key]);
      return (
        <Badge variant={value} className="capitalize">
          {value ? "yes" : "no"}
        </Badge>
      ) as unknown as React.ReactNode;
    },
    enableSorting: false,
  } as unknown as ColumnDef<TData>;
}

// render country codes to country flag + code
function buildCountryCodeColumn<TData>(opts: {
  key: Extract<keyof TData, string | number>;
  header?: string;
}): ColumnDef<TData> {
  const { key, header } = opts;
  return {
    header: () => renderHeader(header ?? prettyString(String(key))),
    accessorKey: key as string,
    cell: ({ row }: { row: { original: TData } }) => {
      const value = (row.original as any)[key];
      if (!value) return null;
      // Always use the 2-letter ISO code
      return (
        <span className="flex w-fit items-center gap-2 rounded-sm border bg-foreground p-0.5 px-1">
          <Flag country={String(value)} size={20} includeCountryCode />
        </span>
      );
    },
    enableSorting: true,
    sortingFn: (rowA: Row<TData>, rowB: Row<TData>, columnId: string) => {
      // Sort alphabetically by country code
      const a = String(rowA.getValue(columnId) ?? "");
      const b = String(rowB.getValue(columnId) ?? "");
      return a.localeCompare(b);
    },
  } as unknown as ColumnDef<TData>;
}

// Duration in ms -> adds ms suffix
function buildDurationMsColumn<TData>(opts: {
  key: Extract<keyof TData, string | number>;
  header?: string;
}): ColumnDef<TData> {
  const { key, header } = opts;
  return {
    header: function Header(ctx: HeaderContext<TData, unknown>) {
      return renderHeader(header ?? prettyString(String(key)));
    },
    accessorKey: key as string,
    cell: ({ row }: { row: { original: TData } }) => {
      const value = (row.original as any)[key];
      return (
        <span className="text-secondary">{value ? `${value}ms` : ""}</span>
      );
    },
    enableSorting: true,
    sortingFn: (rowA: Row<TData>, rowB: Row<TData>, columnId: string) => {
      const a = Number(rowA.getValue(columnId) ?? 0);
      const b = Number(rowB.getValue(columnId) ?? 0);
      return a - b;
    },
  } as unknown as ColumnDef<TData>;
}

// Seconds -> adds s suffix (e.g., expires_in)
function buildSecondsColumn<TData>(opts: {
  key: Extract<keyof TData, string | number>;
  header?: string;
}): ColumnDef<TData> {
  const { key, header } = opts;
  return {
    header: function Header(ctx: HeaderContext<TData, unknown>) {
      return renderHeader(header ?? prettyString(String(key)));
    },
    accessorKey: key as string,
    cell: ({ row }: { row: { original: TData } }) => {
      const value = (row.original as any)[key];
      return <span className="text-secondary">{value ? `${value}s` : ""}</span>;
    },
    enableSorting: false,
  } as unknown as ColumnDef<TData>;
}

// Long ids -> break-all styling
function buildBreakAllTextColumn<TData>(opts: {
  key: Extract<keyof TData, string | number>;
  header?: string;
}): ColumnDef<TData> {
  const { key, header } = opts;
  return {
    header: function Header(ctx: HeaderContext<TData, unknown>) {
      return renderHeader(header ?? prettyString(String(key)));
    },
    accessorKey: key as string,
    cell: function Cell({ row }: { row: { original: TData } }) {
      return (
        <span className="break-all text-secondary">
          {String((row.original as any)[key] ?? "")}
        </span>
      );
    },
  } as unknown as ColumnDef<TData>;
}

// JSON -> stringified column
function buildJsonStringColumn<TData>(opts: {
  key: Extract<keyof TData, string | number>;
  header?: string;
}): ColumnDef<TData> {
  const { key, header } = opts;
  return {
    header: function Header(ctx: HeaderContext<TData, unknown>) {
      return renderHeader(header ?? prettyString(String(key)));
    },
    accessorKey: key as string,
    cell: function Cell({ row }: { row: { original: TData } }) {
      const value = (row.original as any)[key];
      let displayValue = "";
      if (value === null || value === undefined) {
        displayValue = "";
      } else if (typeof value === "object") {
        try {
          displayValue = JSON.stringify(value);
        } catch {
          displayValue = String(value);
        }
      } else {
        displayValue = String(value);
      }
      return <span className="truncate text-primary">{displayValue}</span>;
    },
  } as unknown as ColumnDef<TData>;
}

// Fallback generic column builder
function buildGenericColumn<TData>(opts: {
  key: Extract<keyof TData, string | number>;
  header?: string;
}): ColumnDef<TData> {
  const { key, header } = opts;
  return {
    header: function Header(ctx: HeaderContext<TData, unknown>) {
      return renderHeader(header ?? prettyString(String(key)));
    },
    accessorKey: key as string,
    cell: function Cell({ row }: { row: { original: TData } }) {
      const value = (row.original as any)[key];
      return (
        <span className="truncate text-primary">{String(value ?? "")}</span>
      );
    },
    enableSorting: true,
  } as unknown as ColumnDef<TData>;
}

function buildUppercaseColumn<TData>(opts: {
  key: Extract<keyof TData, string | number>;
  header?: string;
}): ColumnDef<TData> {
  const { key, header } = opts;
  return {
    header: function Header(ctx: HeaderContext<TData, unknown>) {
      return renderHeader(header ?? prettyString(String(key)));
    },
    accessorKey: key as string,
    cell: function Cell({ row }: { row: { original: TData } }) {
      const value: any = (row.original as any)[key];
      return (
        <span className="truncate text-primary">
          {String(value ?? "").toUpperCase()}
        </span>
      ) as unknown as React.ReactNode;
    },
  } as unknown as ColumnDef<TData>;
}

// Currency -> render using Intl.NumberFormat with currency from row (default EUR)
function buildCurrencyColumn<TData>(opts: {
  key: Extract<keyof TData, string | number>;
  header?: string;
}): ColumnDef<TData> {
  const { key, header } = opts;
  return {
    header: function Header(ctx: HeaderContext<TData, unknown>) {
      return renderHeader(header ?? prettyString(String(key)));
    },
    accessorKey: key as string,
    cell: function Cell({ row }: { row: { original: TData } }) {
      const value = (row.original as any)[key];
      if (value === null || value === undefined || value === "") {
        return (
          <span className="text-secondary"></span>
        ) as unknown as React.ReactNode;
      }
      const rowObj = row.original as any;
      const currencyCode =
        (rowObj?.currency as string) ||
        (rowObj?.currency_code as string) ||
        (rowObj?.currencyCode as string) ||
        "EUR";

      let formatted = "";
      try {
        formatted = new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: currencyCode,
        }).format(Number(value));
      } catch {
        formatted = String(value);
      }

      return (
        <span className="whitespace-nowrap text-sm text-primary">
          {formatted}
        </span>
      ) as unknown as React.ReactNode;
    },
    enableSorting: true,
    sortingFn: (rowA: Row<TData>, rowB: Row<TData>, columnId: string) => {
      const a = Number(rowA.getValue(columnId) ?? 0);
      const b = Number(rowB.getValue(columnId) ?? 0);
      return a - b;
    },
  } as unknown as ColumnDef<TData>;
}

function buildLinkColumn<TData>(opts: {
  key: Extract<keyof TData, string | number>;
  header?: string;
  label: React.ReactNode;
  href: string;
}): ColumnDef<TData> {
  const { key, header, label, href } = opts;
  return {
    header: function Header(ctx: HeaderContext<TData, unknown>) {
      return renderHeader(header ?? prettyString(String(key)));
    },
    accessorKey: key as string,
    size: 200,
    cell: function Cell({ row }: { row: { original: TData } }) {
      const linkHref = href;
      const linkLabel = label;
      return linkHref ? (
        <div className="truncate">
          <Button
            asChild
            variant="link"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <a href={linkHref}>{linkLabel}</a>
          </Button>
        </div>
      ) : (
        <span>{linkLabel}</span>
      );
    },
  } as unknown as ColumnDef<TData>;
}

function buildMaskedLinkColumn<TData>(opts: {
  key: Extract<keyof TData, string | number>;
  header?: string;
  href: string;
  cellValueMaskLabel: string;
}): ColumnDef<TData> {
  const { key, header, href, cellValueMaskLabel } = opts;
  return {
    header: function Header(ctx: HeaderContext<TData, unknown>) {
      return renderHeader(header ?? prettyString(String(key)));
    },
    accessorKey: key as string,
    size: 200,
    cell: function Cell({ row }: { row: { original: TData } }) {
      const rowData = row.original as any;

      // Resolve href template
      const resolvedHref = href.replace(/\{\{(.*?)\}\}/g, (_, p1) => {
        const keyPath = String(p1 || "").trim();
        const v = keyPath.includes(".")
          ? keyPath
              .split(".")
              .reduce((obj: any, k: string) => obj?.[k], rowData)
          : rowData[keyPath];
        return encodeURIComponent(String(v ?? ""));
      });

      const resolvedLabel = cellValueMaskLabel.replace(
        /\{\{(.*?)\}\}/g,
        (_, p1) => {
          const keyPath = String(p1 || "").trim();
          const v = keyPath.includes(".")
            ? keyPath
                .split(".")
                .reduce((obj: any, k: string) => obj?.[k], rowData)
            : rowData[keyPath];
          return String(v ?? "");
        },
      );

      return resolvedHref ? (
        <div className="truncate">
          <a
            href={resolvedHref}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            className="text-primary hover:underline"
          >
            {resolvedLabel}
          </a>
        </div>
      ) : (
        <span>{resolvedLabel}</span>
      );
    },
  } as unknown as ColumnDef<TData>;
}

export const globalColumnRegistry: ColumnRegistry<any> = {
  assignees: {
    build: function buildAssigneesColumn<TData>(opts: {
      key: Extract<keyof TData, string | number>;
      header?: string;
    }): ColumnDef<TData> {
      const { key, header } = opts;
      return {
        header: () => renderHeader(header ?? prettyString(String(key))),
        accessorKey: key as string,
        cell: ({ row }: { row: { original: TData } }) => {
          const value = (row.original as any)[key];
          const list = Array.isArray(value) ? value : [];
          return <AssigneesCell assignees={list as any[]} />;
        },
        enableSorting: false,
        size: 160,
        meta: {
          datatype: "json",
          filterable: false,
        } as any,
      } as unknown as ColumnDef<TData>;
    },
    order: 1,
    filterable: false,
    datatype: "json",
  },
  status: {
    build: buildStatusColumn,
    order: 2,
    filterable: true,
    datatype: "string",
  },
  month: {
    build: buildMonthColumn,
    datatype: "string",
    filterable: true,
  },
  view_status: {
    build: buildStatusColumn,
    order: 2,
    filterable: true,
    datatype: "string",
  },
  closed: {
    build: buildStatusColumn,
    order: 2,
    filterable: true,
    datatype: "string",
  },
  booking_status: {
    build: buildStatusColumn,
    order: 2,
    filterable: true,
    datatype: "string",
  },
  transaction_status: {
    build: buildStatusColumn,
    order: 3,
    filterable: true,
    datatype: "string",
  },
  name: {
    build: buildBreakAllTextColumn,
    order: 1,
    filterable: true,
    datatype: "string",
  },
  invoice_description: {
    build: buildBreakAllTextColumn,
    order: 1,
    filterable: true,
    datatype: "string",
  },
  display_name: {
    build: buildBreakAllTextColumn,
    order: 1,
    filterable: true,
    datatype: "string",
  },
  invoice_total: {
    build: buildCurrencyColumn,
    order: 1,
    filterable: true,
    datatype: "number",
  },
  balance_current: {
    build: buildCurrencyColumn,
    datatype: "number",
    filterable: true,
  },
  balance_available: {
    build: buildCurrencyColumn,
    datatype: "number",
  },
  total_excluding_vat: {
    build: buildCurrencyColumn,
    datatype: "number",
    order: 1,
    filterable: true,
  },
  country_code: {
    build: buildCountryCodeColumn,
    datatype: "string",
    filterable: true,
  },
  home_address_country_code: {
    build: buildCountryCodeColumn,
    datatype: "string",
    filterable: true,
  },
  explanatations: {
    build: buildJsonStringColumn,
    datatype: "json",
    filterable: true,
  },
  amount_value: {
    build: buildCurrencyColumn,
    datatype: "number",
    filterable: true,
  },
  _1a_turnover: {
    build: buildCurrencyColumn,
    datatype: "number",
  },
  _1a_vat: {
    build: buildCurrencyColumn,
    datatype: "number",
  },
  _2a_turnover: {
    build: buildCurrencyColumn,
    datatype: "number",
  },
  discount_amount: {
    build: buildCurrencyColumn,
    datatype: "number",
  },
  fulfillment_status: {
    build: buildStatusColumn,
    datatype: "string",
    order: 2,
  },
  financial_status: {
    build: buildStatusColumn,
    datatype: "string",
    order: 3,
  },
  _2a_vat: {
    build: buildCurrencyColumn,
    datatype: "number",
  },
  fulfilled_at: {
    build: buildTimeColumn,
    filterable: true,
    datatype: "date",
  },
  lineitem_compare_at_price: {
    build: buildCurrencyColumn,
  },
  taxes: {
    build: buildCurrencyColumn,
  },
  refunded_amount: {
    build: buildCurrencyColumn,
  },
  risk_level: {
    build: buildStatusColumn,
  },
  shipping_country: {
    build: buildCountryCodeColumn,
  },
  shipping: {
    build: buildCurrencyColumn,
  },
  outstanding_balance: {
    build: buildCurrencyColumn,
  },
  lineitem_price: {
    build: buildCurrencyColumn,
  },
  lineitem_requires_shipping: {
    build: buildStatusColumn,
  },
  lineitem_taxable: {
    build: buildStatusColumn,
  },
  lineitem_discount: {
    build: buildCurrencyColumn,
  },
  lineitem_fulfillment_status: {
    build: buildStatusColumn,
  },
  _1b_turnover: { build: buildCurrencyColumn, datatype: "number" },
  _1b_vat: { build: buildCurrencyColumn, datatype: "number" },
  _1c_turnover: { build: buildCurrencyColumn, datatype: "number" },
  _1c_vat: { build: buildCurrencyColumn, datatype: "number" },
  _1d_turnover: { build: buildCurrencyColumn, datatype: "number" },
  _1d_vat: { build: buildCurrencyColumn, datatype: "number" },
  _1e_turnover: { build: buildCurrencyColumn, datatype: "number" },
  _3a_turnover: {
    build: buildCurrencyColumn,
    datatype: "number",
  },
  _3b_turnover: {
    build: buildCurrencyColumn,
    datatype: "number",
  },
  _3c_turnover: {
    build: buildCurrencyColumn,
    datatype: "number",
  },
  _4a_turnover: {
    build: buildCurrencyColumn,
    datatype: "number",
  },
  _4a_vat: {
    build: buildCurrencyColumn,
    datatype: "number",
  },
  _4b_turnover: {
    build: buildCurrencyColumn,
    datatype: "number",
  },
  _4b_vat: {
    build: buildCurrencyColumn,
    datatype: "number",
  },
  _5a_vat: {
    build: buildCurrencyColumn,
    datatype: "number",
  },
  _5b_vat: {
    build: buildCurrencyColumn,
    datatype: "number",
  },
  _5g_vat: {
    build: buildCurrencyColumn,
    datatype: "number",
  },
  invoice_total_incl_vat: {
    build: buildCurrencyColumn,
    order: 2,
    filterable: true,
    datatype: "number",
  },
  total_including_vat: { build: buildCurrencyColumn, datatype: "number" },
  total: {
    build: buildCurrencyColumn,
    order: 1,
    filterable: true,
    datatype: "number",
  },
  amount: {
    build: buildCurrencyColumn,
    order: 1,
    filterable: true,
    datatype: "number",
  },
  credited: {
    build: buildCurrencyColumn,
    order: 1,
    filterable: true,
    datatype: "number",
  },
  balance: {
    build: buildCurrencyColumn,

    filterable: true,
    datatype: "number",
  },
  money_out: {
    build: buildCurrencyColumn,
    filterable: true,
    datatype: "number",
  },
  subtotal: {
    build: buildCurrencyColumn,
    filterable: true,
    datatype: "number",
  },
  tax_amount: {
    build: buildCurrencyColumn,
    filterable: true,
    datatype: "number",
  },
  amount_due: {
    build: buildCurrencyColumn,
    filterable: true,
    datatype: "number",
  },
  price: {
    build: buildCurrencyColumn,
    filterable: true,
    datatype: "number",
  },
  total_paid: {
    build: buildCurrencyColumn,
    filterable: true,
    datatype: "number",
  },
  money_in: {
    build: buildCurrencyColumn,

    filterable: true,
    datatype: "number",
  },
  closing_balance: {
    build: buildCurrencyColumn,

    filterable: true,
    datatype: "number",
  },
  debited: {
    build: buildCurrencyColumn,
    order: 1,
    filterable: true,
    datatype: "number",
  },
  fee: {
    build: buildCurrencyColumn,
    order: 1,
    filterable: true,
    datatype: "number",
  },
  currency: {
    build: buildUppercaseColumn,
    filterable: true,
    datatype: "string",
  },
  primary_iban: {
    build: buildUppercaseColumn,
    filterable: true,
    datatype: "string",
  },
  reference_type: {
    build: buildUppercaseColumn,
    filterable: true,
    datatype: "string",
  },
  auth_expires_at: {
    build: buildTimeColumn,
    filterable: true,
    datatype: "date",
  },
  closed_at: {
    build: buildTimeColumn,
    filterable: true,
    datatype: "date",
  },
  last_synced_at: {
    build: buildTimeColumn,
    filterable: true,
    datatype: "date",
  },
  uploaded_at: {
    build: buildTimeColumn,
    filterable: true,
    datatype: "date",
  },
  updated_at: {
    build: buildTimeColumn,
    filterable: true,
    datatype: "date",
  },
  invoice_date: { build: buildTimeColumn, filterable: true, datatype: "date" },
  invoice_due_date: {
    build: buildTimeColumn,
    filterable: true,
    datatype: "date",
  },
  last_reminded_at: {
    build: buildTimeColumn,
    filterable: true,
    datatype: "date",
  },
  accounting_start_date: {
    build: buildTimeColumn,
    filterable: true,
    datatype: "date",
  },
  time: {
    build: buildTimeColumn,
    filterable: true,
    datatype: "date",
  },
  created_at: {
    build: buildTimeColumn,
  },
  issue_date: {
    build: buildTimeColumn,
    filterable: true,
    datatype: "date",
  },
  paid_at: {
    build: buildTimeColumn,
    filterable: true,
    datatype: "date",
  },
  added_at: {
    build: buildTimeColumn,
    filterable: true,
    datatype: "date",
  },
  billing_country: {
    build: buildCountryCodeColumn,
  },
  started_date: {
    build: buildTimeColumn,
    filterable: true,
    datatype: "date",
  },
  contract_start_date: {
    build: buildTimeColumn,
    filterable: true,
    datatype: "date",
  },
  completed_date: {
    build: buildTimeColumn,
    filterable: true,
    datatype: "date",
  },
  due_date: {
    build: buildDayColumn,
    filterable: true,
    datatype: "date",
  },
  test_mode: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  awaiting_deletion: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  accepts_marketing: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  dpa_signed: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  consent_marketing_communications: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  onboarding_approved: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  is_oss: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  is_ioss: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  is_article23: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  is_pep_sanction: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  has_identity_card: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  has_ultimate_beneficial_owner_statement: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  has_business_registry_extract: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  has_power_of_attorney: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  has_source_of_wealth: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  has_store_status: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  has_source_of_funds: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  aurora_errored: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  aurora_processed: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  aurora_should_process: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  verified: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  is_loan: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  is_ar: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  is_ap: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  is_revenue: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  owns_more_than_25_percent: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  is_member_of_governing_board: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  is_expense: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  is_vat_payable: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  is_vat_receivable: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  authorize_for_automatic_acting: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  is_active: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  is_duplicate_hash: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  normalized: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  booked: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  has_given_authorization_for_auto_charging: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  is_postable: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  http: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  duration_ms: {
    build: buildDurationMsColumn,
    filterable: true,
    datatype: "number",
  },
  expires_in: {
    build: buildSecondsColumn,
    filterable: true,
    datatype: "number",
  },
  event_id: {
    build: buildBreakAllTextColumn,
    filterable: true,
    datatype: "string",
  },
  stargate_ponto_token_id: {
    build: buildBreakAllTextColumn,
    filterable: true,
    datatype: "string",
  },
  ponto_account_id: {
    build: buildBreakAllTextColumn,
    filterable: true,
    datatype: "string",
  },
  ponto_consent_id: {
    build: buildBreakAllTextColumn,
    filterable: true,
    datatype: "string",
  },
  invoice_nr: {
    build: buildUppercaseColumn,
    filterable: true,
    datatype: "string",
  },
  customer: {
    build: buildGenericColumn,
    filterable: true,
    datatype: "string",
    order: 3,
  },
  self_booking: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  accountant_is_partner_backoffice: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  is_overdue: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  subject_to_vat: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  allow_self_accounting: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  signed_gdpr_document: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  subject_to_reverse_vat_charge: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  closing_enabled: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  enable_search: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  reconciled: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  legal_form: {
    build: buildUppercaseColumn,
    filterable: true,
    datatype: "string",
  },
  country: {
    build: buildCountryCodeColumn,
    filterable: true,
    datatype: "string",
  },
  creditor_address_country_code: {
    build: buildCountryCodeColumn,
    filterable: true,
    datatype: "string",
  },
  transaction_id: {
    build: buildBreakAllTextColumn,
    filterable: true,
    datatype: "string",
  },
  reconciliation_id: {
    build: buildBreakAllTextColumn,
    filterable: true,
    datatype: "string",
  },

  document_id: {
    build: buildBreakAllTextColumn,
    filterable: true,
    datatype: "string",
  },
  booking_id: {
    build: buildBreakAllTextColumn,
    filterable: true,
    datatype: "string",
  },
  settings: {
    build: buildJsonStringColumn,
  },
  sandbox: {
    build: buildBooleanYesNoColumn,
    order: 2,
    datatype: "boolean",
    filterable: true,
  },
  reverse_charged: {
    build: buildBooleanYesNoColumn,
    datatype: "boolean",
    filterable: true,
  },
  stake_percentage: {
    build: buildPercentageColumn,
    datatype: "number",
    filterable: true,
  },
  active: {
    build: buildBooleanYesNoColumn,
    order: 1,
    datatype: "boolean",
    filterable: true,
  },
  pushed_at: {
    build: buildTimeColumn,
    datatype: "date",
    filterable: true,
  },
  head_commit_timestamp: {
    build: buildTimeColumn,
    datatype: "date",
    filterable: true,
  },
  enabled: {
    build: buildBooleanYesNoColumn,
    datatype: "boolean",
    filterable: true,
  },
  signed_date: {
    build: buildTimeColumn,
    datatype: "date",
    filterable: true,
  },
  amount_paid: {
    build: buildCurrencyColumn,
    datatype: "number",
    filterable: true,
  },
  amount_remaining: {
    build: buildCurrencyColumn,
    datatype: "number",
    filterable: true,
  },
  paid: {
    build: buildTimeColumn,
    datatype: "date",
    filterable: true,
  },
};

// Default editor configuration suggestions by column key.
// Consumers can use this to pre-fill editor types/options for common fields.
export const defaultEditorByColumn: Record<
  string,
  {
    type: "text" | "number" | "boolean" | "select";
    options?: Array<{ value: string | number | boolean; label: string }>;
  }
> = {
  status: { type: "select" },
  closed: { type: "select" },
  booking_status: { type: "select" },
  transaction_status: { type: "select" },
  currency: { type: "select" },
  country: { type: "select" },
  country_code: { type: "select" },
  reverse_charged: { type: "boolean" },
  closing_enabled: { type: "boolean" },
  verified: { type: "boolean" },
  normalized: { type: "boolean" },
  booked: { type: "boolean" },
};

export type LeanColumnSpec<TData> =
  | keyof TData
  | {
      key: Extract<keyof TData, string | number>;
      header?: string;
      use?: string;
      order?: number;
      label?: string; // template like "{{recipient_company}}"
      href?: string; // template for href like "/customers/{{customer}}"
      cell_value_mask_label?: string; // template for display value when href is present
      formatter?: (value: any, row: TData) => any;

      minWidth?: number;
      maxWidth?: number;
      widthFit?: boolean;

      // optional column-level attributes
      // when true, prevent text selection in header and cells
      enableNoSelect?: boolean;
      // when true, prevent wrapping in header and cells
      enableNoWrap?: boolean;

      // fetch-and-render via a hook for view data (e.g., related entity)
      // provide a hook and a renderer; the hook will be called inside a small React component cell
      viewHook?: (row: TData) => any; // custom hook returning { data, isLoading, error, ... }
      viewRender?: (viewResult: any, row: TData) => React.ReactNode;

      // editor configuration for drilldown edit forms
      editor?: {
        type?: "text" | "number" | "boolean" | "select";
        options?: Array<{ value: string | number | boolean; label: string }>;
      };
    };

export function buildColumnsFromRegistry<TData>(
  specs: Array<LeanColumnSpec<TData>>,
): ColumnDef<TData>[] {
  const built = specs.map((spec) => {
    const key = (typeof spec === "object" ? spec.key : spec) as keyof TData;
    const header = typeof spec === "object" ? spec.header : undefined;
    const useName = typeof spec === "object" ? spec.use : undefined;
    const specOrder = typeof spec === "object" ? spec.order : undefined;
    const minWidth = typeof spec === "object" ? spec.minWidth : undefined;
    const maxWidth =
      typeof spec === "object" ? (spec as any).maxWidth : undefined;
    const widthFit = typeof spec === "object" ? spec.widthFit : undefined;
    const enableNoSelect =
      typeof spec === "object" ? (spec as any).enableNoSelect : undefined;
    const enableNoWrap =
      typeof spec === "object" ? (spec as any).enableNoWrap : undefined;
    const labelTemplate = typeof spec === "object" ? spec.label : undefined;
    const href = typeof spec === "object" ? spec.href : undefined;
    const cellValueMaskLabel =
      typeof spec === "object" ? spec.cell_value_mask_label : undefined;
    const formatter = typeof spec === "object" ? spec.formatter : undefined;
    const viewHook =
      typeof spec === "object" ? (spec as any).viewHook : undefined;
    const viewRender =
      typeof spec === "object" ? (spec as any).viewRender : undefined;
    const editorCfg =
      typeof spec === "object" ? (spec as any).editor : undefined;

    const registryKeyRaw = (useName ?? String(key)).toLowerCase();
    // Support registry keys that cannot start with a number by allowing
    // fallback between "1a_turnover" <-> "_1a_turnover"
    let renderer = (globalColumnRegistry as ColumnRegistry<TData>)[
      registryKeyRaw
    ];
    if (!renderer) {
      // If key starts with a number, try with a leading underscore
      if (/^\d/.test(registryKeyRaw)) {
        renderer = (globalColumnRegistry as ColumnRegistry<TData>)[
          `_${registryKeyRaw}`
        ];
      }
    }
    if (!renderer) {
      // If key starts with "_" followed by a number, try without the underscore
      if (
        registryKeyRaw.startsWith("_") &&
        /^\d/.test(registryKeyRaw.slice(1))
      ) {
        renderer = (globalColumnRegistry as ColumnRegistry<TData>)[
          registryKeyRaw.slice(1)
        ];
      }
    }

    const typedKey = key as Extract<keyof TData, string | number>;

    // Check if we should use the masked link column renderer
    const shouldUseMaskedLink = href && cellValueMaskLabel;

    const colDef = (
      shouldUseMaskedLink
        ? buildMaskedLinkColumn<TData>({
            key: typedKey,
            header,
            href,
            cellValueMaskLabel,
          })
        : renderer
          ? renderer.build({ key: typedKey, header })
          : buildGenericColumn<TData>({ key: typedKey, header })
    ) as ColumnDef<TData> & {
      size?: number;
      minSize?: number;
      maxSize?: number;
      meta?: { className?: string } & {
        widthFit?: boolean;
        maxWidth?: number;
        labelTemplate?: string;
        headerText?: string;
      };
    };

    // Establish a plain header text for reuse in other UIs (view settings, drilldown)
    let computedHeaderText =
      (typeof header === "string" && header) || prettyString(String(key));

    if (typeof minWidth === "number") {
      colDef.minSize = minWidth;
      colDef.size = colDef.size ?? minWidth;
    }
    if (typeof maxWidth === "number") {
      colDef.maxSize = maxWidth;
      colDef.meta = { ...(colDef.meta as any), maxWidth } as any;
    }
    if (widthFit) {
      colDef.meta = { ...(colDef.meta as any), widthFit: true } as any;
    }
    // Apply optional no-select / no-wrap classes via meta.className
    if (enableNoSelect || enableNoWrap) {
      const existingClass = (colDef.meta as any)?.className as
        | string
        | undefined;
      const parts: string[] = [];
      if (existingClass) parts.push(existingClass);
      if (enableNoSelect) parts.push("select-none");
      if (enableNoWrap) parts.push("whitespace-nowrap");
      colDef.meta = {
        ...(colDef.meta as any),
        className: parts.join(" "),
      } as any;
    }
    if (labelTemplate) {
      // use label as header text when provided
      const headerText = String(labelTemplate);
      colDef.header = () => renderHeader(headerText);
      computedHeaderText = headerText;
    }

    // Apply masked label template even without href
    if (cellValueMaskLabel && !href) {
      const template = String(cellValueMaskLabel);
      const OriginalCell = colDef.cell as any;
      colDef.cell = (({ row }: { row: { original: TData } }) => {
        const rowData = row.original as any;
        const resolvedLabel = template.replace(/\{\{(.*?)\}\}/g, (_, p1) => {
          const keyPath = String(p1 || "").trim();
          const v = keyPath.includes(".")
            ? keyPath
                .split(".")
                .reduce((obj: any, k: string) => obj?.[k], rowData)
            : rowData[keyPath];
          return String(v ?? "");
        });
        return (
          <span className="truncate text-primary">{resolvedLabel}</span>
        ) as unknown as React.ReactNode;
      }) as any;
    }

    // Persist the resolved header text in meta for external consumers
    colDef.meta = {
      ...(colDef.meta as any),
      headerText: computedHeaderText,
      cellValueMaskLabel: cellValueMaskLabel,
      // propagate registry metadata for external consumers (filters, etc.)
      filterable: Boolean(renderer?.filterable),
      datatype: (renderer?.datatype ?? undefined) as any,
      editor: editorCfg,
    } as any;

    if (formatter) {
      const originalCell = colDef.cell;
      colDef.cell = (({ row }: { row: { original: TData } }) => {
        const rowObj = row.original as any;
        const value = rowObj[key as any];
        const formatted = formatter(value, rowObj);

        if (formatted === null || formatted === undefined) {
          return originalCell
            ? (originalCell as any)({ row })
            : (defaultTextCell<TData>(key) as any)({ row });
        }
        return formatted as unknown as React.ReactNode;
      }) as any;
    }

    if (typeof viewHook === "function") {
      const OriginalCell = colDef.cell as any;
      const HookCell: React.FC<{ row: { original: TData } }> = ({ row }) => {
        // call user-provided hook
        const result = (viewHook as any)(row.original);
        if (typeof viewRender === "function") {
          return viewRender(result, row.original) as any;
        }
        return OriginalCell ? (
          <>{OriginalCell({ row })}</>
        ) : (
          <>{String((row.original as any)[key as any] ?? "")}</>
        );
      };
      colDef.cell = ((ctx: any) => <HookCell {...ctx} />) as any;
    }

    const order =
      specOrder !== undefined
        ? specOrder
        : renderer && typeof renderer.order === "number"
          ? renderer.order
          : Number.POSITIVE_INFINITY;

    return { def: colDef as ColumnDef<TData>, order };
  });

  built.sort((a, b) => a.order - b.order);
  return built.map((b) => b.def);
}
