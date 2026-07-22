# src/adapters

Capa de adaptadores entre servicios externos y el dominio interno.
Ejemplos futuros:

- `google-oauth.adapter.ts` — mapea el `id_token` de Google a `AuthTokens`.
- `stripe.adapter.ts` — normaliza eventos de Stripe.
- `whatsapp.adapter.ts` — normaliza payloads del proveedor WhatsApp.
- `sms-provider.adapter.ts` — capa fina que abstrae proveedores SMS
  (Twilio, MessageBird, Infobip) detrás de un contrato único.

Regla: los Adapters no exponen tipos del proveedor hacia arriba, sólo
tipos del dominio (`@/types/*`).
