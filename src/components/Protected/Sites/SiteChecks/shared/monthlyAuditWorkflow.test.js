import { del, get, post, postMultiPartFormData } from "../../../../../api";
import {
  completeMonthlyAuditSubmission, deleteMonthlyAuditImage, fillMonthlyQuestionForTest,
  getMonthlyAuditContext, getMonthlyAuditResponses, hydrateMonthlyQuestion,
  isMonthlyQuestionVisible, mayFillMonthlyAuditForTest, monthlyActionCandidates,
  monthlyQuestionAssets, monthlyQuestionComplete, monthlyResponseIssues,
  monthlyResponseRequest, newMonthlyAuditRequestId, openMonthlyAuditEarly, prepareMonthlyAuditSubmission,
  saveMonthlyAuditResponse, uploadMonthlyAuditPdf,
} from "./monthlyAuditWorkflow";

jest.mock("../../../../../api", () => ({
  del: jest.fn(), get: jest.fn(), post: jest.fn(), postMultiPartFormData: jest.fn(),
}));

const context = { checkId: 408, siteId: 296, periodToken: "period-1", status: "OPEN", canEdit: true, canTestFill: true };
const retryRequestId = "69ba8332-fd55-4a45-8b04-518e205e7045";
const assets = [
  { assetId: 12, category: "Electrical", subCategory: "Lighting", subCategory2: "Emergency" },
  { assetId: 123, category: "Electrical", subCategory: "Lighting", subCategory2: "Emergency" },
  { assetId: 124, category: "Electrical", subCategory: "Lighting", subCategory2: "Normal" },
  { assetId: 99, category: "Water", subCategory: "Tank" },
];
const question = {
  qid: 7, order: "1.1.1", question: "Inspect the lights", assetCategory: "Electrical,Lighting,Emergency",
  response: { checkId: 408, qid: 7, assets: "", faultassets: "12", position: "Failed in August", action: "Replace lamp", consequence: 2, likelihood: 3 },
  responseRevision: 4,
};
const actions = [
  { actionId: 50, siteId: 296, assetIds: [12], status: "Reported", observation: "Failed in August" },
  { actionId: 51, siteId: 296, taggedAsset: "123,124", status: "Reassessed" },
  { actionId: 52, siteId: 297, assetIds: [12], status: "Reported" },
  { actionId: 53, siteId: 296, assetIds: [12], status: "Completed" },
];

beforeEach(() => jest.clearAllMocks());

