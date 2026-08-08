# CAFM Site Check Engineer/Date Standardisation — Next Chat Handover

## Current objective

Standardise Engineer name and inspection/signature date behaviour across Site Check inspection components, using `AirConditioning.jsx` as the approved reference.

## Approved business rules

### Open

- Current UK/London date is shown/saved.
- Logged-in user is the initial Engineer.
- Engineer can be selected from active users assigned to the Site Check's actual site.
- Selected Engineer is saved and used in PDF/certificate fields.
- Same-day temporary Risk Assessment records may retain the selected Engineer.

### Done

- Saved Engineer/date are restored.
- Engineer/date are read-only through each form's existing Done behaviour.
- Current logged-in user/date must not overwrite historical values.

## Development method

- Work in batches of **four components**.
- Reuse shared Engineer selector/hook/date helpers.
- Preserve each form's own API entity/payload field names and PDF mappings.
- Preserve original Site Check UI `type/subType/category` when marking Done.
- Keep replaced Engineer fields commented during review with clear OLD/NEW markers.
- Provide one combined batch test sheet.
- Always create/update this handover after each batch.

## Shared files already present

```text
src/components/Protected/Sites/SiteChecks/shared/SiteCheckEngineerSelector.jsx
src/components/Protected/Sites/SiteChecks/shared/useSiteCheckEngineers.js
src/components/Protected/Sites/SiteChecks/shared/siteCheckDateUtils.js
```

## Completed and confirmed working before batch v1.6.0

1. Air Conditioning — approved original reference
2. External Lighting — v1.0.0 — confirmed working
3. Microwave Oven — v1.1.0 — confirmed working
4. Disabled WC Alarm — v1.2.0 — confirmed working
5. CCTV — v1.3.0 — confirmed working

## Batch v1.4.0

Implemented:

6. Intruder Alarm
7. Fire Alarm Sounder Audibility
8. Refuge Intercom
9. General Fire Alarm Inspection

Package:

```text
CAFM-SiteCheck-Engineer-Date-Batch-v1.4.0.zip
```

## Batch v1.5.0

Implemented:

10. Emergency Lighting
11. Gas Boiler Service
12. Gas Safety Annual Inspection
13. Storage Tank Visual Inspection

Package:

```text
CAFM-SiteCheck-Engineer-Date-Batch-v1.5.0.zip
```

## Batch v1.6.0 — current batch

Implemented:

14. `WaterHeaterCertificate.jsx`
15. `WaterChlorination.jsx`
16. `ShowerHeadCertificate.jsx`
17. `FanExtract.jsx`

Also changed:

```text
UpdateSiteCheck.jsx
```

Package:

```text
CAFM-SiteCheck-Engineer-Date-Batch-v1.6.0.zip
```

### UI routes

| Component | Type | Sub Type | Category |
|---|---|---|---|
| Water Heater | Inspection | Legionella | Water Heater Inspection & Service |
| Water Chlorination | Inspection | Legionella | Water - Storage System Chlorination |
| Shower Head | Inspection | Legionella | Periodic Shower Head Cleaning |
| Extract Fan | Inspection | Plant and Equipment Inspection | Extract Fan Cleaning |

### Asset requirements

**Water Heater**

```text
Mechanical / Water Services / Calorifier
```

**Water Chlorination**

```text
No asset selected by this form
```

**Shower Head**

```text
Mechanical / Water Services / Outlet / Shower
```

or:

```text
Mechanical / Water Services / Outlet + subCategory3 Shower
```

**Extract Fan**

```text
Mechanical / Ventilation / Extract Fan
```

### Simple testing notes

- Water Heater: Parts Required = No to avoid Risk Assessment.
- Water Chlorination: Risk Assessment is optional.
- Shower Head: Risk Assessment is optional; important regression is that a Done record now reloads its saved inspection data.
- Extract Fan: Parts Required = No to avoid Risk Assessment.

## Validation limitation

All changed JSX files passed parser/static checks. Full npm build cannot be executed in the current environment because the configured dependency mirror has previously been missing required npm packages. Always run local:

```powershell
npm run build
npm start
```

and complete the browser test sheet.

## Remaining components after v1.6.0 passes

Only four remain — final Batch v1.7.0:

18. `AirConditioningRecurrenceCheck.jsx` — Air Conditioning F-Gas Report
19. `VentilationReport.jsx` — Ventilation System(s) Servicing
20. `FireDamper.jsx` — Passive Fire - Fire Damper Inspection
21. `FireFightingEquipmentReport.jsx` — Fire Extinguisher Inspection & Service

## Next action

First test all four v1.6.0 components using `BATCH_TEST_CASES.md`.

If all four pass, implement final v1.7.0 for F-Gas, Ventilation, Fire Damper and Fire Fighting Equipment using the same approved shared Engineer/date behaviour.
