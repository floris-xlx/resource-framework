# useUserScopes

Fetches enabled permission scopes for the current user (via APP_CONFIG.api.suitsbooks).

```ts
import { useUserScopes } from "resource-framework";
const { scopes, hasScope, isLoading } = useUserScopes();
```

- `hasScope("scope")` → boolean
- Uses headers: X-Company-Id, X-Organization-Id, X-User-Id

