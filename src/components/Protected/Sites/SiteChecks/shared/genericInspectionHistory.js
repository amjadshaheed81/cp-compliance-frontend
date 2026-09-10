import { post } from "../../../../../api";

const waitForRetry = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export const recordGenericInspectionHistory = async ({
  checkId,
  inspectionRecordId,
  sourceReference,
}) => {
  const parsedCheckId = Number(checkId);
  const parsedInspectionRecordId = Number(inspectionRecordId);
  const normalisedSourceReference = String(sourceReference || "").trim();

  if (!Number.isInteger(parsedCheckId) || parsedCheckId <= 0) {
    throw new Error("A valid Site Check ID is required to record History.");
  }
  if (!Number.isInteger(parsedInspectionRecordId) || parsedInspectionRecordId <= 0) {
    throw new Error("A valid inspection record ID is required to record History.");
  }
  if (!normalisedSourceReference) {
    throw new Error("A PDF source reference is required to record History.");
  }

  let lastError;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await post(
        `/api/site-check/${parsedCheckId}/history/generic-inspection`,
        {
          sourceReference: normalisedSourceReference,
          inspectionRecordId: parsedInspectionRecordId,
        }
      );

      if (![200, 201, 204].includes(response?.status)) {
        throw new Error(
          `History API returned unexpected status ${response?.status ?? "unknown"}.`
        );
      }

      const history = response?.data;
      if (!history?.historyId) {
        throw new Error("History API returned success without a History record ID.");
      }
      if (Number(history.checkId) !== parsedCheckId) {
        throw new Error("History API returned a record for a different Site Check.");
      }
      if (history.sourceReference !== normalisedSourceReference) {
        throw new Error("History API returned a different PDF source reference.");
      }

      return history;
    } catch (error) {
      lastError = error;
      const status = error?.response?.status;

      if (attempt >= 2 || status === 401 || status === 403) {
        break;
      }

      await waitForRetry(500);
    }
  }

  throw lastError || new Error("History record could not be created.");
};
