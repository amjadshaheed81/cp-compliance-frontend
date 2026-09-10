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
import { post } from "../../../../api";
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

const DEFAULT_FREQUENCY = "6-Monthly";
const FREQUENCIES = ["Daily", "Weekly", "Monthly", "6-Monthly", "Yearly"];

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
            Developer test helper. This is currently enabled for testing and creates a real Open Site Check using the normal
            Site Check data model, then opens the real inspection form.
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
        </DialogContent>
        <DialogActions>
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
            {isCreating ? "Creating..." : "Create & Open"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SiteCheckTestLauncher;
