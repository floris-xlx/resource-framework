# Quickstart

1. Install:
   ```bash
   npm install resource-framework
   ```
2. Provide adapters:
   ```tsx
   import { ResourceFrameworkProvider } from "resource-framework/adapters";
   // ...
   <ResourceFrameworkProvider ui={{ Button, Badge }} app={{ router, stores, APP_CONFIG }}>
     <App />
   </ResourceFrameworkProvider>
   ```
3. Use constructors and hooks:
   ```ts
   import { defineColumns } from "resource-framework";
   ```


