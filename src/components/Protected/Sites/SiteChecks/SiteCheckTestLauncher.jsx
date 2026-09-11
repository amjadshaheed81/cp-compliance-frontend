import React, { useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
} from "@mui/material";
import { toast } from "react-toastify";
import { del, get, post, putMultiPartFormData } from "../../../../api";
import DatePicker from "../../../common/DatePicker";
import {
  calculateSiteCheckDueDateTime,
  formatSiteCheckDisplayDate,
  toSiteCheckDateOnly,
} from "../../../../utils/siteCheckRecurrence";
import { getUkLocalDateAsDate } from "./shared/siteCheckDateUtils";
import { getSiteCheckErrorMessage } from "./shared/siteCheckErrorMessage";
import {
  SITE_CHECK_TEST_TYPES,
  getSiteCheckTestType,
} from "./siteCheckTestTypes";
import { SITE_CHECK_HISTORY_TEST_BATCHES } from "./siteCheckTestBatches";

const DEFAULT_FREQUENCY = "6-Monthly";
const FREQUENCIES = ["Daily", "Weekly", "Monthly", "6-Monthly", "Yearly"];
const TEST_TRACKING_PREFIX = "cafm-site-check-test-launcher-v1";

const getTrackingKey = (siteId) => `${TEST_TRACKING_PREFIX}:${siteId}`;

const readTrackedRuns = (siteId) => {
  if (!siteId) return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(getTrackingKey(siteId)) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Unable to read Site Check test tracking data", error);
    return [];
  }
};

const writeTrackedRuns = (siteId, runs) => {
  if (!siteId) return;
  localStorage.setItem(getTrackingKey(siteId), JSON.stringify(runs || []));
};

const makeRunTag = (batchNumber) => `B${batchNumber}-${Date.now()}`;

const buildTestAssetRequest = (device, batchNumber, runTag) => ({
  assetId: null,
  assetName: `CAFM TEST B${batchNumber} - ${device.label} - ${runTag}`,
  manufacturer: "CAFM TEST",
  category: device.category,
  subCategory: device.subCategory || "",
  subCategory2: device.subCategory2 || "",
  subCategory3: device.subCategory3 || "",
  model: `History Batch ${batchNumber}`,
  serialNumber: `TEST-${runTag}-${device.key}`,
  relatedAssetId: null,
  folderId: null,
  patItem: false,
  pfpItem: false,
  doorItem: false,
  barcode: "",
  deviceId: "",
  position: "",
  floor: "",
  room: "",
  damperSize: device.damperSize ?? null,
});

const isActiveUser = (user) =>
  Boolean(user?.id) &&
  (!user?.status || String(user.status).toLowerCase() === "active");

const userLabel = (user) =>
  [
    user?.role,
    user?.name || user?.email,
    user?.email ? `(${user.email})` : "",
    user?.companyName ? `- ${user.companyName}` : "",
  ]
    .filter(Boolean)
    .join(" ");

const getDefaultUsers = (siteUsers = []) => {
  const activeUsers = [...siteUsers]
    .filter(isActiveUser)
    .sort((a, b) =>
      String(a?.name || a?.email || "").localeCompare(
        String(b?.name || b?.email || ""),
        undefined,
        { sensitivity: "base" }
      )
    );

  if (activeUsers.length === 0) {
    return { activeUsers, leadUserId: "", assistantUserId: "" };
  }

  return {
    activeUsers,
    leadUserId: String(activeUsers[0].id),
    assistantUserId: String((activeUsers[1] || activeUsers[0]).id),
  };
};

