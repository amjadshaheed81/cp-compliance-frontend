# Batch v1.6.0 — Manual UI Test Cases

Test these four forms together. Use **F12 → Network → Preserve log** during each submission.

## Common pre-check

1. Apply v1.6.0 on top of the already working v1.5.0 source.
2. Run:

```powershell
npm run build
npm start
```

3. Log in and select the test site.
4. Ensure the site has at least **two active users** so you can select an Engineer different from the logged-in user.
5. Create all four Site Checks as `Open` first if that is easier.
6. On each Open form verify:
   - current UK date is shown;
   - logged-in user is initially selected as Engineer;
   - Engineer is a dropdown;
   - another active Engineer assigned to the Site Check site appears.
7. Select a different Engineer before submitting.
8. After submission, reopen the same `Done` Site Check and verify:
   - the selected Engineer is still displayed;
   - the saved date is still displayed;
   - Engineer/date controls are read-only;
   - current logged-in user/date have not replaced the historical values.
9. Check the generated PDF/certificate for Engineer/date where available.

---

# Test 1 — Water Heater Inspection & Service

## Create Site Check

Go to:

```text
Sites → Site Checks → Start New
```

Use:

| Field | Value |
|---|---|
| Type | `Inspection` |
| Sub Type | `Legionella` |
| Category | `Water Heater Inspection & Service` |
| Start Date | Today |
| Lead | User assigned to site |
| Assistant | User assigned to site |
| Repeats | `None` or normal test frequency |

Expected heading:

```text
Water Heater Service Report
```

## Required asset

The asset dropdown filters for:

```text
Category: Mechanical
Sub Category: Water Services
Sub Category 2: Calorifier
```

## Simple no-Risk-Assessment test

1. Select a Calorifier asset.
2. Select/fill the required Site Contact and Client fields.
3. Use simple values such as:

| Field | Value |
|---|---|
| Unit Operational | `Yes` |
| Limescale Evident | `No` |
| Temperature after 60 secs | `60` |
| Job Complete | `Yes` |
| Parts Required | `No` |

`Parts Required = No` keeps this first test away from the current Risk Assessment condition.

4. Confirm Engineer's Name is a dropdown.
5. Select a different Engineer.
6. Submit.

## Network checks

Site Check request:

```text
PUT /api/site-check/{checkId}
```

Must retain:

```text
type     = Inspection
subType  = Legionella
category = Water Heater Inspection & Service
status   = Done
```

Generic inspection request:

```text
POST /api/site-check/generic-inspection
or
PUT  /api/site-check/generic-inspection/{checkId}
```

Verify:

```text
siteId         = Site Check's site ID
engineer       = selected Engineer ID
inspectionDate = current UK date
signedDate     = current UK date
subType        = Water Heater
category       = Water Heater Service
```

## Pass criteria

- [ ] Correct Calorifier assets listed
- [ ] Current UK date shown while Open
- [ ] Logged-in Engineer selected initially
- [ ] Different active site Engineer selectable
- [ ] Submission changes status to Done
- [ ] Done form reopens as Water Heater Service Report
- [ ] Saved Engineer/date restored and read-only
- [ ] PDF shows selected Engineer/date

---

# Test 2 — Water Storage System Chlorination

## Create Site Check

| Field | Value |
|---|---|
| Type | `Inspection` |
| Sub Type | `Legionella` |
| Category | `Water - Storage System Chlorination` |
| Start Date | Today |
| Lead | User assigned to site |
| Assistant | User assigned to site |
| Repeats | `None` or normal test frequency |

Expected heading:

```text
Water Chlorination Certificate
```

## Asset requirement

No asset selection is required by this component. The existing save payload intentionally uses:

```text
assetId = blank
```

## Simple test values

Fill a few clear values so they are easy to recognise in the PDF, for example:

| Field | Example |
|---|---|
| Details of System | `Test cold water storage system` |
| Tank Capacity (litres) | `500` |
| Sterilant | `Test sterilant` |
| Neutralising Agent | `Test neutraliser` |
| Contact Period | `1 hour` |
| Final System Analysis | `Satisfactory` |

Risk Assessment is optional, so leave it empty for the first test.

Then:

1. Confirm the certificate date is today's UK date.
2. Confirm Engineer's Name is a dropdown.
3. Select a different Engineer.
4. If the selected Engineer has a signature, confirm the signature preview changes.
5. Submit.

## Network checks

Site Check must remain:

```text
type     = Inspection
subType  = Legionella
category = Water - Storage System Chlorination
status   = Done
```

Generic inspection must contain:

```text
engineer     = selected Engineer ID
engineerName = selected Engineer Name
date         = current UK date
clientDate   = current UK date
engineerDate = current UK date
subType      = Chlorination
category     = Water Chlorination
```

## Pass criteria

