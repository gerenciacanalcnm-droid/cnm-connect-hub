---
title: WhatsApp Templates Multimedia and Meta Sync Fix
description: Fix broken image previews and "Invalid parameter" errors in WhatsApp template creation by implementing real media handles and detailed Meta API error reporting.
---

## Technical Details

### 1. Multimedia & Previews
- **Local Preview**: Use `URL.createObjectURL` to show a real image preview immediately after selection in `src/components/comunicacion/whatsapp-templates.tsx`.
- **Media Upload**: Update `src/lib/whatsapp-assets.functions.ts` to (optionally/mock) handle real byte uploads and ensure `src/components/comunicacion/whatsapp-templates.tsx` stores the `header_handle` returned by Meta's Resumable Upload API (if applicable) or a valid ID.
- **State Management**: Clearly separate `localPreviewUrl` from the persistent `headerText` (which will store the Meta handle).

### 2. Meta Cloud API Integration (`submitWhatsAppTemplateToMeta`)
- **Detailed Diagnostics**: Wrap the Meta fetch call in a block that captures full response details (HTTP status, error code, subcode, fbtrace_id, message) instead of throwing a generic "Invalid parameter".
- **Payload Construction**: Ensure the `HEADER` component uses `format: "IMAGE"` and includes the `example.header_handle` as a list of strings, as required by the Graph API for templates with media.
- **Variable Validation**: Automatically generate `example.body_text` for body components containing `{{n}}` placeholders, ensuring the number of examples matches the number of variables.

### 3. Database & Workflow
- **Idempotency**: Maintain the `(account_id, external_id)` unique constraint.
- **State Transitions**: `DRAFT` only moves to `PENDING` upon successful Meta API response (200 OK with an ID).
- **Error Display**: Render the detailed Meta error in the UI toast or a dedicated error area in the editor.

## Proposed Changes

### Frontend (`src/components/comunicacion/whatsapp-templates.tsx`)
- Add `localPreviewUrl` state.
- Update `handleFileUpload` to set the preview URL and call a server function that returns a Meta media handle.
- Update the preview <img> to use `localPreviewUrl || headerText`.
- Enhance the `sendToMetaMutation` error handler to display detailed diagnostics.

### Backend (`src/lib/whatsapp-meta.functions.ts`)
- Refactor `submitWhatsAppTemplateToMeta` to be more robust and verbose.
- Correct the `components` payload structure for `MARKETING` templates with media.

### Assets (`src/lib/whatsapp-assets.functions.ts`)
- Update to support returning a `header_handle` or mock it realistically for the flow.