const SiteCheckTestLauncher = ({
  siteSelectedForGlobal,
  siteUsers = [],
  onCreated,
}) => {
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [testTypeKey, setTestTypeKey] = useState(
    "air-conditioning-service"
  );
  const [category, setCategory] = useState("Air Conditioning Service");
  const [startDate, setStartDate] = useState(getUkLocalDateAsDate());
  const [repeatFrequency, setRepeatFrequency] = useState(DEFAULT_FREQUENCY);
  const [leadUserId, setLeadUserId] = useState("");
  const [assistantUserId, setAssistantUserId] = useState("");
  const [createdHistoryTests, setCreatedHistoryTests] = useState([]);

  const selectedType = getSiteCheckTestType(testTypeKey);
  const { activeUsers, leadUserId: defaultLead, assistantUserId: defaultAssistant } =
    useMemo(() => getDefaultUsers(siteUsers), [siteUsers]);

  const requiresAssignees = selectedType?.requiresAssignees !== false;

  const dueDate = useMemo(
    () => calculateSiteCheckDueDateTime(startDate, repeatFrequency),
    [startDate, repeatFrequency]
  );

  useEffect(() => {
    if (!open) return;
    setLeadUserId(defaultLead);
    setAssistantUserId(defaultAssistant);
  }, [open, defaultLead, defaultAssistant]);

  useEffect(() => {
    if (!selectedType) return;
    setCategory(selectedType.category || "");
  }, [selectedType]);

  const resetDefaults = () => {
    const defaultType = getSiteCheckTestType("air-conditioning-service");
    setTestTypeKey(defaultType?.key || SITE_CHECK_TEST_TYPES[0]?.key || "");
    setCategory(defaultType?.category || SITE_CHECK_TEST_TYPES[0]?.category || "");
    setStartDate(getUkLocalDateAsDate());
    setRepeatFrequency(DEFAULT_FREQUENCY);
    setLeadUserId(defaultLead);
    setAssistantUserId(defaultAssistant);
  };

  const handleOpen = () => {
    resetDefaults();
    setCreatedHistoryTests([]);
    setOpen(true);
  };

  const handleClose = () => {
    if (isCreating) return;
    setOpen(false);
  };

  const selectedLead =
    activeUsers.find((user) => String(user.id) === String(leadUserId)) || null;
  const selectedAssistant =
    activeUsers.find((user) => String(user.id) === String(assistantUserId)) || null;

  const handleCreate = async () => {
    if (!siteSelectedForGlobal?.siteId) {
      toast.error("Please select a site before creating a test inspection.");
      return;
    }
    if (!selectedType) {
      toast.error("Please select an inspection type.");
      return;
    }
    if (!startDate) {
      toast.error("Start Date is required.");
      return;
    }
    if (!repeatFrequency || !dueDate) {
      toast.error("A valid repeat frequency is required.");
      return;
    }
    if (!category) {
      toast.error("Category is required for this test inspection.");
      return;
    }
    if (requiresAssignees && (!leadUserId || !assistantUserId)) {
      toast.error("Lead and Assistant are required for this test inspection.");
      return;
    }

    const body = {
      siteId: siteSelectedForGlobal.siteId,
      type: selectedType.type,
      subType: selectedType.subType,
      category,
      status: "Open",
      startDate: `${toSiteCheckDateOnly(startDate)}T00:00:00`,
      dueDate,
      repeatFrequency,
      ...(requiresAssignees
        ? {
            leadUserID: String(leadUserId),
            assistantUserID: String(assistantUserId),
          }
        : {}),
    };

    setIsCreating(true);
    try {
      const response = await post("/api/site-check/", body);
      const checkId = response?.data?.checkId;
      if (!checkId) {
        throw new Error("The test Site Check was created without returning a Check ID.");
      }

      rememberTrackedRun({
        runId: `single-${checkId}-${Date.now()}`,
        batchNumber: 0,
        batchLabel: `Single test - ${selectedType.label}`,
        siteId: siteSelectedForGlobal.siteId,
        createdAt: new Date().toISOString(),
        checks: [{ key: selectedType.key, label: selectedType.label, checkId }],
        assets: [],
      });

      toast.success(`Test inspection created (Check ID ${checkId}).`);
      setOpen(false);
      if (typeof onCreated === "function") {
        onCreated(checkId);
      }
    } catch (error) {
      toast.error(
        getSiteCheckErrorMessage(error, "Unable to create the test inspection.")
      );
    } finally {
      setIsCreating(false);
    }
  };

  const rememberTrackedRun = (run) => {
    const siteId = siteSelectedForGlobal?.siteId;
    if (!siteId || !run) return;
    const existing = readTrackedRuns(siteId);
    writeTrackedRuns(siteId, [...existing, run]);
  };

  const rollbackNewTestRun = async (checks = [], assets = []) => {
    const remainingChecks = [];
    const remainingAssets = [];

    for (const check of checks) {
      try {
        await del(`/api/site-check/check-id/${check.checkId}`);
      } catch (error) {
        remainingChecks.push(check);
      }
    }

    // These assets were created moments ago for an incomplete batch and no real
    // form was opened/submitted, so deleting only these exact IDs is safe.
    for (const asset of assets) {
      try {
        await del(`/api/site/assets/${asset.assetId}`);
      } catch (error) {
        remainingAssets.push(asset);
      }
    }

    return { remainingChecks, remainingAssets };
  };

  const handleCreateHistoryTestSet = async (batch) => {
    if (!siteSelectedForGlobal?.siteId) {
      toast.error("Please select a site before creating History test inspections.");
      return;
    }
    if (!batch?.number || !Array.isArray(batch?.testKeys)) {
      toast.error("The selected test batch is not configured correctly.");
      return;
    }
    if (!startDate) {
      toast.error("Start Date is required.");
      return;
    }
    if (!repeatFrequency || !dueDate) {
      toast.error("A valid repeat frequency is required.");
      return;
    }
    if (!leadUserId || !assistantUserId) {
      toast.error("Lead and Assistant are required for the History test set.");
      return;
    }

    const testTypes = batch.testKeys.map(getSiteCheckTestType);
    if (testTypes.some((item) => !item)) {
      toast.error(`Test Batch ${batch.number} is incomplete. No test data was created.`);
      return;
    }

    setIsCreating(true);
    setCreatedHistoryTests([]);

    const siteId = siteSelectedForGlobal.siteId;
    const runTag = makeRunTag(batch.number);
    const createdAssets = [];
    const createdChecks = [];

    try {
      // Create only the exact test devices required by the real forms in this
      // batch. All assets use the normal Create Asset API and are clearly named.
      for (const device of batch.devices || []) {
        const assetRequest = buildTestAssetRequest(
          device,
          batch.number,
          runTag
        );
        const multipart = new FormData();
        multipart.append("assetRequestString", JSON.stringify(assetRequest));

        const response = await putMultiPartFormData(
          `/api/site/${siteId}/assets`,
          multipart
        );
        const assetId = response?.data?.assetId;
        if (!assetId) {
          throw new Error(
            `Test device '${device.label}' was created without returning an Asset ID.`
          );
        }

        createdAssets.push({
          key: device.key,
          testTypeKey: device.testTypeKey,
          label: device.label,
          assetId,
          assetName: assetRequest.assetName,
        });
      }

      for (const testType of testTypes) {
        const body = {
          siteId,
          type: testType.type,
          subType: testType.subType,
          category: testType.category,
          status: "Open",
          startDate: `${toSiteCheckDateOnly(startDate)}T00:00:00`,
          dueDate,
          repeatFrequency,
          leadUserID: String(leadUserId),
          assistantUserID: String(assistantUserId),
        };

        const response = await post("/api/site-check/", body);
        const checkId = response?.data?.checkId;
        if (!checkId) {
          throw new Error(
            `${testType.label} was created without returning a Check ID.`
          );
        }

        const device = createdAssets.find(
          (item) => item.testTypeKey === testType.key
        );
        const result = {
          key: testType.key,
          label: testType.label,
          checkId,
          success: true,
          batchNumber: batch.number,
          device: device || null,
        };
        createdChecks.push(result);
      }

      rememberTrackedRun({
        runId: runTag,
        batchNumber: batch.number,
        batchLabel: batch.label,
        siteId,
        createdAt: new Date().toISOString(),
        checks: createdChecks.map(({ key, label, checkId }) => ({
          key,
          label,
          checkId,
        })),
        assets: createdAssets,
      });

      setCreatedHistoryTests(createdChecks);
      toast.success(
        `Test Batch ${batch.number} created: ${createdChecks.length} Site Checks and ${createdAssets.length} test devices.`
      );
    } catch (error) {
      const rollback = await rollbackNewTestRun(createdChecks, createdAssets);

      if (
        rollback.remainingChecks.length > 0 ||
        rollback.remainingAssets.length > 0
      ) {
        rememberTrackedRun({
          runId: `${runTag}-rollback`,
          batchNumber: batch.number,
          batchLabel: `${batch.label} (partial cleanup required)`,
          siteId,
          createdAt: new Date().toISOString(),
          checks: rollback.remainingChecks.map(({ key, label, checkId }) => ({
            key,
            label,
            checkId,
          })),
          assets: rollback.remainingAssets,
        });
      }

      toast.error(
        getSiteCheckErrorMessage(
          error,
          `Unable to create Test Batch ${batch.number}. Any newly-created Open test data was rolled back where possible.`
        )
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleCleanTestData = async () => {
    const siteId = siteSelectedForGlobal?.siteId;
    if (!siteId) {
      toast.error("Please select a site before cleaning test data.");
      return;
    }

    const runs = readTrackedRuns(siteId);
    if (runs.length === 0) {
      toast.info("There is no launcher-created test data tracked for this site.");
      return;
    }

    const confirmed = window.confirm(
      "Clean launcher test data for this site? Only OPEN Site Checks created by this launcher and their unused launcher-created devices will be deleted. Completed submissions, History and PDFs will be preserved."
    );
    if (!confirmed) return;

    setIsCreating(true);
    let deletedChecks = 0;
    let deletedAssets = 0;
    let preservedCompletedChecks = 0;
    let failedDeletes = 0;
    const retainedRuns = [];

    for (const run of runs) {
      const retainedChecks = [];

      for (const check of run.checks || []) {
        try {
          const current = await get(`/api/site-check/check-id/${check.checkId}`);
          const status = String(current?.status || "").toLowerCase();

          if (status === "open") {
            await del(`/api/site-check/check-id/${check.checkId}`);
            deletedChecks += 1;
          } else {
            // Never delete completed evidence through the developer cleanup.
            retainedChecks.push(check);
            preservedCompletedChecks += 1;
          }
        } catch (error) {
          if (error?.response?.status === 404) {
            // It has already been removed elsewhere, so drop it from tracking.
            continue;
          }
          retainedChecks.push(check);
          failedDeletes += 1;
        }
      }

      const retainedAssets = [];
      if (retainedChecks.length === 0) {
        for (const asset of run.assets || []) {
          try {
            await del(`/api/site/assets/${asset.assetId}`);
            deletedAssets += 1;
          } catch (error) {
            retainedAssets.push(asset);
            failedDeletes += 1;
          }
        }
      } else {
        // Keep the batch devices whenever a completed/failed-to-delete test
        // check remains. This prevents cleanup from removing a device that a
        // preserved test submission may still reference.
        retainedAssets.push(...(run.assets || []));
      }

      if (retainedChecks.length > 0 || retainedAssets.length > 0) {
        retainedRuns.push({
          ...run,
          checks: retainedChecks,
          assets: retainedAssets,
        });
      }
    }

    writeTrackedRuns(siteId, retainedRuns);
    setCreatedHistoryTests([]);
    setIsCreating(false);

    if (failedDeletes > 0) {
      toast.error(
        `Cleanup removed ${deletedChecks} Open checks and ${deletedAssets} test devices, but ${failedDeletes} item(s) could not be deleted. They remain tracked for another cleanup attempt.`
      );
    } else {
      toast.success(
        `Cleanup removed ${deletedChecks} Open checks and ${deletedAssets} unused test devices.${
          preservedCompletedChecks > 0
            ? ` ${preservedCompletedChecks} completed test check(s) were preserved with their History/PDF evidence.`
            : ""
        }`
      );
    }
  };

  const handleOpenCreatedTest = (checkId) => {
    if (!checkId || typeof onCreated !== "function") {
      return;
    }
    setOpen(false);
    onCreated(checkId);
  };

  return (
    <>
      <div className="col-md-2 col-sm-4 mt-2">
        <button
          type="button"
          style={{ width: "150px" }}
          className="btn btn-warning"
          onClick={handleOpen}
          title="Create a real Open Site Check for developer testing"
        >
          Site Check Test
        </button>
      </div>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle>Site Check Test</DialogTitle>
        <DialogContent dividers>
          <div className="alert alert-warning py-2 mb-3" role="alert">
            Developer test helper. This is currently enabled for testing and creates real test devices and Open Site Checks through the normal application APIs.
          </div>

          <div className="border rounded p-3 mb-3 bg-light">
            <div className="fw-bold mb-1">History regression test batches</div>
            <div className="small text-muted mb-2">
              Newest batch is always first. A batch creates its required CAFM TEST devices first, then creates the three real Open Site Checks.
            </div>
            <div className="d-flex flex-wrap gap-2">
              {SITE_CHECK_HISTORY_TEST_BATCHES.map((batch, index) => (
                <Button
                  key={batch.number}
                  variant={index === 0 ? "contained" : "outlined"}
                  onClick={() => handleCreateHistoryTestSet(batch)}
                  disabled={
                    isCreating ||
                    createdHistoryTests.length > 0 ||
                    !siteSelectedForGlobal?.siteId ||
                    activeUsers.length === 0
                  }
                  title={`Test Batch ${batch.number}: ${batch.label}. Creates ${batch.devices.length} required test device(s) and ${batch.testKeys.length} Site Checks.`}
                >
                  {isCreating
                    ? "Creating..."
                    : `Test Batch ${batch.number} — Create Checks + Devices`}
                </Button>
              ))}
            </div>
          </div>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <label htmlFor="site-check-test-type">Inspection Type</label>
              <select
                id="site-check-test-type"
                className="form-control form-select"
                value={testTypeKey}
                onChange={(event) => setTestTypeKey(event.target.value)}
              >
                {SITE_CHECK_TEST_TYPES.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Grid>

            <Grid item xs={12} md={6}>
              <label>Site</label>
              <input
                className="form-control"
                value={
                  siteSelectedForGlobal?.siteName ||
                  siteSelectedForGlobal?.name ||
                  siteSelectedForGlobal?.siteId ||
                  "No site selected"
                }
                readOnly
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={setStartDate}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <label htmlFor="site-check-test-frequency">Frequency</label>
              <select
                id="site-check-test-frequency"
                className="form-control form-select"
                value={repeatFrequency}
                onChange={(event) => setRepeatFrequency(event.target.value)}
              >
                {FREQUENCIES.map((frequency) => (
                  <option key={frequency} value={frequency}>
                    {frequency === "6-Monthly" ? "6 Monthly" : frequency}
                  </option>
                ))}
              </select>
            </Grid>

            {selectedType?.categoryOptions?.length > 0 && (
              <Grid item xs={12}>
                <label htmlFor="site-check-test-category">Category</label>
                <select
                  id="site-check-test-category"
                  className="form-control form-select"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  {selectedType.categoryOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </Grid>
            )}

            {requiresAssignees ? (
              <>
                <Grid item xs={12} md={6}>
                  <label>Lead</label>
                  <Autocomplete
                    options={activeUsers}
                    value={selectedLead}
                    onChange={(event, value) =>
                      setLeadUserId(value?.id ? String(value.id) : "")
                    }
                    getOptionLabel={userLabel}
                    isOptionEqualToValue={(option, value) =>
                      String(option?.id) === String(value?.id)
                    }
                    renderInput={(params) => (
                      <TextField {...params} size="small" placeholder="Select Lead" />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <label>Assistant</label>
                  <Autocomplete
                    options={activeUsers}
                    value={selectedAssistant}
                    onChange={(event, value) =>
                      setAssistantUserId(value?.id ? String(value.id) : "")
                    }
                    getOptionLabel={userLabel}
                    isOptionEqualToValue={(option, value) =>
                      String(option?.id) === String(value?.id)
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        placeholder="Select Assistant"
                      />
                    )}
                  />
                </Grid>
              </>
            ) : (
              <Grid item xs={12}>
                <div className="alert alert-info py-2 mb-0">
                  The normal Start New flow does not request Lead/Assistant for Air
                  Conditioning F-Gas Report, so this test helper leaves them unset too.
                </div>
              </Grid>
            )}

            <Grid item xs={12} md={6}>
              <label>Estimated Next Due</label>
              <input
                className="form-control"
                value={formatSiteCheckDisplayDate(dueDate)}
                readOnly
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <label>Route</label>
              <input
                className="form-control"
                value={`${selectedType?.type || ""} / ${
                  selectedType?.subType || ""
                } / ${category || ""}`}
                readOnly
              />
            </Grid>
          </Grid>

          {createdHistoryTests.length > 0 && (
            <div className="mt-3">
              <div className="fw-bold mb-2">History Test Set</div>
              {createdHistoryTests.map((item) => (
                <div
                  key={item.key}
                  className={`alert ${item.success ? "alert-success" : "alert-danger"} py-2 d-flex justify-content-between align-items-center`}
                >
                  <span>
                    <strong>{`Batch ${item.batchNumber}: ${item.label}`}</strong>
                    {item.success ? ` — Check ID ${item.checkId}` : ` — ${item.error}`}
                    {item.success && item.device && (
                      <span className="d-block small mt-1">
                        Test device: {item.device.assetName} (Asset ID {item.device.assetId})
                      </span>
                    )}
                    {item.success && !item.device && (
                      <span className="d-block small mt-1">
                        This form does not require a test device.
                      </span>
                    )}
                  </span>
                  {item.success && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleOpenCreatedTest(item.checkId)}
                    >
                      Open
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
        <DialogActions sx={{ flexWrap: "wrap", gap: 1 }}>
          <Button
            color="error"
            variant="outlined"
            onClick={handleCleanTestData}
            disabled={isCreating || !siteSelectedForGlobal?.siteId}
            title="Delete only launcher-created OPEN Site Checks and their unused launcher-created devices. Completed History/PDF evidence is preserved."
          >
            Clean Test Data
          </Button>
          <Button onClick={handleClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={
              isCreating ||
              !siteSelectedForGlobal?.siteId ||
              (requiresAssignees && activeUsers.length === 0)
            }
          >
            {isCreating ? "Creating..." : "Create Single & Open"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SiteCheckTestLauncher;
