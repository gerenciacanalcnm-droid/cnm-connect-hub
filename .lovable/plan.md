# Plan: Sprint Encuestas WhatsApp 2.0 - Fase 2 (FINAL)

Implementación del Centro de Encuestas Profesional con Preview Dinámico, Estadísticas Reales y Compatibilidad Meta.

## User Review Required

> [!IMPORTANT]
> El sistema utiliza datos reales de Supabase. Algunas pruebas marcadas como "NO PROBADA" en el informe final requerirán una cuenta de Meta configurada y operativa para ser validadas en producción.

## Proposed Changes

### 1. Preview Interactivo Completo
- **Ubicación:** `src/components/comunicacion/whatsapp-surveys.tsx`
- **Funcionalidad:**
  - Hot Preview sincronizado con el estado del formulario.
  - Soporte multimedia (Imagen, Video, Documento) en el header para el tipo `INTERACTIVE_BUTTONS`.
  - Simulación de apertura de lista interactiva para el tipo `INTERACTIVE_LIST`.
  - Lógica de reemplazo de variables `{{n}}` con datos de ejemplo para visualización.
  - Estilos coherentes (estilo WhatsApp) evitando contrastes de texto ilegibles.

### 2. Dashboard de Estadísticas Reales
- **Ubicación:** `src/components/comunicacion/whatsapp-surveys.tsx` y `src/lib/whatsapp-surveys.functions.ts`.
- **Funcionalidad:**
  - Nueva función `getSurveyStats` para obtener métricas reales de Supabase.
  - Visualización de: Total Enviados, Total Respuestas, Tasa de Respuesta (%) y Desglose por opción (Barras de progreso).
  - Integración con React Query para actualización automática.

### 3. Backend & Webhook
- **Ubicación:** `src/routes/api/public/whatsapp-webhook.ts` y `src/lib/whatsapp-surveys.functions.ts`.
- **Validación:**
  - Asegurar que `list_reply` y `button_reply` se procesen correctamente en el mismo webhook.
  - Confirmar el flujo de `trackServiceUsage` para asegurar que el motor comercial y el Wallet sigan funcionando sin cambios arquitectónicos.

## Technical Details
- **UI:** Reemplazo total del renderizado de `WhatsAppSurveys` para incluir el modo Dashboard y el modo Editor.
- **Data:** Uso de `useQuery` de TanStack Query para el fetching de estadísticas.
- **Compliance:** Validación estricta de límites de Meta (24 caracteres por opción, 60 por título/footer, 1024 por cuerpo).
- **Wallet:** Persistencia de la lógica de cobro por mensaje interactivo delegada al motor comercial.

## Verification Plan

### Automated Tests
- `bun run build`: Verificar integridad de tipos y compilación.
- `vitest`: Verificar sintaxis de las funciones de servidor.

### Manual Verification (Report A-K)
A. **Lista (2 opciones):** Verificar visualmente en el editor.
B. **Lista (10 opciones):** Verificar scrolling en el popup simulado.
C. **Botones (3 respuestas):** Verificar renderizado de burbujas de respuesta.
D. **Header Multimedia:** Probar cambio entre Imagen/Video/Documento.
E. **Configuración Incompatible:** Verificar que al cambiar a Botones se limiten las opciones a 3.
F. **Preview Realtime:** Escribir en los inputs y ver el reflejo en la burbuja.
G. **Respuesta Real:** (Requiere Meta) Verificar inserción en `whatsapp_survey_responses`.
H. **Estadísticas Reales:** Observar el cálculo de porcentajes en el Dashboard.
I. **Wallet:** Verificar log de `audit_logs` tras el envío.
J. **Typecheck:** Limpio.
K. **Build:** Limpio.
