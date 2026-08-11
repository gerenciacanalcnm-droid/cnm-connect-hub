# Plan: WhatsApp Multi-Número e Cuentas de Envío NOVA

Integrar la gestión de múltiples cuentas de WhatsApp Business (WABA) en el Hub de Comunicación, permitiendo seleccionar desde qué número realizar los envíos.

## User Review Required

> [!IMPORTANT]
> Se utilizará la tabla `whatsapp_accounts` existente. Las credenciales sensibles (tokens) permanecen protegidas en el servidor.

- ¿Desea que el selector de cuenta en el envío individual sea obligatorio o que use la cuenta "Principal" por defecto? (Se implementará con la Principal por defecto).

## Proposed Changes

### Backend & Integrations
#### [NEW] Server Functions
- `src/lib/whatsapp-accounts.functions.ts`: Ya creada, se usará para diagnósticos aislados por cuenta.
- Añadir `disconnectWhatsAppAccount` para gestionar la eliminación o desconexión lógica.

#### Repository & Hooks
- `src/repositories/whatsapp.repository.ts`: Mapear nuevas funciones de gestión de cuentas.
- `src/hooks/use-whatsapp.ts`: Añadir hook `useTestSpecificAccount` para el nuevo diagnóstico.

### UI Components
#### Settings Page (`src/components/comunicacion/communication-settings.tsx`)
- Añadir sección "WhatsApp Business" con lista de cuentas conectadas.
- Cada cuenta tendrá: Alias, Número, WABA ID, Estado (Badge) y botón de "Diagnóstico".
- Modal para conectar nuevas cuentas (Alias, Token, Phone ID, WABA ID).

#### Sending UI (`src/components/comunicacion/send-whatsapp-individual.tsx`)
- Reemplazar el Alert de "Conecta una cuenta" por un `Select` de cuenta de envío.
- Vincular el `accountId` seleccionado a todas las mutaciones de envío (`individual`, `bulk`, `template`).
- Actualizar el cálculo de costos y saldo para ser reactivo a la cuenta seleccionada (si aplica por canal).

## Technical Details
- Aislamiento Multi-tenant: Todas las consultas a `whatsapp_accounts` filtran por `company_id` mediante RLS.
- Segurança: Los tokens de Meta nunca llegan al navegador. Se recuperan mediante `supabaseAdmin` solo en el entorno de ejecución del servidor durante el diagnóstico o envío.
- Estado: Las cuentas se marcan como `connected`, `error` o `disconnected` basándose en el resultado del diagnóstico de Meta.

## Verification Plan
### Automated Tests
- `tsgo --noEmit` para validar tipos.
- `bun run build` para asegurar estabilidad del bundle.

### Manual Verification
1. Ir a Ajustes -> WhatsApp Business.
2. Agregar una cuenta (o usar existente).
3. Ejecutar diagnóstico de esa cuenta específica.
4. Ir a Comunicación -> WhatsApp.
5. Seleccionar la cuenta en el selector.
6. Verificar que el botón de envío se habilita y el costo se calcula.
