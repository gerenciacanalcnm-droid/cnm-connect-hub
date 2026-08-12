# Plan: Sprint 1 — WhatsApp Number Inventory and Assignment

Create a central administration system for WhatsApp numbers managed by CNM Nova, allowing assignment to specific client companies while maintaining ownership at the Nova level.

## User Review Required

> [!IMPORTANT]
> The current `whatsapp_accounts` table will be repurposed as the inventory source. RLS policies will be updated to allow admins to see all numbers and client companies to see only their assigned numbers.

## Proposed Changes

### Database & Security
- [x] Create `whatsapp_assignment_status` enum (AVAILABLE, ASSIGNED, DISCONNECTED, ERROR).
- [x] Update `whatsapp_accounts`: make `company_id` nullable, add `phone_number`, `waba_id`, and `nova_status`.
- [x] Fix TypeScript type mismatches in `whatsapp_templates`, `whatsapp_messages`, and `whatsapp_conversations` caused by nullable `company_id`.
- [ ] Implement RLS policies for `whatsapp_accounts`:
    - `admin` role: Full access to all rows.
    - `authenticated` users: `SELECT` only where `company_id` matches their member company.
- [ ] Create `whatsapp_assignment_audit` table to track assignment changes.

### Server Functions (`src/lib/whatsapp-inventory.functions.ts`)
- [ ] `getInventoryNumbers`: Fetch all numbers (Admin only).
- [ ] `assignNumberToCompany`: Set `company_id` and status to `ASSIGNED` (Admin only).
- [ ] `unassignNumber`: Set `company_id` to `NULL` and status to `AVAILABLE` (Admin only).
- [ ] `transferNumber`: Atomic update from one company to another (Admin only).

### Frontend - Admin Interface
- [ ] Create `src/routes/_admin.admin.whatsapp-inventory.tsx` (Route for Inventory).
- [ ] Build Inventory Table: Display all managed numbers with metadata and assignment status.
- [ ] Build Assignment Modal: Search/Select company to assign a number.
- [ ] Implement Assignment/Unassignment flows with confirmation dialogs.

### Frontend - Client Interface
- [ ] Update selectors in Individual and Bulk sending flows to only show assigned numbers.

## Technical Details
- **Tables Modified**: `whatsapp_accounts`, `whatsapp_templates`, `whatsapp_messages`, `whatsapp_conversations`.
- **New Tables**: `whatsapp_assignment_audit`.
- **Atomic Operations**: Assignment changes will use a single SQL transaction or a server function to ensure a number is never assigned to two companies simultaneously.
- **RLS**: The `has_role(auth.uid(), 'admin')` security definer function will be used for admin-only operations.
