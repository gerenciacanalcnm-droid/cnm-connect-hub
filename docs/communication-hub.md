# Communication Hub

El Communication Hub es el centro omnicanal de CNM Nova. Unifica SMS, WhatsApp
Business y Email Marketing en una sola experiencia operativa.

## Secciones

| Sección | Descripción | Estado |
| --- | --- | --- |
| Dashboard (Channel Overview) | Métricas por canal: enviados, entregados, leídos, fallidos, costo y tasa de entrega. | Conectado (Supabase) |
| Enviar / Masivo / Programar | Operación SMS. | Conectado |
| Historial | Mensajes SMS enviados. | Conectado |
| Plantillas / Unificadas | Plantillas por canal con variables `{{var}}`, categorías, versionado y vista previa. | Conectado |
| Grupos / Importar | Segmentación y carga CSV procesada en servidor. | Conectado |
| WhatsApp | Multi-número por departamento, estado y número principal. | Conectado (sin Meta) |
| Campañas | Selector de canal SMS / WhatsApp / Email; la UI se adapta al canal. | SMS conectado |
| Conversaciones | Bandeja unificada con filtros por canal y estado, hilo de mensajes y adjuntos. | Lectura conectada |
| Email | Dashboard, campañas, plantillas, listas, automatizaciones, SMTP y analytics. | Preparado |
| Ajustes | Proveedores, horarios, rate limit, timeout, reintentos y firma. | Lectura conectada |

## Arquitectura

```text
Component → Hook → Repository → Service → Server Function → Supabase
```

- Hooks: `src/hooks/use-communication.ts`, `src/hooks/use-whatsapp.ts`
- Repositories: `src/repositories/{communication,whatsapp,conversation}.repository.ts`
- Services: `src/services/{communication,whatsapp,conversation}.service.ts`
- Server Functions: `src/lib/communication.functions.ts`
- Provider layer: `src/providers/communication/`

## Provider Layer

`CommunicationProvider` define el contrato único de canal: `send`, `sendBulk`,
`schedule`, `cancel`, `status`, `analytics`, `history`. Los servicios nunca
conocen al proveedor concreto; consumen el registro en
`src/providers/communication/index.ts`.
