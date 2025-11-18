import * as React from "react";
import { LeanTable } from "@/components/ui-responsive/lean-table";

export type ResourceAdapterProps = {
  columns: any[];
  data: any[];
  title?: string;
  onRowClick?: (row: any) => void;
  addItemLabel?: string;
  onAddItem?: (() => void) | undefined;
  displayContext?: string;
  displayConfig?: any[];
};

export type UIAdapter = React.ComponentType<ResourceAdapterProps>;

const TableAdapter: UIAdapter = (props) => {
  const {
    columns,
    data,
    title,
    onRowClick,
    addItemLabel,
    onAddItem,
    displayContext,
    displayConfig,
  } = props;
  return (
    <LeanTable
      columns={columns as any}
      data={data as any}
      title={title}
      href={onRowClick ? (row: any) => (onRowClick(row), "") : undefined}
      addItemLabel={addItemLabel}
      onAddItem={onAddItem}
      displayContext={displayContext}
      displayConfig={displayConfig}
      disableFullscreenView={true}
    />
  );
};

const ListboxAdapter: UIAdapter = (props) => {
  const { data, title } = props;
  return (
    <div className="space-y-3">
      {title ? <h3 className="text-base font-medium">{title}</h3> : null}
      <ul className="grid grid-cols-1 gap-2">
        {(Array.isArray(data) ? data : []).map((row, idx) => (
          <li key={idx} className="rounded-md border p-3 text-sm">
            {JSON.stringify(row)}
          </li>
        ))}
      </ul>
    </div>
  );
};

export const UI_ADAPTERS: Record<string, UIAdapter> = {
  table: TableAdapter,
  listbox: ListboxAdapter,
};


