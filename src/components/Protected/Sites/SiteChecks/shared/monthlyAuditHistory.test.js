import { getPdfFromUrl, post } from "../../../../../api";
import {
  downloadMonthlyAuditHistorySnapshot,
  recordMonthlyAuditHistory,
} from "./monthlyAuditHistory";

jest.mock("../../../../../api", () => ({ getPdfFromUrl: jest.fn(), post: jest.fn() }));

const request = { checkId: 123, sourceReference: "Audit-123-20261006" };
const saved = {
  historyId: 456,
  ...request,
  snapshotAvailable: true,
  snapshotSchemaVersion: 1,
};

describe("Monthly Audit History save verification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("confirms the exact saved-data History row returned in an Axios response", async () => {
    post.mockResolvedValue({ status: 201, data: saved });
    await expect(recordMonthlyAuditHistory(request)).resolves.toEqual(saved);
    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith("/api/site-check/123/history/monthly-audit", {
      sourceReference: request.sourceReference,
    });
  });

  test("retries a lost response once with the same reference, without any other operation", async () => {
    post.mockRejectedValueOnce(new Error("Network connection lost"));
    post.mockResolvedValueOnce({ status: 200, data: saved });
    const pending = recordMonthlyAuditHistory(request);
    expect(post).toHaveBeenCalledTimes(1);
    await expect(pending).resolves.toEqual(saved);
    expect(post).toHaveBeenCalledTimes(2);
    expect(post.mock.calls[1]).toEqual(post.mock.calls[0]);
    expect(getPdfFromUrl).not.toHaveBeenCalled();
  });

  test("stops after two transient failures and propagates the failure", async () => {
    const failure = { response: { status: 503 }, message: "Unavailable" };
    post.mockRejectedValue(failure);
    await expect(recordMonthlyAuditHistory(request)).rejects.toBe(failure);
    expect(post).toHaveBeenCalledTimes(2);
  });

  test.each([400, 401, 403, 404, 409, 422])("does not retry permanent HTTP %s failures", async (status) => {
    const failure = { response: { status } };
    post.mockRejectedValue(failure);
    await expect(recordMonthlyAuditHistory(request)).rejects.toBe(failure);
    expect(post).toHaveBeenCalledTimes(1);
  });

  test.each([
    { historyId: null },
    { checkId: 999 },
    { sourceReference: "another-submission" },
    { snapshotAvailable: false },
    { snapshotAvailable: undefined },
    { snapshotSchemaVersion: null },
    { snapshotSchemaVersion: 0 },
    { snapshotSchemaVersion: 1.5 },
  ])("rejects an unverified or PDF-only row: %j", async (difference) => {
    post.mockResolvedValue({ status: 200, data: { ...saved, ...difference } });
    await expect(recordMonthlyAuditHistory(request)).rejects.toThrow();
    // A successful response with missing data is not permission to backfill/re-submit.
    expect(post).toHaveBeenCalledTimes(1);
  });

  test.each([
    { status: 204, data: null },
    { status: 202, data: saved },
    saved,
  ])("rejects a response that does not confirm a saved row", async (response) => {
    post.mockResolvedValue(response);
    await expect(recordMonthlyAuditHistory(request)).rejects.toThrow();
    expect(post).toHaveBeenCalledTimes(1);
  });

  test.each([
    { checkId: 0 },
    { checkId: -1 },
    { checkId: "invalid" },
    { checkId: true },
    { sourceReference: " " },
    { sourceReference: null },
  ])("rejects invalid request data before calling the API: %j", async (difference) => {
    await expect(recordMonthlyAuditHistory({ ...request, ...difference })).rejects.toThrow();
    expect(post).not.toHaveBeenCalled();
  });
});

