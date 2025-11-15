import type * as React from "react";

export type UI = {
  // Basic primitives/components used by the framework
  Button: React.ComponentType<any>;
  Badge: React.ComponentType<any>;
  Input: React.ComponentType<any>;
  Select?: {
    Root: React.ComponentType<any>;
    Trigger: React.ComponentType<any>;
    Content: React.ComponentType<any>;
    Item: React.ComponentType<any>;
    Value?: React.ComponentType<any>;
  };
  Switch?: React.ComponentType<any>;
  Container?: React.ComponentType<any>;
  ErrorBlock?: React.ComponentType<any>;
  Loading?: React.ComponentType<any>;
  LeanTable?: React.ComponentType<any>;
  ResponsiveDropdownV2?: React.ComponentType<any>;
  ResponsiveDialog?: React.ComponentType<any>;
  Flag?: React.ComponentType<any>;
  // Utility
  cn?: (...parts: any[]) => string;
};

export type App = {
  useApiClient?: () => { get: (...a: any[]) => any; post: (...a: any[]) => any };
  useNotification?: () => { notify?: (m: any) => void } | ((m: any) => void);
  router?: { push: (href: string) => void; back: () => void };
  stores?: {
    useUserStore?: Function;
    useViewStore?: Function;
    useBackButtonStore?: Function;
    [k: string]: any;
  };
  APP_CONFIG?: Record<string, any>;
};

export type AdapterContextValue = {
  ui: UI;
  app: App;
};


