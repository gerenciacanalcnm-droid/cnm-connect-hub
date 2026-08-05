# SMS Architecture

## Estado

Canal operativo sobre Supabase: envío individual, masivo, programado,
historial, plantillas, grupos e importación CSV.

## Tablas

- `sms_messages`: mensajes con estado, segmentos, codificación, costo y errores.
- `sms_providers`: proveedores por empresa con prioridad y configuración.
- `campaigns` / `campaign_recipients`: campañas y destinatarios con métricas.
- `templates`: plantillas SMS con variables.

## Segmentación y costo

La detección GSM-7 / UCS-2 y el conteo de segmentos se realizan en
`src/lib/sms-utils.ts` y se reflejan en el composer antes del envío.

## Proveedor

`SMSProvider` implementa el contrato `CommunicationProvider`. Los proveedores
con whitelist por IP requieren un proxy con IP estática o el servidor NestJS
futuro, ya que las Server Functions no exponen IP de salida fija.