describe("Stored Monthly Audit data download", () => {
  const jsonBlob = (rawText) => {
    const blob = new Blob([rawText], { type: "application/json;charset=utf-8" });
    // jsdom's Blob predates Blob.text(). Read its actual bytes for these tests.
    if (!blob.text) {
      blob.text = () => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(blob);
      });
    }
    return blob;
  };

  const snapshot = {
    schemaVersion: 1,
    snapshotType: "MONTHLY_AUDIT",
    siteCheck: { checkId: request.checkId },
    submission: { sourceReference: request.sourceReference },
    responses: [{ responseId: 789, response: "No", consequence: 0, file: null }],
  };
  let originalCreateObjectURL;
  let originalRevokeObjectURL;
  let click;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    originalCreateObjectURL = URL.createObjectURL;
    originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = jest.fn().mockReturnValue("blob:verified-history");
    URL.revokeObjectURL = jest.fn();
    click = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    click.mockRestore();
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  test("downloads authenticated stored JSON with a fixed filename and releases its URL", async () => {
    const originalBlob = jsonBlob(JSON.stringify(snapshot));
    getPdfFromUrl.mockResolvedValue(originalBlob);
    let downloadedName;
    click.mockImplementation(function () { downloadedName = this.download; });
    await downloadMonthlyAuditHistorySnapshot(saved);
    expect(getPdfFromUrl).toHaveBeenCalledWith("/api/site-check/123/history/456/snapshot");
    expect(post).not.toHaveBeenCalled();
    expect(URL.createObjectURL.mock.calls[0][0]).toBeInstanceOf(Blob);
    expect(URL.createObjectURL.mock.calls[0][0]).toBe(originalBlob);
    expect(URL.createObjectURL.mock.calls[0][0].type).toBe("application/json;charset=utf-8");
    expect(downloadedName).toBe("Monthly_Audit_123_History_456.json");
    expect(document.querySelector('a[download="Monthly_Audit_123_History_456.json"]')).toBeNull();
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1000);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:verified-history");
  });

  test("preserves original JSON bytes and integers beyond JavaScript's safe integer range", async () => {
    const rawText = '{\n "schemaVersion":1,"snapshotType":"MONTHLY_AUDIT",' +
      '"siteCheck":{"checkId":123},"submission":{"sourceReference":"Audit-123-20261006"},' +
      '"responses":[{"responseId":9223372036854775807,"consequence":0,"file":null}]\n}\n';
    const originalBlob = jsonBlob(rawText);
    getPdfFromUrl.mockResolvedValue(originalBlob);
    await downloadMonthlyAuditHistorySnapshot(saved);
    const downloadedBlob = URL.createObjectURL.mock.calls[0][0];
    expect(downloadedBlob).toBe(originalBlob);
    expect(await downloadedBlob.text()).toBe(rawText);
    expect(await downloadedBlob.text()).toContain('"responseId":9223372036854775807');
  });

  test.each([
    null,
    [],
    "<html>Sign in</html>",
    { schemaVersion: 1 },
    { ...snapshot, schemaVersion: 2 },
    { ...snapshot, schemaVersion: "1" },
    { ...snapshot, snapshotType: "ANNUAL_AUDIT" },
    { ...snapshot, siteCheck: { checkId: 999 } },
    { ...snapshot, submission: { sourceReference: "another-submission" } },
  ])("does not download data whose identity/format is unverified: %j", async (body) => {
    getPdfFromUrl.mockResolvedValue(jsonBlob(JSON.stringify(body)));
    await expect(downloadMonthlyAuditHistorySnapshot(saved)).rejects.toThrow();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(click).not.toHaveBeenCalled();
  });

  test("rejects a non-JSON server response without downloading it", async () => {
    getPdfFromUrl.mockResolvedValue(jsonBlob("<html>Sign in</html>"));
    await expect(downloadMonthlyAuditHistorySnapshot(saved)).rejects.toThrow();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  test("does not fabricate/download data when a legacy snapshot is unavailable", async () => {
    const failure = { response: { status: 404 } };
    getPdfFromUrl.mockRejectedValue(failure);
    await expect(downloadMonthlyAuditHistorySnapshot(saved)).rejects.toBe(failure);
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
  });

  test("releases the temporary URL even if the browser cannot start the download", async () => {
    getPdfFromUrl.mockResolvedValue(jsonBlob(JSON.stringify(snapshot)));
    click.mockImplementation(() => { throw new Error("Download blocked"); });
    await expect(downloadMonthlyAuditHistorySnapshot(saved)).rejects.toThrow("Download blocked");
    jest.advanceTimersByTime(1000);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:verified-history");
    expect(document.querySelector('a[href="blob:verified-history"]')).toBeNull();
  });
});
