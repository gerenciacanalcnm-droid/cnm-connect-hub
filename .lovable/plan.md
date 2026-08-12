# Plan: WhatsApp Template System Fix - Database Integrity & Sync

We need to fix the WhatsApp template duplication issue by ensuring a real UNIQUE constraint exists in PostgreSQL and updating the sync logic to use it correctly.

## Objectives
1. Audit and fix the database schema (`whatsapp_templates`).
2. Deduplicate existing records based on the new identity rule.
3. Update server functions to use the correct `ON CONFLICT` clause.
4. Improve UI to handle multi-account views and clear template states.
5. Fix template creation flow (DRAFT -> PENDING -> APPROVED).

## Technical Details

### 1. Database Remediation
- **Migration**: 
  - Delete duplicate rows based on `(account_id, external_id)`.
  - Add a formal `UNIQUE` constraint: `ALTER TABLE whatsapp_templates ADD CONSTRAINT whatsapp_templates_account_external_unique UNIQUE (account_id, external_id)`.
  - Ensure RLS and GRANTs are correctly applied.

### 2. Backend Logic Update
- **`src/lib/whatsapp.functions.ts`**:
  - Update `syncWhatsAppTemplates` to use `ON CONFLICT (account_id, external_id)`.
  - Ensure it updates existing records instead of creating new ones when the combination matches.
  - Correctly map Meta's `id` to `external_id`.
  - Report sync details: New, Updated, Errors.

### 3. Frontend Improvements
- **`src/components/comunicacion/whatsapp-templates.tsx`**:
  - Display one card per `(account_id, external_id)`.
  - Add account labels/badges if multiple accounts are present.
  - Update status logic:
    - `DRAFT`: Local only, not yet sent.
    - `PENDING`: Sent to Meta, awaiting approval (uses Meta's `PENDING` status).
    - `APPROVED`/`REJECTED`: Final Meta states.
  - Distinguish between "Guardar Borrador" (Local) and "Enviar a Meta" (API call + Status update).

### 4. Media & Components Fix
- Ensure the "Cargar imagen" button works and updates the template's `header` and `metadata`.
- Correctly format the payload for Meta API in `submitWhatsAppTemplateToMeta`.

## User Review Required
- Does the `(account_id, external_id)` identity cover all use cases? (e.g. same name in different WABAs is allowed).
- Should we delete duplicates automatically or flag them for review? (Plan assumes automatic deletion of older records).