describe("Monthly Audit real site answers and existing fault choices", () => {
  test("Test Fill leaves a failed question unchanged so it cannot create an Action", () => {
    const original = { ...question, actionChoices: { 12: { mode: "EXISTING", actionId: 50 } } };
    const filled = fillMonthlyQuestionForTest(original, assets);
    expect(filled).toBe(original);
    expect(filled.response.assets).toBe("");
    expect(filled.response.faultassets).toBe("12");
    expect(filled.response.position).toBe("Failed in August");
    expect(filled.response.action).toBe("Replace lamp");
    expect(filled.response.consequence).toBe(2);
    expect(filled.actionChoices).toEqual(original.actionChoices);
    expect(original.response.assets).toBe("");
    expect(monthlyQuestionComplete(filled, assets)).toBe(false);
  });

  test("Test Fill never includes another category or duplicates an existing passing selection", () => {
    const filled = fillMonthlyQuestionForTest({ ...question, response: { assets: "123", faultassets: "" } }, assets);
    expect(filled.response.assets).toBe("123,12");
    expect(monthlyQuestionAssets(question, assets).map((asset) => asset.assetId)).toEqual([12, 123]);
  });

  test("completion requires the actual applicable asset IDs, not just matching counts", () => {
    expect(monthlyQuestionComplete({ ...question, response: { assets: "88,89", faultassets: "" } }, assets)).toBe(false);
    expect(monthlyQuestionComplete({ ...question, response: { assets: "12", faultassets: "12" } }, assets)).toBe(false);
    expect(monthlyQuestionComplete({ ...question, response: { assets: "12,123", faultassets: "12" } }, assets)).toBe(false);
    expect(monthlyQuestionComplete({ ...question, response: { assets: "12,123,999", faultassets: "" } }, assets)).toBe(false);
    expect(monthlyQuestionComplete({ ...question, order: "3.5.1", response: { assets: "12" } }, assets)).toBe(true);
  });

  test("deleted and hidden questions are not filled or required", () => {
    expect(isMonthlyQuestionVisible(question, [{ lovDesc: "1.1" }])).toBe(true);
    expect(isMonthlyQuestionVisible({ ...question, question: "DELETE this question" }, [{ lovDesc: "1.1" }])).toBe(false);
    expect(isMonthlyQuestionVisible(question, [{ lovDesc: "2.1" }])).toBe(false);
  });

  test("suggestions match exact asset and site and exclude completed Actions", () => {
    expect(monthlyActionCandidates(actions, "12", 296).map((action) => action.actionId)).toEqual([50]);
    expect(monthlyActionCandidates(actions, "123", 296).map((action) => action.actionId)).toEqual([51]);
    expect(monthlyActionCandidates(actions, "1", 296)).toEqual([]);
  });

  test("an existing fault is never selected automatically", () => {
    expect(monthlyResponseIssues(question, actions, 296)).toEqual([
      "Select an existing Action or choose a new fault for asset 12.",
    ]);
    expect(monthlyResponseIssues({ ...question, actionChoices: { 12: { mode: "EXISTING", actionId: 50 } } }, actions, 296)).toEqual([]);
  });

  test("mixed failures retain one Action relationship for each asset", () => {
    const mixed = { ...question,
      response: { ...question.response, faultassets: "12,123" },
      actionChoices: { 12: { mode: "EXISTING", actionId: 50 }, 123: { mode: "NEW" } },
    };
    const request = monthlyResponseRequest(mixed, { checkId: 408, periodToken: "period-1", requestId: retryRequestId });
    expect(request.actionChoices).toEqual([
      { assetId: 12, mode: "EXISTING", actionId: 50 }, { assetId: 123, mode: "NEW" },
    ]);
    expect(request.response.action).toBe("Replace lamp");
    expect(request.responseRevision).toBe(4);
    expect(request.requestId).toBe(retryRequestId);
    expect(request.response).not.toHaveProperty("actionId");
  });

  test("saved choices survive refresh including NEW decisions on partial questions", () => {
    const loaded = hydrateMonthlyQuestion(question, {
      response: { ...question.response, responseId: 227, status: "Open" }, revision: 5,
      actionLinks: [{ assetId: 12, actionId: 50 }],
      actionChoices: [{ assetId: 12, mode: "EXISTING", actionId: 50 }, { assetId: 123, mode: "NEW" }],
    });
    expect(loaded.actionChoices).toEqual({ 12: { mode: "EXISTING", actionId: 50 }, 123: { mode: "NEW" } });
    expect(loaded.responseRevision).toBe(5);
    expect(loaded.response.file).toBeNull();
    expect(loaded.dirty).toBe(false);
  });

  test("saving an adopted response retains its scalar file reference alongside new image uploads", () => {
    const savedFileReference = "saved/audits/408/original-evidence.jpg";
    const loaded = hydrateMonthlyQuestion(question, {
      response: { ...question.response, faultassets: "", file: savedFileReference }, revision: 5,
      actionLinks: [], actionChoices: [],
    });
    expect(loaded.response.file).toBeNull();
    expect(loaded.savedFileReference).toBe(savedFileReference);
    const filled = fillMonthlyQuestionForTest(loaded, assets);
    const pendingFile = new File(["image"], "new-evidence.png", { type: "image/png" });
    const edited = { ...filled, response: { ...filled.response, file: [pendingFile] } };
    const request = monthlyResponseRequest(edited, {
      checkId: 408, periodToken: "period-1", files: ["uploaded/new-evidence.png"],
    });
    expect(request.response.file).toBe(savedFileReference);
    expect(request.response.files).toEqual(["uploaded/new-evidence.png"]);
    expect(request.response).not.toHaveProperty("savedFileReference");
    expect(hydrateMonthlyQuestion(loaded, undefined).savedFileReference).toBeNull();
  });

  test("all-pass Test Fill sends no Action choices", () => {
    const filled = fillMonthlyQuestionForTest({ ...question, response: {} }, assets);
    expect(monthlyResponseRequest(filled, { checkId: 408, periodToken: "period-1" }).actionChoices).toEqual([]);
  });

  test.each([
    [{ email: "amjad.shaheed81@gmail.com" }, context, true],
    [{ email: "dan@example.test" }, context, false],
    [{ email: "amjad.shaheed81@gmail.com" }, { ...context, canEdit: false }, false],
    [{ email: "amjad.shaheed81@gmail.com" }, { ...context, canTestFill: false }, false],
  ])("Test Fill visibility respects email and server permissions", (user, current, expected) => {
    expect(mayFillMonthlyAuditForTest(user, current)).toBe(expected);
  });
});

