# WhatsApp Campaigns System (Sprint 4)

Complete mass messaging infrastructure for WhatsApp, including scheduling, queue management, and real-time tracking.

## Technical Details

- **Database**:
  - `whatsapp_campaigns`: Stores campaign metadata (name, status, template, schedule).
  - `whatsapp_campaign_results`: Atomic tracking of each message in a campaign.
  - Idempotency via `batch_id` and atomic credit deductions.
- **Backend (Server Functions)**:
  - `getWhatsAppCampaigns`: List campaigns for a company.
  - `createWhatsAppCampaign`: Initialize a campaign and its recipient queue.
  - `getWhatsAppCampaignDetails`: Detailed metrics and individual delivery status.
- **Frontend**:
  - `WhatsAppCampaigns` component: List view with KPIs and statuses.
  - Integration into `ComunicacionPage` via "Campañas WA" tab.

## Implementation Steps

### 1. Database Schema
- [x] Create migration `whatsapp_campaigns` and `whatsapp_campaign_results`.
- [x] Enable RLS and define per-tenant policies.

### 2. Backend Logic
- [x] Implement `src/lib/whatsapp-campaigns.functions.ts`.
- [x] Handle draft/scheduled/queued statuses mapping to Meta API expectations.

### 3. Hooks & UI
- [x] Create `src/hooks/use-whatsapp-campaigns.ts`.
- [x] Create `src/components/comunicacion/whatsapp-campaigns.tsx`.
- [x] Register new component in `src/routes/_app.comunicacion.tsx`.

### 4. Visual Edits
- [x] Replace "Saldo insuficiente" in template dropdown with "Saldo insuficiente para ejecutar esta campaña".
- [ ] Locate and replace "Falta información para completar la plantilla" (currently checking for dynamic messages or missed files).
