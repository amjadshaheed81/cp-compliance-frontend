import { getPdfFromUrl as getHistoryBlob, post } from "../../../../../api";

const positiveId = (value, label) => {
  const parsed = Number(value);
  if (
    !["number", "string"].includes(typeof value) ||
    !Number.isSafeInteger(parsed) ||
    parsed <= 0
  ) {
    throw new Error(`A valid ${label} is required for Monthly Audit History.`);
  }
  return parsed;
};

const waitForRetry = () => new Promise((resolve) => setTimeout(resolve, 500));

const mayRetry = (error) => {
  const status = error?.response?.status;
  return !status || status === 408 || status === 429 || (status >= 500 && status < 600);
};

// Retry only this History request, using the original PDF reference. A lost
// response must not cause another PDF upload or another audit submission.
export const recordMonthlyAuditHistory = async ({ checkId, sourceReference }) => {
  const parsedCheckId = positiveId(checkId, "Site Check ID");
  const reference = typeof sourceReference === "string" ? sourceReference.trim() : "";
  if (!reference) {
    throw new Error("A PDF source reference is required to save Monthly Audit History.");
  }

  let response;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      response = await post(`/api/site-check/${parsedCheckId}/history/monthly-audit`, {
        sourceReference: reference,
      });
      break;
    } catch (error) {
      if (attempt === 1 || !mayRetry(error)) throw error;
      await waitForRetry();
    }
  }

  if (![200, 201].includes(response?.status)) {
    throw new Error("Monthly Audit History did not return a saved record.");
  }
  const history = response?.data;
  positiveId(history?.historyId, "History record ID");
  if (Number(history?.checkId) !== parsedCheckId) {
    throw new Error("History returned a record for a different Site Check.");
  }
  if (history?.sourceReference !== reference) {
    throw new Error("History returned a different PDF source reference.");
  }
  if (history?.snapshotAvailable !== true) {
    throw new Error("The PDF is linked, but the saved audit data was not confirmed in History.");
  }
  positiveId(history?.snapshotSchemaVersion, "saved audit data version");
  return history;
};

export const downloadMonthlyAuditHistorySnapshot = async ({
  checkId,
  historyId,
  snapshotSchemaVersion,
  sourceReference,
}) => {
  const parsedCheckId = positiveId(checkId, "Site Check ID");
  const parsedHistoryId = positiveId(historyId, "History record ID");
  const version = positiveId(snapshotSchemaVersion, "saved audit data version");
  const reference = typeof sourceReference === "string" ? sourceReference.trim() : "";
  if (!reference) {
    throw new Error("A PDF source reference is required to verify Monthly Audit History.");
  }
  // This existing authenticated API helper returns a Blob for any URL.
  // Export the original response bytes: parsing and reserializing the snapshot
  // would round Java Long values that exceed JavaScript's safe integer range.
  const blob = await getHistoryBlob(
    `/api/site-check/${parsedCheckId}/history/${parsedHistoryId}/snapshot`
  );
  let snapshot;
  try {
    if (!(blob instanceof Blob)) throw new Error("A stored JSON file was not returned.");
    snapshot = JSON.parse(await blob.text());
  } catch {
    throw new Error("The saved audit data could not be verified. Please reload History and try again.");
  }
  if (
    !snapshot ||
    typeof snapshot !== "object" ||
    Array.isArray(snapshot) ||
    snapshot.schemaVersion !== version ||
    snapshot.snapshotType !== "MONTHLY_AUDIT" ||
    Number(snapshot.siteCheck?.checkId) !== parsedCheckId ||
    snapshot.submission?.sourceReference !== reference
  ) {
    throw new Error("The saved audit data could not be verified. Please reload History and try again.");
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  try {
    link.href = url;
    link.download = `Monthly_Audit_${parsedCheckId}_History_${parsedHistoryId}.json`;
    document.body.appendChild(link);
    link.click();
  } finally {
    link.remove();
    // Give the browser time to start reading the download before releasing it.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
};
