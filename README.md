# CAFM — Monthly Audit overdue confirmation UI fix (TEST)

**Date:** 8 October 2026  
**Scope:** Frontend only; Audit → Monthly Audit → overdue manual renewal.  
**Source baseline:** `CAFM_Dan_Monthly_Audit_Done_Overdue_Renewal_TEST_2026-10-08_frontend.zip`, currently used for TEST Build 2026.18.1.81.

## Verified cause

The full-width Site Check workspace is a fixed panel with CSS `z-index: 1300`. The overdue handler called `beginMonthlyWork()` (showing "Archiving…" and disabling controls) **before** `Swal.fire()` displayed a confirmation popup. SweetAlert's confirmation was behind the Site Check panel. Since `renew-overdue` is called **only after** the confirmation, there was no Network request while the UI looked busy. Closing the panel exposed the original popup.

## What changed

The existing `Audit.jsx` now displays its **Start New Monthly Audit?** confirmation *inside View Inspection* immediately when an overdue Monthly Audit is opened. The new Inspection/Start Date and calculated Next Due Date are shown above the confirmation. The engineer can backdate up to one calendar month, and the confirmation text changes with the selected date.

- **Archive and start new audit** triggers the existing `POST /api/site-check/{checkId}/monthly-audit/renew-overdue` with the selected date and current period token.
- **Cancel** hides the confirmation but leaves the overdue inspection view and its start/due date controls open. **Start New Monthly Audit** can reopen the confirmation.
- "Archiving…" is shown only after the engineer confirms and the validated request begins; not while waiting for a hidden popup.
- If the server returns success but the refreshed inspection form fails to load, the UI asks the engineer to reload **without renewing again**.
- The existing one-month date limit and backend archive-before-reset safeguards are retained.

## Files to replace in the FRONTEND repository

`src/components/Protected/Sites/SiteChecks/Audit.jsx`

The ZIP contains only that complete replacement source file and these notes. Do not replace other files with older packages.

**No Site Service changes, no SQL/database changes, no new project tests or helper classes.** Does not modify #406 (Hull) or any other database record.

## TEST deployment

1. Copy the `src/.../Audit.jsx` file over the same path in your CURRENT frontend repository. This package is an overlay on the latest October Monthly Audit frontend, not a replacement for the whole frontend.
2. Run `npm run build` locally and require it to pass.
3. Commit and deploy frontend to TEST only; hard refresh the browser.
4. Open **Check #408**, only after restoring TEST data to an overdue period. The inline **Start New Monthly Audit?** confirmation and both dates should be visible inside the right panel.
5. Change the Start Date and check Next Due Date and the confirmation text recalculate. Click **Cancel**; no `renew-overdue` request should be sent. Click **Start New Monthly Audit** to reopen the inline confirmation.
6. Press F12 → Network → Fetch/XHR → Preserve log. Click **Archive and start new audit** once. Only now should `POST /api/site-check/408/monthly-audit/renew-overdue` appear and the button show "Archiving…".
7. Check HTTP result, new blank working answers, period generation and History/PDF before claiming renewal succeeded. If the actual HTTP request is Pending/fails, that is a separate backend/archive/storage issue; capture Network Response and Site Service logs. Do not retry repeatedly.
8. **Leave #406 unchanged** for Paul.

## Validation done here

- JSX parsed and transpiled successfully using the TypeScript JSX parser/transpiler.
- Source-level checks confirmed the in-panel confirmation, date controls, proper deferred API call, Cancel semantics, state resets and unchanged backend API usage.
- Checked changes against the exact latest frontend source package; no unrelated source changes.
- Full React build and a live browser/server renewal were **not** run here because the local node_modules archive is incomplete. Run `npm run build` in your machine before pushing.

## Rollback

Restore `Audit.jsx` from the preceding deployed Dan Monthly Audit frontend source. No backend or database rollback is required for this UI-only patch.

## Git

**Commit:** `Fix hidden Monthly Audit overdue confirmation in inspection panel`

**Remarks:**
- Show overdue renewal confirmation inside the Site Check right panel with new Start/Due Dates.
- Delay Archiving state and API call until engineer confirms.
- Keep Cancel/date changes local without submitting a renewal.
- Improve refresh-failure message after a successful renewal.
- Frontend-only; no change to History, PDF, scheduler, Inspection, Annual Winter Audit or #406.
