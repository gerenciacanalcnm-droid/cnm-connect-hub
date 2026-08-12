# Plan: Sprint 6.2 — Centro Central de Contactos Multicanal

Consolidar la gestión de contactos en un único módulo centralizado que sirva como fuente de verdad para WhatsApp, SMS y Email, permitiendo importación masiva y segmentación omnicanal.

## Auditoría Fase 1 (Reporte)

| CANAL | TABLA | REGISTROS | EMPRESAS | DUPLICADOS | CONTACTOS MIGRADOS | CONTACTOS SIN MATCH |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| WhatsApp | contacts | 0 | 1 | 0 | 0 | 0 |
| SMS | contacts | 0 | 1 | 0 | 0 | 0 |
| Email | contacts | 0 | 1 | 0 | 0 | 0 |
| Contacts central | contacts | 0 | 1 | 0 | 0 | 0 |

**Hallazgos técnicos:**
- La tabla `contacts` ya está preparada con `normalized_phone` y `preferred_channel`.
- Se han detectado 4 mensajes de WhatsApp enviados manualmente que no están registrados como contactos.
- La identidad única está garantizada por `(company_id, normalized_phone)`.

## Tareas Técnicas

### 1. Interfaz del Centro de Contactos
- Refactorizar `src/routes/_app.crm.tsx` para renombrar la pestaña "Contactos" a "Centro de Contactos".
- Crear `src/components/crm/contact-center/ContactCenterHub.tsx` como componente principal.
- Implementar importador de CSV/Excel con mapeo de columnas (Nombre, Teléfono, Email).

### 2. Lógica de Consolidación
- Implementar función de deduplicación basada en `normalized_phone`.
- Asegurar que la creación de contactos valide `opt_in` por canal en `contact_channel_preferences`.

### 3. Gestión de Listas y Segmentación
- Actualizar la UI de `contact_lists` para permitir filtros por disponibilidad de canal.
- Implementar etiquetas dinámicas.

### 4. Edit Visual Solicitado
- Cambiar el texto "todos los contactos" a "TEST CONTACTOS" en el componente que lo renderice (detectado como instancia dinámica en el Hub).

## Technical Details
- **Database**: PostgreSQL (Supabase) con RLS por `company_id`.
- **Identidad**: `company_id + normalized_phone` (prioridad) o `company_id + normalized_email`.
- **Frontend**: TanStack Query para sincronización de estados y Shadcn UI para el Centro de Contactos.
- **Normalización**: Meta E.164 (ej: 57300...).
