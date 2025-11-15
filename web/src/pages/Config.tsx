import * as React from "react";

export function Config() {
  return (
    <div>
      <h1>Configuration & Environment</h1>
      <p className="muted">
        These values are read by the adapter and convenience utilities.
      </p>

      <div className="card">
        <h2>Environment variables (Vite)</h2>
        <p>
          Define in <span className="kbd">.env</span> (or OS env) at the project root:
        </p>
        <div className="code">
{`# Base API URL for XYLEX services
VITE_API_XYLEX=https://api.example.com

# Optional telemetry flags (example)
VITE_XBP_TELEMETRY=1`}
        </div>
        <p>
          Access in code via <span className="kbd">import.meta.env.VITE_API_XYLEX</span>.
        </p>
      </div>

      <div className="card">
        <h2>APP_CONFIG contract</h2>
        <p>
          The adapter's <span className="kbd">APP_CONFIG</span> should provide the same values to the framework:
        </p>
        <div className="code">
{`const APP = {
  APP_CONFIG: {
    api: {
      xylex: import.meta.env.VITE_API_XYLEX || ""
    },
    telemetry: {
      xbp_telemetry: import.meta.env.VITE_XBP_TELEMETRY ?? ""
    }
  }
};`}
        </div>
      </div>

      <div className="card">
        <h2>Headers expected by default endpoints</h2>
        <ul>
          <li><span className="kbd">X-Company-Id</span></li>
          <li><span className="kbd">X-Organization-Id</span></li>
          <li><span className="kbd">X-User-Id</span></li>
        </ul>
        <p>
          These are usually attached by your API client based on the current user session.
        </p>
      </div>

      <div className="card">
        <h2>OpenAPI & Postman</h2>
        <p>
          See <a href="../../docs/api/openapi.yaml">OpenAPI</a> and{" "}
          <a href="../../docs/api/postman.collection.json">Postman collection</a>{" "}
          for the default endpoints used by the framework:
        </p>
        <ul>
          <li><span className="kbd">POST /fetch/data</span></li>
          <li><span className="kbd">PUT /data/insert</span></li>
        </ul>
      </div>
    </div>
  );
}

