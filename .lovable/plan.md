# Plan: Sprint 3 — WhatsApp Commercial Management

Implement commercial and operational control for WhatsApp accounts per company, including message limits, consumption tracking, and a dedicated commercial profile for admins.

## User Review Required

> [!IMPORTANT]
> The plan introduces a new `whatsapp_limits` table and a `consumption_type` to existing `whatsapp_messages`. It also adds a per-company WhatsApp view in the admin panel.

- **Message Limits**: Do you have specific default values for the hourly/daily/monthly limits if none are set? (Defaulting to "unlimited" if not configured).
- **Consumption Accuracy**: Tracking consumption relies on the `whatsapp_messages` table. Historic data will be categorized as "individual" by default unless identifiable as "masivo" via `campaign_id`.

## Proposed Changes

### Database & Security

#### New Tables & Schema Updates
- Create `public.whatsapp_limits` table to store per-company message caps (hourly, daily, monthly, per_campaign).
- Update `public.whatsapp_messages` to include a `consumption_type` enum (individual, bulk, campaign, automation).
- Add `GRANT` statements and RLS policies for the new table.

### Backend (Server Functions)

#### WhatsApp Commercial & Limits (`src/lib/whatsapp-commercial.functions.ts`)
- `getCompanyWhatsAppProfile`: Aggregates stats (sent, success, failed), consumption cost, and active limits.
- `updateCompanyWhatsAppLimits`: Allows Super Admins to set or disable caps.
- `getWhatsAppConsumptionStats`: Provides time-based (Today, Week, Month, All) and type-based stats.
- `checkWhatsAppLimits`: Internal helper to validate if a company can send more messages before execution.

### Frontend (Admin UI)

#### Company WhatsApp Profile
- Update `src/routes/_admin.admin.empresas.tsx` or a sub-route to show the new "WhatsApp" section.
- Display assigned numbers, stats, wallet balance, and consumption.
- Add an interface for configuring limits.

#### Inventory Updates
- Enhance `src/routes/_admin.admin.whatsapp-inventory.tsx` to show per-number consumption.

### Integration

#### Limit Enforcement
- Update `sendIndividualMutation`, `sendBulkMutation`, and `sendTemplateMutation` hooks (or their underlying server functions) to call `checkWhatsAppLimits` before proceeding.

## Technical Details

- **Limit Logic**: 
  - Hourly: Count messages in the last 60 minutes.
  - Daily: Count messages since 00:00 UTC.
  - Monthly: Count messages since 1st of current month.
- **Atomic Counters**: Use DB aggregation for accurate real-time stats rather than just storing a counter to avoid drift.

## Visual Text Edits
- Change text from "WhatsApp" to "Has alcanzado el límite de mensajes configurado para tu empresa" (on element "span" at ":1") in the relevant error/limit state.
