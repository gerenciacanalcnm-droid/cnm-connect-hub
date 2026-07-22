# src/api

Reservado para endpoints declarativos / definiciones de contrato con el
backend (paths, DTOs, tipos de request). El cliente HTTP vive en
`src/lib/api/client.ts`.

Estructura futura:

```
src/api/
  landing.api.ts      # rutas y DTOs del panel del Super Administrador
  auth.api.ts         # login, refresh, OAuth
  sms.api.ts          # envío, listado, estados
  campaign.api.ts
  billing.api.ts
```

Cada archivo expone funciones puras que reciben el `apiClient` y retornan
tipos ya parseados con Zod. Los Services consumen estas funciones, los
Repositories consumen Services y los Hooks consumen Repositories.