describe("Monthly Audit period and submission API guards", () => {
  test.each([true, false])("request IDs remain canonical UUID v4 without randomUUID (getRandomValues: %s)", (hasRandomValues) => {
    const originalCrypto = Object.getOwnPropertyDescriptor(window, "crypto");
    const getRandomValues = jest.fn((bytes) => { bytes.fill(0xab); return bytes; });
    try {
      Object.defineProperty(window, "crypto", {
        configurable: true, value: hasRandomValues ? { getRandomValues } : undefined,
      });
      const requestId = newMonthlyAuditRequestId();
      expect(requestId).toHaveLength(36);
      expect(requestId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      if (hasRandomValues) expect(getRandomValues).toHaveBeenCalledTimes(1);
    } finally {
      if (originalCrypto) Object.defineProperty(window, "crypto", originalCrypto);
      else delete window.crypto;
    }
  });

  test("rejects context for the wrong check", async () => {
    get.mockResolvedValue({ ...context, checkId: 409 });
    await expect(getMonthlyAuditContext(408)).rejects.toThrow("could not be verified");
  });

  test("never hydrates responses from a different period", async () => {
    get.mockResolvedValue({ periodToken: "new-period", responses: [] });
    await expect(getMonthlyAuditResponses(408, "period-1")).rejects.toThrow("current audit period");
  });

  test("save confirmation must match the submitted question and period", async () => {
    const request = monthlyResponseRequest(question, { checkId: 408, periodToken: "period-1" });
    post.mockResolvedValue({ data: { periodToken: "period-1", response: { checkId: 408, qid: 8 }, revision: 5, actionLinks: [] } });
    await expect(saveMonthlyAuditResponse(408, request)).rejects.toThrow("could not be confirmed");
  });

  test("prepare preserves the actual date and original retry identity", async () => {
    post.mockResolvedValue({ data: { ...context, status: "SUBMITTING", sourceReference: "Audit-408-1" } });
    const request = { periodToken: "period-1", inspectionDate: "2026-01-31", requestId: retryRequestId };
    await prepareMonthlyAuditSubmission(408, request);
    expect(post).toHaveBeenCalledWith("/api/site-check/408/monthly-audit/submission/prepare", request);
  });

  test("PDF upload sends only the period, file and folder; server owns dates and reference", async () => {
    postMultiPartFormData.mockResolvedValue({ data: { ...context, status: "SUBMITTING", pdfStored: true } });
    await uploadMonthlyAuditPdf(408, "period-1", 22, new Blob(["PDF"]), "audit.pdf");
    const [url, body] = postMultiPartFormData.mock.calls[0];
    expect(url).toBe("/api/site-check/408/monthly-audit/pdf");
    expect([...body.keys()].sort()).toEqual(["file", "folderId", "periodToken"]);
    expect(body.get("file").name).toBe("audit.pdf");
    expect(body.get("periodToken")).toBe("period-1");
  });

  test("PDF upload rejects a response that has not confirmed storage", async () => {
    postMultiPartFormData.mockResolvedValue({ data: { ...context, pdfStored: false } });
    await expect(uploadMonthlyAuditPdf(408, "period-1", 22, new Blob(), "audit.pdf")).rejects.toThrow("could not be confirmed");
  });

  test("completion retries use the same source reference without another prepare or upload", async () => {
    post.mockResolvedValue({ data: { ...context, status: "SUBMITTED", historyId: 54, pdfStored: true } });
    const request = { periodToken: "period-1", sourceReference: "Audit-408-1" };
    await completeMonthlyAuditSubmission(408, request);
    expect(post).toHaveBeenCalledWith("/api/site-check/408/monthly-audit/submission/complete", request);
    expect(postMultiPartFormData).not.toHaveBeenCalled();
  });

  test("Admin early opening uses the shared period endpoint with no email parameter", async () => {
    post.mockResolvedValue({ data: { ...context, periodToken: "period-2" } });
    await openMonthlyAuditEarly(408, { periodToken: "period-1" });
    expect(post).toHaveBeenCalledWith("/api/site-check/408/monthly-audit/open-early", { periodToken: "period-1" });
  });

  test("image deletion carries the current period and response revision", async () => {
    await deleteMonthlyAuditImage(408, 6, "period-1", 4);
    expect(del).toHaveBeenCalledWith("/api/site-check/408/monthly-audit/responses/images/6?periodToken=period-1&responseRevision=4");
  });
});
