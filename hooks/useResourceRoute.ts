import React, { useState, useEffect } from "react";
import {
  getResourceRoute,
  type ResourceRouteEntry,
} from "../registries/resource-routes";

export function useResourceRoute(
  resourceName: string,
): ResourceRouteEntry | null {
  const [route, setRoute] = useState<ResourceRouteEntry | null>(null);
  
  useEffect(() => {
    if (!resourceName) {
      setRoute(null);
      return;
    }
    setRoute(getResourceRoute(resourceName));
  }, [resourceName]);
  return route;
}
