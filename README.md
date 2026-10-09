# CAFM TEST Monthly Audit — Frontend (9 October 2026)

**Base source**: User-uploaded `frontend(3).zip` (Git commit 25cacec3).
**Scope**: Frontend only. Replace the single file at its project-relative path, then commit and deploy to TEST.

## Changes
- A simple **Start next audit** button for a verified completed Monthly Audit within 7 days of its Due Date, when the scheduler has not opened the next audit yet.
- Keeps the previous PDF and answers in History before presenting the new audit; new answers are blank by default (unless existing carry-forward setting is enabled).
- Shows **Current Due Date** on an open Monthly Audit. A proposed next due date appears only as **After Submit**, without misleadingly extending the current deadline when a question is saved.
- Includes the previously approved *simplified overdue renewal panel* from the separate 9 October UI patch; no older verbose confirmation.
- No change to Annual Winter Audit or the 21 Inspection components.

## Deployment
1. Deploy the matching Site Service package to TEST first. It implements the new 7-day early-opening API behaviour.
2. Copy this changed source file into the current frontend source repository and verify the diff.
3. Build/deploy frontend on TEST and verify the build number changes.
4. Use Site Check #408 for controlled validation, not #406.

**Git title:** Add simple Monthly Audit early opening and fixed due-date display
**Git remarks:** Reused the existing early-open endpoint; show a short start button for completed audits, keep due dates fixed until Submit, and preserve the approved simplified overdue UI.

**Validation**: JSX parsing passed locally; full React build has NOT run here. No new tests, helper classes, database files or migrations included.
