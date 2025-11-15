import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { defineColumns } from "../constructors/define-columns";

export function useResourceColumns<TData = Record<string, unknown>>(
  route: any | null,
) {
  return React.useMemo<ColumnDef<TData>[]>(() => {
    const specs = (route?.columns ?? []) as any[];
    try {
      return defineColumns(specs) as unknown as ColumnDef<TData>[];
    } catch {
      return [];
    }
  }, [route]);
}


