# Adapters Setup

Wrap your app and inject UI/App bindings:

```tsx
import { ResourceFrameworkProvider } from "resource-framework/adapters";

<ResourceFrameworkProvider
  ui={{ Button, Badge, Input }}
  app={{
    router: { push, back },
    stores: { useUserStore },
    APP_CONFIG
  }}
>
  <App />
</ResourceFrameworkProvider>
```

Access in code:
```ts
import { useUI, useApp } from "resource-framework/adapters";
const { Button } = useUI();
const { router } = useApp();
```

