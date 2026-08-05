# Email Architecture

## Estado

Arquitectura preparada; proveedor no conectado.

## Contrato

`EmailProvider` (`src/providers/communication/email.provider.ts`) implementa
`CommunicationProvider` y rechaza cualquier envío con
`ChannelNotConnectedError` mientras `ready = false`.

## Superficies previstas

- Dashboard de métricas (enviados, entregados, aperturas, fallidos).
- Campañas de email con asunto, plantilla y segmento.
- Plantillas HTML con variables y vista previa.
- Listas y segmentos derivados del CRM.
- Automatizaciones (bienvenida, carrito, reactivación).
- Configuración SMTP: host, puerto, remitente, nombre y prueba de conexión.
- Analytics: aperturas, clics, rebotes y bajas.

## Integración futura

Al conectar el proveedor sólo cambia `EmailProvider`; ni la UI ni los hooks,
repositories o services se modifican.
