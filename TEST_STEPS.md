# CCTV Servicing & Inspection — UI Test Steps

## 1. Apply the files

Copy the package `src` folder over the front-end `src` folder after v1.0.0, v1.1.0 and v1.2.0 are already applied.

Only these files are replaced:

```text
src/components/Protected/Sites/SiteChecks/CctvAlarmCertificate.jsx
src/components/Protected/Sites/SiteChecks/UpdateSiteCheck.jsx
```

The shared Engineer/date files from v1.0.0 must already exist.

## 2. Build and start the front end

```powershell
cd C:\Path\To\frontend
nvm use 18.18.0
npm run build
npm start
```

## 3. Create the exact Site Check

Go to:

```text
Sites → Site Checks → Start New
```

Select:

| Field | Value |
|---|---|
| Type | `Inspection` |
| Sub Type | `Intruder Alarm` |
| Category | `CCTV Servicing & Inspection` |
| Start Date | Today |
| Lead | A user assigned to the selected site |
| Assistant | A user assigned to the selected site |
| Repeats | `None` or a test frequency |

Use exactly:

```text
CCTV Servicing & Inspection
```

Do not enter `CCTV Service`. That is the internal generic-inspection category and is not the UI routing category.

## 4. Required asset classification

The asset dropdown only shows assets with these exact values:

```text
Category: Electrical
Sub Category: CCTV
```

No Sub Category 2 value is required by this component.

If the CCTV device list is empty, check the test asset classification first.

## 5. Open-check test

Open the new check and confirm the heading is:

```text
CCTV Service Report
```

Confirm:

1. Status is `Open`.
2. The inspection Date shows today's UK date.
3. Engineer's Name is a dropdown.
4. Logged-in user is selected by default.
5. Other active engineers assigned to the Site Check site appear.
6. Select a different Engineer.

## 6. Use simple passing answers

To avoid the Risk Assessment path during the first test, use:

| Field | Test value |
|---|---|
| Job Complete | `Yes` |
| Parts Required | `No` |
| Image Quality Check | `Pass` |
| Lenses Cleaned | `Pass` |
| DVR Recording Check | `Pass` |
| Electrical Connection Check | `Pass` |

Also select or complete:

- CCTV device
- Site Contact
- Client's Name
- Job number/report fields where required for your normal process
- A different Engineer from the dropdown

Selecting a CCTV device is important because the PDF reads its manufacturer, model and location information.

## 7. Inspect the Network requests

Open Chrome DevTools:

```text
F12 → Network → Preserve log
```

Submit the report.

### Site Check request

Look for:

```text
PUT /api/site-check/{checkId}
```

The payload must retain:

```json
{
  "type": "Inspection",
  "subType": "Intruder Alarm",
  "category": "CCTV Servicing & Inspection",
  "status": "Done"
}
```

### Inspection request

Look for one of:

```text
POST /api/site-check/generic-inspection
PUT  /api/site-check/generic-inspection/{checkId}
```

Confirm:

```text
engineer       = selected Engineer ID
inspectionDate = current UK date
signedDate     = current UK date
siteId         = Site Check's own site ID
subType        = CCTV
category       = CCTV Service
```

The last two values are the existing internal generic-inspection values and are expected.

## 8. Reopen the Done check

After submission:

1. Find the same Site Check.
2. Confirm status is `Done`.
3. Reopen it.
4. Confirm it still opens `CCTV Service Report`.
5. Confirm the selected Engineer is displayed.
6. Confirm Engineer's Name is disabled.
7. Confirm the saved dates are displayed and disabled.
8. Confirm the current logged-in user has not replaced the selected Engineer.

## 9. Check the PDF

The generated certificate should show:

- Selected Engineer's name
- Current UK inspection date
- Current UK client/engineer signature dates
- Selected CCTV device details

The source looks for the document folder under:

```text
6 - Log Books
  → Electrical Management
    → Security Systems
      → CCTV Service & Maintenance
```

## 10. Optional failure-path test

After the passing test works, create another Open CCTV check and set any one of these to `Fail`:

- Image Quality Check
- Lenses Cleaned
- DVR Recording Check
- Electrical Connection Check

Confirm:

1. The Risk Assessment appears.
2. Submission is blocked until an action is raised.
3. The chosen Engineer remains selected after the action is created.
4. The final submitted PDF still uses the chosen Engineer and current UK date.
