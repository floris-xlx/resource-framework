"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNotification } from "@/components/notifications/base";
import { APP_CONFIG } from "@/config";
import { useUserStore } from "@/lib/stores";
import { prettyString } from "@/utils/format-utils";
import { CreateResourceDialog } from "./create-resource-dialog";
import { useApiClient } from "@/hooks/use-api-client";

type ResourceRouteRow = {
  table?: string;
  page_label?: string;
  enable_new_resource_creation?: boolean;
  new_resource_button_text?: string;
  new_resource_href?: string;
  force_no_cache?: boolean;
  columns?: any;
  new_resource_mandatory_columns?: any;
  new_resource_optional_columns?: any;
};

export function CreateResourceButton(props: {
  resourceName: string;
  label?: string;
  className?: string;
  cacheEnabled?: boolean;
}) {
  const { resourceName, label, className, cacheEnabled = false } = props;
  const { user } = useUserStore();
  const { notification } = useNotification();
  const [route, setRoute] = useState<ResourceRouteRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const {
    data: routeByResource,
    isLoading: loadingByResource,
  } = useApiClient<ResourceRouteRow>({
    table: "resource_routes",
    conditions: [{ eq_column: "resource_name", eq_value: resourceName }],
    single: true,
    enabled: Boolean(resourceName && user?.user_id && user?.company_id && user?.organization_id),
    noCache: !cacheEnabled,
  });
  const {
    data: routeByTable,
    isLoading: loadingByTable,
  } = useApiClient<ResourceRouteRow>({
    table: "resource_routes",
    conditions: [{ eq_column: "table", eq_value: resourceName }],
    single: true,
    enabled: Boolean(
      resourceName &&
        user?.user_id &&
        user?.company_id &&
        user?.organization_id &&
        !routeByResource,
    ),
    noCache: !cacheEnabled,
  });

  useEffect(() => {
    setLoading(Boolean(loadingByResource || loadingByTable));
    const chosen = (routeByResource as any) || (routeByTable as any) || null;
    setRoute(chosen);
  }, [routeByResource, routeByTable, loadingByResource, loadingByTable]);

  const isEnabled = Boolean(route?.enable_new_resource_creation);
  const buttonLabel =
    label ||
    route?.new_resource_button_text ||
    `New ${prettyString(route?.page_label || resourceName)}`;

  if (!loading && (!route || !isEnabled)) {
    return null;
  }

  return (
    <>
      <Button
        variant="brand"
        size="sm"
        onClick={() => {
          if (!isEnabled) {
            notification({
              message: "Creation is disabled for this resource",
              success: false,
            });
            return;
          }
          setOpen(true);
        }}
        className={className}
      >
        {buttonLabel}
      </Button>
      <CreateResourceDialog
        open={open}
        onClose={() => setOpen(false)}
        title={`New ${prettyString(route?.page_label || resourceName)}`}
        required={
          Array.isArray(route?.new_resource_mandatory_columns)
            ? (route?.new_resource_mandatory_columns as string[])
            : typeof route?.new_resource_mandatory_columns === "string"
              ? [String(route?.new_resource_mandatory_columns)]
              : []
        }
        optional={
          Array.isArray(route?.new_resource_optional_columns)
            ? (route?.new_resource_optional_columns as string[])
            : typeof route?.new_resource_optional_columns === "string"
              ? [String(route?.new_resource_optional_columns)]
              : []
        }
        columns={
          Array.isArray(route?.columns) ? (route?.columns as any[]) : undefined
        }
        table={String(route?.table || "")}
        resourceName={resourceName}
        cacheEnabled={cacheEnabled}
        onCreated={() => {
          try {
            window.location.reload();
          } catch {}
        }}
      />
    </>
  );
}
