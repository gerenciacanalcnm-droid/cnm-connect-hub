# Meta Integration Roadmap

## Principio

El cliente nunca copia credenciales manualmente. Meta Embedded Signup
completará automáticamente Business Account ID, Phone Number ID, nombre
verificado, tokens y datos del webhook.

## Fases

### Fase 1 — Meta Ready (completada)

- Tablas `whatsapp_*` con columnas para todas las credenciales de Meta.
- RLS por empresa y tokens no expuestos al cliente.
- UI de canales con estado, proveedor, número, Business Manager, Phone Number
  ID, webhook y última sincronización.
- Botones Conectar / Editar / Probar conexión / Desconectar deshabilitados.
- `WhatsAppProvider` con contrato completo y `ready = false`.

### Fase 2 — OAuth y Embedded Signup

- App de Meta y Facebook Login for Business.
- Server route pública para el callback OAuth.
- Intercambio de código por token de larga duración y persistencia cifrada.
- Sincronización de WABA, números y nombres verificados.

### Fase 3 — Webhooks

- Server route `/api/public/webhooks/whatsapp` con verificación de firma
  (`X-Hub-Signature-256`) y `hub.verify_token`.
- Persistencia en `whatsapp_webhooks` y proyección a conversaciones/mensajes.

### Fase 4 — Envío real

- Activar `send`, `sendBulk`, `schedule` en `WhatsAppProvider` contra Cloud API.
- Sincronización de plantillas y estados de aprobación.
- Registro de costo por mensaje y conciliación con facturación.

## Garantía de arquitectura

Ninguna de las fases requiere cambios en la interfaz ni en las capas
Hook → Repository → Service.
