import * as React from "react";
import { UI, APP } from "../demo/adapter";

export function Home() {
  return (
    <div>
      <h1>Resource Framework Demo</h1>
      <p className="muted">
        A presentation of concepts, adapter approach, and example usage.
      </p>

      <div className="card">
        <h2>What is it?</h2>
        <p>
          A headless, adapter-driven way to build resource lists, drilldowns, and schema-driven forms.
          You bring your own UI components and routing; the framework provides conventions for columns,
          filters, and editable fields.
        </p>
      </div>

      <div className="grid">
        <div className="card">
          <h3>Adapter</h3>
          <p>Your app provides a small set of UI primitives and config.</p>
          <div className="code">
{`const UI = {
  Button, Badge, Input, Flag, // your components
}
const APP = {
  router: { push, back },
  stores: { useUserStore },
  APP_CONFIG: { api: { xylex: import.meta.env.VITE_API_XYLEX } }
}`}
          </div>
        </div>

        <div className="card">
          <h3>Columns</h3>
          <p>Define fields declaratively; renderers handle currency, status, dates, and more.</p>
          <div className="code">
{`import { defineColumns } from "resource-framework";

const columns = defineColumns([
  { column_name: "status", field_type: "select" },
  { column_name: "invoice_total_incl_vat", use: "invoice_total" },
  {
    column_name: "customer",
    label: "Customer {{customer.name}}",
    href: "/v2/customers/{{customer.id}}"
  }
]);`}
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Demo UI (adapter primitives)</h3>
        <p>This page uses a minimal demo adapter:</p>
        <ul>
          <li>UI.Button → native button</li>
          <li>UI.Badge → styled span</li>
          <li>UI.Input → native input</li>
          <li>UI.Flag → simple country code badge</li>
        </ul>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <UI.Button onClick={() => alert("clicked")}>Button</UI.Button>
          <UI.Badge>Badge</UI.Badge>
          <UI.Input placeholder="Input" />
          <UI.Flag country="NL" size={18} />
        </div>
      </div>

      <div className="card">
        <h3>Docs</h3>
        <p>
          See the <a href="../docs/index.md">docs</a> for Concepts, Reference, and Cookbook recipes.
        </p>
      </div>
    </div>
  );
}


