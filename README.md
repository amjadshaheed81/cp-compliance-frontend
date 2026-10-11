# CAFM Site Check grid: Asset Information and header actions
TEST-only frontend package — 11 October 2026

Source baseline: frontend(3).zip (same hashes as current GitHub main for affected files at review time).

## Changes
- Asset ID column is now labelled Asset Information and displays Name, Floor / Room / Position and Asset ID on separate lines.
- Local search includes asset name and location; numeric Asset ID sorting stays unchanged.
- Existing grid columns and View/Edit, Copy, Mark Done and Delete buttons are retained.
- Right-hand View Inspection header duplicates Copy, Mark Done and Delete beside Close (View/Edit is the already-open inspection). Mark Done is intentionally hidden for Monthly Audits, which require their own Submit/PDF flow.
- The same existing handlers are reused. Copy closes the workspace so its existing form is visible. Delete closes it only after a successful delete.
- Header confirm dialogs are raised above the right panel to fix the hidden SweetAlert problem.
- No Month Audit business logic, new tests, database schema or other modules touched.

## Deployment
Deploy Site Service first to TEST, then this frontend. Do NOT apply directly to production.

## Known constraint
The existing grid Mark Done shortcut uses the generic Site Check status update handler. Monthly Audits must be finalised using their dedicated Submit/PDF workflow. The new workspace header therefore does not show Mark Done for Monthly Audits. The older grid shortcut is unchanged by this scoped UI release; do not use it to complete a Monthly Audit.

## Manual TEST checks
1. Name, location and ID display correctly for linked assets; '-' for no linked asset.
2. Search by asset name, floor, room, position or ID, and sort numerically by ID.
3. Grid Actions buttons remain and still function.
4. Right-panel Copy reveals the existing Copy form after closing the panel.
5. Right-panel Mark Done/Delete confirmations remain visible above the panel; Cancel does nothing.
6. Delete closes panel only on success; Mark Done refreshes the status for other inspections and is absent for Monthly Audit; existing Open Early/View PDF buttons and Close work.
7. Review the grid and panel on narrower screens.

## Git
Commit title: Show asset details in Site Check grid and duplicate inspection header actions
Remarks:
- Display asset name, floor/room/position and ID in the existing grid column.
- Add name/location to grid search; retain numeric asset sorting.
- Duplicate Copy, Mark Done and Delete beside inspection Close.
- Keep existing grid Actions column; reuse handlers and fix confirmation layering.
- No database changes.

## Validation
TypeScript JSX parser: 0 syntax diagnostics for changed JSX files.
Full React build and interactive/browser tests have not been run in this environment.
