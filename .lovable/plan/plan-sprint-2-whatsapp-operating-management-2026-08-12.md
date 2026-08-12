# Plan: Sprint 2 — WhatsApp Operating Management

Objective: Complete the WhatsApp multi-number module for CNM Nova, allowing Super Admins to manage number operational status and ensuring each company can only use assigned numbers.

## Technical Details

### 1. Database Schema Evolution
- Create migration to add `is_default` (boolean, default false) to `whatsapp_accounts`.
- Create migration to update `whatsapp_assignment_status` enum or ensure `DISABLED` is available in `nova_status`. (Existing check showed `AVAILABLE`, `ASSIGNED`, `DISCONNECTED`, `ERROR`).
- Add `nova_status` support for `DISABLED`.

### 2. Backend Logic (`src/lib/whatsapp-inventory.functions.ts`)
- **New function `setNumberAsDefault`**:
  - Validates `super_admin` role.
  - Atopically updates `is_default = false` for all numbers of the target company.
  - Sets `is_default = true` for the selected `accountId`.
- **New function `updateNovaStatus`**:
  - Validates `super_admin` role.
  - Updates `nova_status` to `AVAILABLE`, `ASSIGNED`, or `DISABLED`.
- **New function `transferNumber`**:
  - Validates `super_admin` role.
  - Transfers account between companies with audit logging.

### 3. Database Functions & RLS
- Update `assign_whatsapp_account` and `unassign_whatsapp_account` RPCs if necessary to handle `is_default` and new statuses.
- Ensure RLS isolation: `SELECT` on `whatsapp_accounts` where `company_id = auth.company_id()` and `nova_status = 'ASSIGNED'`.

### 4. Admin UI (`src/routes/_admin.admin.whatsapp-inventory.tsx`)
- Update inventory table to show Meta status vs Nova status.
- Add actions menu/buttons for:
  - "Establecer como principal" / "Quitar principal".
  - "Activar" / "Desactivar" (sets `nova_status`).
  - "Diagnóstico" (triggers existing diagnostic).
  - "Transferir empresa" (open selection modal).
- Refine "Asignar" flow to handle initial `is_default` state.

### 5. Client Selection Logic
- Update `src/components/comunicacion/send-whatsapp-individual.tsx` to:
  - Filter by `nova_status === 'ASSIGNED'`.
  - Auto-select the number where `is_default === true`.

## User Interface Changes
- **Inventario Table**: New columns for "Estado Meta" (CONNECTED/DISCONNECTED/etc) and "Estado Nova" (AVAILABLE/ASSIGNED/DISABLED).
- **Actions Menu**: New dropdown or button set for operational management.
- **Visual indicators**: Icons or badges for the "Principal" (Default) number.

## Verification Plan
1. **Schema Check**: Verify `is_default` column exists.
2. **Admin Flow**: Assign two numbers to a company, toggle "Principal", verify only one remains true.
3. **Isolation**: Login as Company A, verify cannot see Company B numbers even via direct ID access (RLS test).
4. **Diagnostic**: Trigger diagnostic for an assigned number, verify Meta connectivity report.
