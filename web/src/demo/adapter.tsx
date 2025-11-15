import * as React from "react";

// Minimal demo adapter mapping to native elements
export function DemoProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export const UI = {
  Button: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props} className="kbd" />
  ),
  Badge: ({ children }: { children?: React.ReactNode }) => (
    <span className="kbd">{children}</span>
  ),
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} className="kbd" />
  ),
  Flag: ({ country, size = 16 }: { country: string; size?: number }) => (
    <span style={{ fontSize: size }}>{country}</span>
  )
};

export const APP = {
  router: { push: (href: string) => (window.location.href = href), back: () => history.back() },
  stores: {},
  APP_CONFIG: { api: { xylex: import.meta.env.VITE_API_XYLEX || "" } },
  useNotification: () => ({ notify: (m: any) => alert(m?.message ?? String(m)) })
};


