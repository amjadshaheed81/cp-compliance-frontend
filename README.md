# CAFM Site Check — compact header actions (TEST)

## Baseline
This is a small follow-up to the already reviewed TEST patch for Asset Information and right-panel header actions. The source files matched the live frontend repository main branch at review time (11 Oct 2026). Apply ONLY to the same/latest frontend source; do not overwrite newer edits without comparing them.

## Change
- Move existing Full/Split-view toggle directly next to the Close button.
- Replace the three individual header buttons with one More (three-dot) menu: Copy Site Check, Mark Done, Delete Site Check.
- Keep Delete at bottom to reduce accidental selection; existing confirmation and action handlers are unchanged.
- Monthly Audit still does not show Mark Done (uses Submit for PDF/History).
- Keep the header portal for Open Early / View PDF visible before the More menu.
- The grid Actions column remains untouched.
- Existing responsive rule hides the Full/Split toggle at narrower browser widths where split view is disabled.

## Changed frontend source files
- src/components/Protected/Sites/SiteChecks/SiteCheckWorkspace.jsx
- src/components/Protected/Sites/SiteChecks/SiteCheckWorkspace.css

No Site Service, Project Service, API, migrations, new helper classes or test files.

## TEST verification steps
1. Deploy frontend to TEST only. Open a Site Check.
2. Confirm header displays Open Early and/or View PDF when eligible, then More, Full/Split toggle, Close.
3. Check More items: Copy, Mark Done, Delete (existing confirm dialogs and behaviour).
4. Check a Done inspection disables Mark Done; Monthly Audit omits Mark Done entirely.
5. Confirm the Full/Split toggle is immediately beside Close on wide screens and still switches views.
6. Check no changes to the grid's existing Actions buttons and Asset Information column.
7. Test keyboard navigation and narrow/mobile layout.

## Validation
- SiteCheckWorkspace.jsx JSX syntax: PASS (TypeScript transpiler parser).
- CSS parse: PASS (tinycss2).
- 13 focused source checks: PASS.
- Full React build and browser integration NOT run here; must pass in TEST deployment.

## Recommended Git commit
Title: Compact Site Check header actions into More menu

Remarks:
- Group Copy, Mark Done and Delete in one accessible More menu.
- Move Full/Split view control beside Close.
- Keep Open Early/View PDF visible and preserve existing handlers.
- Preserve Monthly Audit submission safeguards and grid actions.
- Frontend-only; no database or backend changes.
