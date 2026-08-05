# WhatsApp Architecture

## Modelo de datos

| Tabla | Propósito |
| --- | --- |
| `whatsapp_accounts` | Números de WhatsApp Business por empresa, con alias, departamento, estado, número principal y credenciales de Meta. |
| `whatsapp_templates` | Plantillas con categoría, idioma, header/body/footer, botones, variables, versión y estado de aprobación. |
| `whatsapp_campaigns` | Campañas con métricas de envío, entrega, lectura y costo. |
| `whatsapp_messages` | Mensajes entrantes/salientes con estado, costo y IDs externos. |
| `whatsapp_conversations` | Hilos por contacto con estado, asignación, etiquetas y no leídos. |
| `whatsapp_media` | Adjuntos (imagen, audio, video, documento) asociados a mensajes. |
| `whatsapp_webhooks` | Registro crudo de eventos entrantes de Meta con validación de firma. |

Todas las tablas usan `company_id` y RLS estricta por membresía de empresa.
Los tokens (`access_token`, `refresh_token`, `webhook_secret`,
`webhook_verify_token`) nunca se exponen al cliente.

## Multi-número

Cada empresa puede registrar 1, 2, 5, 10 o ilimitados números. Cada número
tiene alias, departamento (Ventas, Soporte, Cobranza, Marketing, General),
estado y bandera de principal. Cambiar el principal es una operación atómica
en servidor.

## Estados

`disconnected` → `pending` → `connected` | `error` | `suspended`

## Límites actuales

No se realizan llamadas a Meta Cloud API, no hay OAuth, Embedded Signup ni
webhooks activos. La UI muestra "Disponible en la siguiente actualización."
