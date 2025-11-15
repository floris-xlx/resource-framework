import * as React from "react";
import type { AdapterContextValue, UI, App } from "./types";

const AdapterContext = React.createContext<AdapterContextValue | null>(null);

let lastContext: AdapterContextValue | null = null;

export function ResourceFrameworkProvider(props: {
  ui: UI;
  app: App;
  children: React.ReactNode;
}) {
  const value = React.useMemo<AdapterContextValue>(
    () => ({ ui: props.ui, app: props.app }),
    [props.ui, props.app],
  );
  React.useEffect(() => {
    lastContext = value;
    return () => {
      lastContext = null;
    };
  }, [value]);
  return (
    <AdapterContext.Provider value={value}>
      {props.children}
    </AdapterContext.Provider>
  );
}

export function useUI(): UI {
  const ctx = React.useContext(AdapterContext);
  if (!ctx) throw new Error("useUI must be used within ResourceFrameworkProvider");
  return ctx.ui;
}

export function useApp(): App {
  const ctx = React.useContext(AdapterContext);
  if (!ctx) throw new Error("useApp must be used within ResourceFrameworkProvider");
  return ctx.app;
}

// Static accessors for non-React modules
export function getUIStatic(): UI {
  if (!lastContext) throw new Error("ResourceFrameworkProvider not mounted");
  return lastContext.ui;
}

export function getAppStatic(): App {
  if (!lastContext) throw new Error("ResourceFrameworkProvider not mounted");
  return lastContext.app;
}


