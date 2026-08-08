# CAFM Site Check Engineer/Date Batch v1.6.0

## Scope

This is an **incremental front-end update after v1.5.0**. It applies the approved Air Conditioning Engineer/date behaviour to four more Site Check forms:

1. Water Heater Inspection & Service
2. Water - Storage System Chlorination
3. Periodic Shower Head Cleaning
4. Extract Fan Cleaning

The shared Engineer control/hook/date utilities from the earlier approved batches are reused unchanged.

## Approved behaviour

### Open Site Check

- Current UK/London date is shown and used at submission, matching Air Conditioning.
- Logged-in user is the initial Engineer.
- Engineer can be changed to another active user assigned to the Site Check's actual site.
- The selected Engineer is saved using each form's existing engineer field.
- PDF/certificate Engineer name/signature uses the selected Engineer where the template supports it.
- If Risk Assessment creates a same-day temporary generic-inspection record, the selected Engineer may be retained.

### Done Site Check

- Saved Engineer is restored.
- Saved inspection/signature date is restored.
- Engineer/date fields follow the form's existing read-only/Done behaviour.
- Current logged-in user/date do not replace the historical values.

## Files changed

```text
src/components/Protected/Sites/SiteChecks/WaterHeaterCertificate.jsx
src/components/Protected/Sites/SiteChecks/WaterChlorination.jsx
src/components/Protected/Sites/SiteChecks/ShowerHeadCertificate.jsx
src/components/Protected/Sites/SiteChecks/FanExtract.jsx
src/components/Protected/Sites/SiteChecks/UpdateSiteCheck.jsx
```

## Shared files reused unchanged

```text
src/components/Protected/Sites/SiteChecks/shared/SiteCheckEngineerSelector.jsx
src/components/Protected/Sites/SiteChecks/shared/useSiteCheckEngineers.js
src/components/Protected/Sites/SiteChecks/shared/siteCheckDateUtils.js
```

## Form-specific notes

### Water Heater

UI route remains:

```text
Inspection / Legionella / Water Heater Inspection & Service
```

Internal generic-inspection values remain:

```text
Inspection / Water Heater / Water Heater Service
```

- Asset filter remains Mechanical / Water Services / Calorifier.
- Engineer's old read-only field is retained as a comment for review.
- Shared Engineer dropdown is enabled while Open.
- Open inspection/signed dates use current UK date.
- Done restores saved Engineer/date.
- Selected Engineer is used in the PDF.
- Site/document/action operations use the Site Check's actual site ID.
- Parts Required = Yes + Unit Operational = No + Limescale Evident = Yes is the existing Risk Assessment trigger.

### Water Chlorination

UI route remains:

```text
Inspection / Legionella / Water - Storage System Chlorination
```

Internal generic-inspection values remain:

```text
Maintenance / Chlorination / Water Chlorination
```

- This certificate does not select an asset; `assetId` remains blank by design.
- Engineer Name uses the shared dropdown while Open.
- Selected Engineer signature is displayed/used where available.
- Open certificate/client/engineer dates use the current UK date.
- Done restores saved Engineer and saved dates.
- Risk Assessment remains optional.

### Shower Head Cleaning

UI route remains:

```text
Inspection / Legionella / Periodic Shower Head Cleaning
```

Internal generic-inspection values remain:

```text
Maintenance / Cleaning / Shower Head Cleaning
```

- Asset filter supports both current classifications:
  - Mechanical / Water Services / Outlet / Shower
  - Mechanical / Water Services / Outlet / Shower through `subCategory3 = Shower`
- The original component did not reload its generic-inspection data; this batch adds loading so a Done check can restore its saved Engineer/date and certificate fields.
- Open uses current UK inspection/signed dates.
- Done restores saved Engineer/date.
- Site data is resolved from the Site Check's actual site.
- Risk Assessment remains optional.

### Extract Fan

UI route remains:

```text
Inspection / Plant and Equipment Inspection / Extract Fan Cleaning
```

Internal generic-inspection values remain:

```text
Inspection / Extract Fan / Extract Fan
```

- Asset filter remains Mechanical / Ventilation / Extract Fan.
- Engineer's old read-only field is retained as a comment for review.
- Shared Engineer dropdown is enabled while Open.
- Open inspection/signed dates use current UK date.
- Done restores saved Engineer/date.
- Selected Engineer is used in the PDF.
- Parts Required = Yes continues to require Risk Assessment.

## Important routing protection

These forms previously used internal generic-inspection values in places where the Site Check itself was being marked Done. This batch preserves the original UI `type / subType / category` so reopening a completed Site Check routes back to the same certificate component.

## Review markers

The replaced Engineer controls remain commented with markers such as:

```text
OLD ENGINEER FIELD - COMMENTED FOR REVIEW
NEW SHARED ENGINEER CONTROL - MATCHES AIR CONDITIONING
```

Keep those comments during this review cycle. They can be removed in the final cleanup after all Site Check components are approved.

## Validation performed

- TypeScript JSX parser: **0 parse diagnostics** for all five changed JSX files.
- Static assertions confirmed each target component:
  - uses the shared Engineer selector/hook;
  - receives the full `siteCheck` object;
  - uses current UK date for Open submission;
  - saves the selected Engineer ID;
  - preserves its original UI route when marking Done.
- `UpdateSiteCheck.jsx` was checked to pass `siteCheck={siteCheck}` into all four components.
- Full npm build cannot be completed in this environment because the configured dependency mirror has previously returned 404 for required packages. Run `npm run build` locally before browser testing.

## Apply order

Apply this package **after v1.5.0**. It is incremental and assumes the shared Engineer selector/hook/date helper files from earlier batches are already present.