- [ ] Current UK date shown while Open
- [ ] Engineer dropdown lists active site users
- [ ] Different Engineer selectable
- [ ] Signature follows selected Engineer where available
- [ ] Submission changes status to Done
- [ ] Done form reopens as Water Chlorination Certificate
- [ ] Saved Engineer/date/signature restored
- [ ] Certificate/PDF uses selected Engineer/date

---

# Test 3 — Periodic Shower Head Cleaning

## Create Site Check

| Field | Value |
|---|---|
| Type | `Inspection` |
| Sub Type | `Legionella` |
| Category | `Periodic Shower Head Cleaning` |
| Start Date | Today |
| Lead | User assigned to site |
| Assistant | User assigned to site |
| Repeats | `None` or normal test frequency |

Expected heading:

```text
Shower Head Cleaning Certificate
```

## Required asset

The component accepts either of these classifications:

```text
Category: Mechanical
Sub Category: Water Services
Sub Category 2: Outlet / Shower
```

or the newer structure:

```text
Category: Mechanical
Sub Category: Water Services
Sub Category 2: Outlet
Sub Category 3: Shower
```

## Simple test

1. Select a Shower Head asset.
2. Select/fill Site Contact and Client's Name.
3. Enter easy-to-recognise values, for example:

```text
Cleaning Method = Descale and disinfect
Duration        = 15 minutes
```

4. Leave optional Risk Assessment empty.
5. Confirm Engineer's Name is a dropdown.
6. Select a different Engineer.
7. Submit.

## Network checks

Site Check must retain:

```text
type     = Inspection
subType  = Legionella
category = Periodic Shower Head Cleaning
status   = Done
```

Generic inspection must contain:

```text
siteId         = Site Check's site ID
engineer       = selected Engineer ID
inspectionDate = current UK date
signedDate     = current UK date
subType        = Cleaning
category       = Shower Head Cleaning
```

## Important regression check

This component previously did not reload its saved generic-inspection record. After this batch, reopening the `Done` check must restore the submitted certificate information, especially the selected Engineer and dates.

## Pass criteria

- [ ] Correct Shower Head assets listed
- [ ] Current UK date shown while Open
- [ ] Different active site Engineer selectable
- [ ] Submission changes status to Done
- [ ] Done form reopens as Shower Head Cleaning Certificate
- [ ] Saved Engineer/date restored rather than logged-in user/today
- [ ] Engineer/date controls read-only
- [ ] PDF uses selected Engineer/date

---

# Test 4 — Extract Fan Cleaning

## Create Site Check

| Field | Value |
|---|---|
| Type | `Inspection` |
| Sub Type | `Plant and Equipment Inspection` |
| Category | `Extract Fan Cleaning` |
| Start Date | Today |
| Lead | User assigned to site |
| Assistant | User assigned to site |
| Repeats | `None` or normal test frequency |

Expected heading:

```text
Extract Fan Service Report
```

## Required asset

```text
Category: Mechanical
Sub Category: Ventilation
Sub Category 2: Extract Fan
```

## Simple no-Risk-Assessment test

Use:

| Field | Value |
|---|---|
| Job Complete | `Yes` |
| Parts Required | `No` |
| Blades Cleaned | `Yes` |
| Internal Louvre Cleaned | `Yes` |
| Electrical Connection Check | `Yes` |

`Parts Required = Yes` triggers the existing Risk Assessment workflow, so use `No` for this first Engineer/date test.

Then:

1. Select an Extract Fan asset.
2. Select/fill Site Contact and Client's Name.
3. Confirm Engineer's Name is a dropdown.
4. Select a different Engineer.
5. Submit.

## Network checks

Site Check must retain:

```text
type     = Inspection
subType  = Plant and Equipment Inspection
category = Extract Fan Cleaning
status   = Done
```

Generic inspection must contain:

```text
siteId         = Site Check's site ID
engineer       = selected Engineer ID
inspectionDate = current UK date
signedDate     = current UK date
subType        = Extract Fan
category       = Extract Fan
```

## Pass criteria

- [ ] Correct Extract Fan assets listed
- [ ] Current UK date shown while Open
- [ ] Logged-in Engineer initially selected
- [ ] Different active site Engineer selectable
- [ ] Submission changes status to Done
- [ ] Done check reopens in Extract Fan Service Report
- [ ] Saved Engineer/date restored and read-only
- [ ] PDF uses selected Engineer/date

---

# Batch completion checklist

Do not move to the final batch until all four pass:

- [ ] Water Heater — PASS
- [ ] Water Chlorination — PASS
- [ ] Shower Head Cleaning — PASS
- [ ] Extract Fan — PASS
- [ ] `npm run build` — PASS
- [ ] No console error during submission/reopen
- [ ] No `map is not a function` application crash

If any one fails, keep the others as-is and report the exact form, field and Network response before changing the next batch.
