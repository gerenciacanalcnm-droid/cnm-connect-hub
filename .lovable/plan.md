# Plan: Fix WhatsApp Template Synchronization

The goal is to fix the synchronization flow between Meta Cloud API and the local database (`whatsapp_templates` table) and ensure that the UI correctly displays all synchronized templates (APPROVED) alongside local drafts.

## User Review Required

> [!IMPORTANT]
> The synchronization will use `company_id`, `name`, and `language` as unique identifiers for idempotency. Existing local drafts with the same name and language might be overwritten if their status changes to what Meta reports.

## Proposed Changes

### Backend Logic (`src/lib/whatsapp.functions.ts`)
- **Enhance `syncWhatsAppTemplates`**:
    - Add detailed logging of Meta API response (template ID, name, language, status, etc.) to server logs.
    - Ensure `upsert` correctly handles `meta_template_id` (mapping from Meta's `id`).
    - Verify that `company_id` and `account_id` are correctly associated.
    - Implement a detailed result object returning: total found, total updated/inserted, and errors.

### Database Repository & Hook
- **Repository (`src/repositories/whatsapp.repository.ts`)**:
    - Ensure `listTemplates` uses the shared `getWhatsAppTemplates` server function.
- **Hook (`src/hooks/use-whatsapp.ts`)**:
    - Ensure `useSyncWhatsAppTemplates` returns the detailed result object from the server function.
    - Verify cache invalidation triggers a refresh of the template list.

### UI Improvements (`src/components/comunicacion/whatsapp-templates.tsx`)
- **Sync Result Notification**:
    - Update `syncMutation.onSuccess` to display a detailed toast with counts (found, updated, errors).
- **Template List**:
    - Ensure the list displays both local drafts and Meta-synchronized templates.
    - Add visual indicators to distinguish between "Sincronizada (Meta)" and "Borrador Local".
    - Force a query refresh after sync.

## Technical Details
- **Idempotency**: `upsert` on `whatsapp_templates` table using `onConflict: "company_id, name, language"`.
- **Meta Fields**: Map `t.id` from Meta to `external_id` (or `meta_template_id` if defined in schema) in `whatsapp_templates`.
- **RLS**: The server function uses the authenticated context, ensuring RLS is respected for the `company_id`.

## Verification Plan
1. Trigger "Sincronizar con Meta" from the UI.
2. Check browser notifications for the detailed summary.
3. Verify that `mujerdos`, `dia_de_la_mujer`, and `plantilla_dos` appear in the grid with `APPROVED` status.
4. Verify that local drafts are still present.
