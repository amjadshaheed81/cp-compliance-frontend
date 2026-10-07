import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import Audit from "./Audit";
import { jsPDF } from "jspdf";
import { get, put } from "../../../../api";
import {
  completeMonthlyAuditSubmission, getMonthlyAuditActions, getMonthlyAuditContext, getMonthlyAuditResponses,
  openMonthlyAuditEarly, prepareMonthlyAuditSubmission, saveMonthlyAuditResponse,
  uploadMonthlyAuditPdf,
} from "./shared/monthlyAuditWorkflow";

jest.mock("react-redux", () => ({ connect: () => (component) => component }));
jest.mock("react-slick", () => ({ __esModule: true, default: ({ children }) => <div>{children}</div> }));
jest.mock("../../../../api", () => ({
  get: jest.fn(), post: jest.fn(), put: jest.fn(), del: jest.fn(),
  postMultiPartFormData: jest.fn(), putMultiPartFormData: jest.fn(), uploadSiteCheckDoc: jest.fn(),
}));
jest.mock("../../../../store/thunk/site", () => ({
  deleteUser: jest.fn(), getSites: jest.fn(), getUsers: jest.fn(), getSiteCheckAssets: jest.fn(), getSiteLayout: jest.fn(),
}));
jest.mock("react-toastify", () => ({ toast: { success: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn() } }));
jest.mock("./shared/monthlyAuditWorkflow", () => ({
  ...jest.requireActual("./shared/monthlyAuditWorkflow"),
  getMonthlyAuditContext: jest.fn(), getMonthlyAuditResponses: jest.fn(), getMonthlyAuditActions: jest.fn(async () => []),
  saveMonthlyAuditResponse: jest.fn(), prepareMonthlyAuditSubmission: jest.fn(),
  completeMonthlyAuditSubmission: jest.fn(), openMonthlyAuditEarly: jest.fn(), uploadMonthlyAuditPdf: jest.fn(),
}));

const mockPdfText = jest.fn();
jest.mock("jspdf", () => ({ jsPDF: jest.fn(() => ({
  setFontSize: jest.fn(), setFont: jest.fn(), splitTextToSize: (text) => [String(text)],
  getTextWidth: () => 10, setDrawColor: jest.fn(), line: jest.fn(), setFillColor: jest.fn(),
  rect: jest.fn(), addPage: jest.fn(), addImage: jest.fn(), text: mockPdfText,
  output: () => new Blob(["test pdf"], { type: "application/pdf" }),
})) }));

const baseContext = {
  checkId: 408, siteId: 296, periodToken: "period-1", generation: 1, status: "OPEN",
  siteName: "Test Site",
  checkHeader: { checkId: 408, siteId: 296, type: "Audit", subType: "Monthly Audit", category: "Verified category",
    leadUserID: 56, assistantUserID: 57, repeatFrequency: "Monthly", startDate: "2025-03-01T00:00:00", dueDate: "2026-11-07T00:00:00" },
  canEdit: true, canSubmit: true, canOpenEarly: false, canTestFill: true,
  carryForwardEnabled: false, nextCarryForwardEnabled: false, pdfStored: false,
};
const definition = { qid: 7, order: "1.1.1", question: "Inspect the lights", assetCategory: "Lighting" };
const initialState = { periodToken: "period-1", revision: 1, actionLinks: [], actionChoices: [],
  response: { checkId: 408, qid: 7, responseId: 227, assets: "12", faultassets: "", status: "Closed", images: [] } };
const baseProps = {
  checkId: 408, subType: "Monthly Audit", sasToken: "", getSiteCheckAssets: jest.fn(), getSiteLayout: jest.fn(),
  siteAssets: [{ assetId: 12, assetName: "Hall light", category: "Lighting" }],
  siteSelectedForGlobal: { siteId: 296, siteName: "Test Site" },
  siteCheck: { checkId: 408, siteId: 296, type: "Audit", subType: "Monthly Audit", repeatFrequency: "Monthly", startDate: "2025-03-01T00:00:00" },
  loggedInUserData: { id: 56, email: "amjad.shaheed81@gmail.com", role: "Admin" },
  managerList: [], onAuditSubmitted: jest.fn(),
};

let currentContext;
let states;
let errorSpy;
let headerActionTarget;

beforeEach(() => {
  jest.clearAllMocks();
  headerActionTarget = document.createElement("div");
  headerActionTarget.className = "site-check-workspace__context-actions";
  document.body.appendChild(headerActionTarget);
  jsPDF.mockImplementation(() => ({
    setFontSize: jest.fn(), setFont: jest.fn(), splitTextToSize: (text) => [String(text)],
    getTextWidth: () => 10, setDrawColor: jest.fn(), line: jest.fn(), setFillColor: jest.fn(),
    rect: jest.fn(), addPage: jest.fn(), addImage: jest.fn(), text: mockPdfText,
    output: () => new Blob(["test pdf"], { type: "application/pdf" }),
  }));
  getMonthlyAuditActions.mockResolvedValue([]);
  currentContext = { ...baseContext };
  states = [{ ...initialState, response: { ...initialState.response } }];
  // The inherited form has existing missing-key warnings; assertions below
  // concern its Monthly Audit lifecycle and recorded data.
  errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  get.mockImplementation(async (url) => {
    if (url === "/api/site/296/assets?siteCheckSummary=true") return { assets: baseProps.siteAssets };
    if (url === "/api/lov/SITE_CHECK_AUDIT_HEADER") return [{ lovDesc: "1.1", lovValue: "Lighting", attribite1: "monthly-inspection" }];
    if (url.includes("/assessment/questions/")) return [{ ...definition }];
    if (url === "/api/document/site/296/parent/folders") return { parentFolders: [{ id: 1, name: "6 - Log Books" }] };
    if (url === "/api/document/parent/1/folders?siteId=296") return { document: { childFolders: [{ id: 22, name: "Internal Monthly Audit" }] } };
    throw new Error(`Unexpected GET ${url}`);
  });
  getMonthlyAuditContext.mockImplementation(async () => ({ ...currentContext }));
  getMonthlyAuditResponses.mockImplementation(async () => states.map((state) => ({ ...state, response: { ...state.response } })));
  saveMonthlyAuditResponse.mockImplementation(async (checkId, request) => {
    const saved = { periodToken: request.periodToken, revision: request.responseRevision + 1,
      response: { ...request.response, responseId: 227, status: "Closed", images: [] }, actionLinks: [], actionChoices: request.actionChoices };
    states = [saved];
    return saved;
  });
  prepareMonthlyAuditSubmission.mockImplementation(async (checkId, request) => {
    currentContext = { ...currentContext, status: "SUBMITTING", canEdit: false,
      inspectionDate: request.inspectionDate, nextDueDate: "2026-02-28T00:00:00", sourceReference: "Audit-408-42" };
    return { ...currentContext };
  });
  uploadMonthlyAuditPdf.mockImplementation(async () => {
    currentContext = { ...currentContext, pdfStored: true };
    return { ...currentContext };
  });
  completeMonthlyAuditSubmission.mockImplementation(async () => {
    currentContext = { ...currentContext, status: "SUBMITTED", historyId: 54, pdfStored: true,
      canSubmit: false, canEdit: false, canOpenEarly: true, canTestFill: false };
    return { ...currentContext };
  });
  openMonthlyAuditEarly.mockImplementation(async () => {
    currentContext = { ...baseContext, periodToken: "period-2", generation: 2 };
    states = [];
    return { ...currentContext };
  });
});

afterEach(() => {
  errorSpy.mockRestore();
  headerActionTarget.remove();
});

test("successful Monthly submission uses prepared dates and disables Submit until the next period", async () => {
  render(<Audit {...baseProps} embedded earlyOpenActionTarget={headerActionTarget} />);
  const submit = await screen.findByRole("button", { name: "Submit audit" });
  await waitFor(() => expect(submit).toBeEnabled());
  fireEvent.change(screen.getByLabelText(/Inspection Date/), { target: { value: "2026-01-31" } });
  expect(screen.getByLabelText("Next Due Date")).toHaveValue("28/02/2026");
  fireEvent.click(submit);
  fireEvent.click(submit);
  await waitFor(() => expect(screen.getByRole("button", { name: "Submitted" })).toBeDisabled());
  expect(prepareMonthlyAuditSubmission).toHaveBeenCalledTimes(1);
  expect(prepareMonthlyAuditSubmission).toHaveBeenCalledWith(408, expect.objectContaining({
    periodToken: "period-1", inspectionDate: "2026-01-31",
  }));
  expect(uploadMonthlyAuditPdf).toHaveBeenCalledTimes(1);
  expect(completeMonthlyAuditSubmission).toHaveBeenCalledWith(408, {
    periodToken: "period-1", sourceReference: "Audit-408-42",
  });
  expect(mockPdfText.mock.calls.some(([text]) => text === "31-01-2026")).toBe(true);
  expect(mockPdfText.mock.calls.some(([text]) => text === "01-03-2025")).toBe(false);
  expect(put).not.toHaveBeenCalled();
  expect(screen.getByLabelText(/Inspection Date/)).toBeDisabled();
});

test("a refreshed completed audit remains Submitted with no second submit request", async () => {
  currentContext = { ...baseContext, status: "SUBMITTED", historyId: 54, canSubmit: false, canEdit: false,
    canTestFill: false, canOpenEarly: true, pdfStored: true, inspectionDate: "2026-10-07", nextDueDate: "2026-11-07" };
  render(<Audit {...baseProps} embedded earlyOpenActionTarget={headerActionTarget} />);
  await waitFor(() => expect(screen.getByRole("button", { name: "Submitted" })).toBeDisabled());
  expect(prepareMonthlyAuditSubmission).not.toHaveBeenCalled();
  expect(uploadMonthlyAuditPdf).not.toHaveBeenCalled();
});

test("retrying a partial submission with an existing PDF only completes History", async () => {
  currentContext = { ...baseContext, status: "SUBMITTING", canEdit: false, canTestFill: false,
    pdfStored: true, sourceReference: "Audit-408-42", inspectionDate: "2026-01-31", nextDueDate: "2026-02-28" };
  render(<Audit {...baseProps} embedded earlyOpenActionTarget={headerActionTarget} />);
  const retry = await screen.findByRole("button", { name: "Save report and History" });
  await waitFor(() => expect(retry).toBeEnabled());
  fireEvent.click(retry);
  await waitFor(() => expect(screen.getByRole("button", { name: "Submitted" })).toBeDisabled());
  expect(prepareMonthlyAuditSubmission).not.toHaveBeenCalled();
  expect(uploadMonthlyAuditPdf).not.toHaveBeenCalled();
  expect(completeMonthlyAuditSubmission).toHaveBeenCalledTimes(1);
});

test("an Admin other than Amjad can open early while Test Fill remains hidden", async () => {
  currentContext = { ...baseContext, status: "SUBMITTED", historyId: 54, canSubmit: false, canEdit: false,
    canTestFill: false, canOpenEarly: true, pdfStored: true, inspectionDate: "2026-10-07", nextDueDate: "2026-11-07" };
  render(<Audit {...baseProps} embedded earlyOpenActionTarget={headerActionTarget} loggedInUserData={{ id: 57, email: "dan@example.test", role: "Admin" }} />);
  const open = await screen.findByRole("button", { name: "Open audit early" });
  expect(screen.queryByRole("button", { name: "Fill test answers" })).not.toBeInTheDocument();
  fireEvent.click(open);
  const dialog = await screen.findByRole("dialog", { name: "Open Monthly Audit Early" });
  expect(openMonthlyAuditEarly).not.toHaveBeenCalled();
  fireEvent.click(within(dialog).getByRole("button", { name: "Open Audit" }));
  await waitFor(() => expect(openMonthlyAuditEarly).toHaveBeenCalledWith(408, { periodToken: "period-1" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Submit audit" })).toBeDisabled());
  expect(screen.queryByRole("button", { name: "Open audit early" })).not.toBeInTheDocument();
  expect(saveMonthlyAuditResponse).not.toHaveBeenCalled();
});

test("Test Fill saves real all-pass answers and leaves Submit as a separate click", async () => {
  states = [];
  render(<Audit {...baseProps} embedded earlyOpenActionTarget={headerActionTarget} />);
  const fill = await screen.findByRole("button", { name: "Fill test answers" });
  await waitFor(() => expect(fill).toBeEnabled());
  fireEvent.click(fill);
  await waitFor(() => expect(saveMonthlyAuditResponse).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(screen.getByRole("button", { name: "Submit audit" })).toBeEnabled());
  expect(saveMonthlyAuditResponse).toHaveBeenCalledWith(408, expect.objectContaining({
    periodToken: "period-1", response: expect.objectContaining({ assets: "12", qid: 7 }), actionChoices: [],
  }));
  expect(prepareMonthlyAuditSubmission).not.toHaveBeenCalled();
  expect(openMonthlyAuditEarly).not.toHaveBeenCalled();
  expect(screen.getByLabelText("Asset OK")).toBeEnabled();
});

test("a failed upload leaves a recoverable pending submission without re-enabling answer edits", async () => {
  uploadMonthlyAuditPdf.mockRejectedValueOnce(new Error("Storage is temporarily unavailable"));
  render(<Audit {...baseProps} embedded earlyOpenActionTarget={headerActionTarget} />);
  const submit = await screen.findByRole("button", { name: "Submit audit" });
  await waitFor(() => expect(submit).toBeEnabled());
  fireEvent.click(submit);
  const retry = await screen.findByRole("button", { name: "Save report and History" });
  await waitFor(() => expect(retry).toBeEnabled());
  expect(screen.getByLabelText(/Inspection Date/)).toBeDisabled();
  expect(screen.getByText("Storage is temporarily unavailable")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Open audit early" })).not.toBeInTheDocument();
  expect(completeMonthlyAuditSubmission).not.toHaveBeenCalled();
  fireEvent.click(retry);
  await waitFor(() => expect(screen.getByRole("button", { name: "Submitted" })).toBeDisabled());
  expect(prepareMonthlyAuditSubmission).toHaveBeenCalledTimes(1);
});

test("a newer period reloads fresh answers before exposing its token to any save", async () => {
  render(<Audit {...baseProps} embedded earlyOpenActionTarget={headerActionTarget} />);
  const submit = await screen.findByRole("button", { name: "Submit audit" });
  await waitFor(() => expect(submit).toBeEnabled());
  currentContext = { ...baseContext, periodToken: "period-2", generation: 2 };
  states = [];
  fireEvent.click(submit);
  await waitFor(() => expect(screen.getByText(/A new audit period has already opened/)).toBeInTheDocument());
  expect(prepareMonthlyAuditSubmission).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Submit audit" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Fill test answers" }));
  await waitFor(() => expect(saveMonthlyAuditResponse).toHaveBeenCalledWith(408, expect.objectContaining({
    periodToken: "period-2", responseRevision: 0, response: expect.objectContaining({ responseId: null }),
  })));
});

test("failed site-asset loading blocks Fill and Submit instead of using stale global assets", async () => {
  const regularGet = get.getMockImplementation();
  get.mockImplementation(async (url) => {
    if (url === "/api/site/296/assets?siteCheckSummary=true") throw new Error("Assets could not be loaded");
    return regularGet(url);
  });
  render(<Audit {...baseProps} embedded earlyOpenActionTarget={headerActionTarget} />);
  await screen.findByText("Assets could not be loaded");
  expect(screen.queryByRole("button", { name: "Fill test answers" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Submit audit" })).toBeDisabled();
  expect(saveMonthlyAuditResponse).not.toHaveBeenCalled();
});

test("retrying a failed question save preserves its request ID and response revision", async () => {
  saveMonthlyAuditResponse.mockRejectedValueOnce(new Error("Connection lost while saving"));
  render(<Audit {...baseProps} embedded earlyOpenActionTarget={headerActionTarget} />);
  await waitFor(() => expect(screen.getByRole("button", { name: "Submit audit" })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", { name: /1.1.1 Inspect the lights/ }));
  const save = await screen.findByRole("button", { name: "Save & Continue" });
  fireEvent.click(save);
  await screen.findByText("Connection lost while saving");
  await waitFor(() => expect(screen.getByRole("button", { name: "Save & Continue" })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", { name: "Save & Continue" }));
  await waitFor(() => expect(saveMonthlyAuditResponse).toHaveBeenCalledTimes(2));
  expect(saveMonthlyAuditResponse.mock.calls[0][1]).toEqual(saveMonthlyAuditResponse.mock.calls[1][1]);
  await waitFor(() => expect(screen.getByRole("button", { name: "Save & Continue" })).toBeEnabled());
});

test("an unreadable saved photo blocks report completion and names the question without leaking its URL", async () => {
  states = [{ ...initialState, actionLinks: [{ assetId: 12, actionId: 50 }],
    response: { ...initialState.response, assets: "", faultassets: "12", position: "Lamp failed", action: "Replace lamp", consequence: 1, likelihood: 1,
      images: [{ imageId: 6, imageUrl: "https://example.test/photo.jpg?secret=credential" }] } }];
  render(<Audit {...baseProps} embedded earlyOpenActionTarget={headerActionTarget} />);
  const submit = await screen.findByRole("button", { name: "Submit audit" });
  await waitFor(() => expect(submit).toBeEnabled());
  fireEvent.click(submit);
  const message = await screen.findByText(/Photo 6 for question 1.1.1 could not be loaded into the report/);
  expect(message.textContent).not.toContain("credential");
  expect(uploadMonthlyAuditPdf).not.toHaveBeenCalled();
  expect(completeMonthlyAuditSubmission).not.toHaveBeenCalled();
  expect(screen.queryByRole("button", { name: "Open audit early" })).not.toBeInTheDocument();
});

test("Test Fill skips an existing partial failure even when completing it would create a new Action", async () => {
  const regularGet = get.getMockImplementation();
  get.mockImplementation(async (url) => {
    if (url.includes("/assessment/questions/")) return [{ ...definition }, { ...definition, qid: 8, order: "1.1.2" }];
    if (url === "/api/site/296/assets?siteCheckSummary=true") return {
      assets: [...baseProps.siteAssets, { assetId: 13, category: "Lighting", assetName: "Second light" }],
    };
    return regularGet(url);
  });
  states = [{ ...initialState, actionLinks: [], actionChoices: [{ assetId: 12, mode: "NEW" }],
    response: { ...initialState.response, status: "Open", assets: "", faultassets: "12", position: "Existing fault notes",
      action: "Replace lamp", consequence: 1, likelihood: 1 } }];
  render(<Audit {...baseProps} embedded earlyOpenActionTarget={headerActionTarget} />);
  const fill = await screen.findByRole("button", { name: "Fill test answers" });
  await waitFor(() => expect(fill).toBeEnabled());
  fireEvent.click(fill);
  await screen.findByText(/Existing failures were left unchanged: question\(s\) 1.1.1/);
  expect(saveMonthlyAuditResponse).toHaveBeenCalledTimes(1);
  expect(saveMonthlyAuditResponse.mock.calls[0][1].response.qid).toBe(8);
  expect(saveMonthlyAuditResponse.mock.calls[0][1].actionChoices).toEqual([]);
  expect(prepareMonthlyAuditSubmission).not.toHaveBeenCalled();
});

test("Monthly PDF and date preview use authoritative metadata despite stale parent and global site props", async () => {
  render(<Audit {...baseProps} embedded earlyOpenActionTarget={headerActionTarget}
    siteSelectedForGlobal={{ siteId: 999, siteName: "Wrong global site" }}
    siteCheck={{ ...baseProps.siteCheck, category: "Wrong category", repeatFrequency: "Yearly", leadUserID: 99 }}
    managerList={[{ id: 56, name: "Verified lead" }, { id: 99, name: "Wrong lead" }]} />);
  const submit = await screen.findByRole("button", { name: "Submit audit" });
  await waitFor(() => expect(submit).toBeEnabled());
  fireEvent.change(screen.getByLabelText(/Inspection Date/), { target: { value: "2026-01-31" } });
  expect(screen.getByLabelText("Next Due Date")).toHaveValue("28/02/2026");
  fireEvent.click(submit);
  await waitFor(() => expect(screen.getByRole("button", { name: "Submitted" })).toBeDisabled());
  const report = mockPdfText.mock.calls.map(([text]) => text).join("\n");
  expect(report).toContain("Test Site");
  expect(report).toContain("Verified category");
  expect(report).toContain("Verified lead");
  expect(report).not.toContain("Wrong global site");
  expect(report).not.toContain("Wrong category");
  expect(report).not.toContain("Wrong lead");
  expect(report).not.toContain("Yearly");
});


const useSubmittedAudit = (overrides = {}) => {
  currentContext = { ...baseContext, status: "SUBMITTED", historyId: 54,
    canSubmit: false, canEdit: false, canTestFill: false, canOpenEarly: true,
    pdfStored: true, inspectionDate: "2026-10-07", nextDueDate: "2026-11-07", ...overrides };
};

const reviewEarlyOpening = async () => {
  const button = await screen.findByRole("button", { name: "Open audit early" });
  await waitFor(() => expect(button).toBeEnabled());
  fireEvent.click(button);
  return screen.findByRole("dialog", { name: "Open Monthly Audit Early" });
};

test("Monthly Audit uses one Open Early button in the workspace header, not inside the form", async () => {
  useSubmittedAudit();
  const { container } = render(<Audit {...baseProps} embedded earlyOpenActionTarget={headerActionTarget} />);
  const button = await screen.findByRole("button", { name: "Open audit early" });
  expect(headerActionTarget).toContainElement(button);
  expect(button).toHaveClass("site-check-workspace__early-button");
  expect(button).toHaveTextContent("Open Early");
  expect(container).not.toContainElement(button);
  expect(screen.queryByText("Open next audit early")).not.toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(openMonthlyAuditEarly).not.toHaveBeenCalled();
});

test("Cancel dismisses the early-opening dialog without saving or resetting anything", async () => {
  useSubmittedAudit();
  render(<Audit {...baseProps} embedded earlyOpenActionTarget={headerActionTarget} />);
  const dialog = await reviewEarlyOpening();
  expect(within(dialog).getByText("Monthly")).toBeInTheDocument();
  expect(within(dialog).getByText("07-11-2026")).toBeInTheDocument();
  expect(within(dialog).getByText(/Blank answers/)).toBeInTheDocument();
  // Monthly Audit's opening endpoint has no planned-date parameter.
  expect(within(dialog).queryByLabelText("Planned Inspection Date")).not.toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(openMonthlyAuditEarly).not.toHaveBeenCalled();
  expect(saveMonthlyAuditResponse).not.toHaveBeenCalled();
  expect(prepareMonthlyAuditSubmission).not.toHaveBeenCalled();
});

test("the dialog displays the next-period policy, not the submitted period's previous policy", async () => {
  useSubmittedAudit({ carryForwardEnabled: false, nextCarryForwardEnabled: true });
  render(<Audit {...baseProps} embedded earlyOpenActionTarget={headerActionTarget} />);
  const dialog = await reviewEarlyOpening();
  expect(within(dialog).getByText(/Previous answers for review/)).toBeInTheDocument();
  expect(within(dialog).getByText(/Previous photos are not copied into the new audit/)).toBeInTheDocument();
});

test("a settings change during confirmation must be reviewed before an opening request", async () => {
  useSubmittedAudit();
  render(<Audit {...baseProps} embedded earlyOpenActionTarget={headerActionTarget} />);
  const dialog = await reviewEarlyOpening();
  currentContext = { ...currentContext, nextCarryForwardEnabled: true };
  fireEvent.click(within(dialog).getByRole("button", { name: "Open Audit" }));
  await within(dialog).findByText(/The audit settings have changed/);
  expect(within(dialog).getByText(/Previous answers for review/)).toBeInTheDocument();
  expect(openMonthlyAuditEarly).not.toHaveBeenCalled();
  await waitFor(() => expect(within(dialog).getByRole("button", { name: "Open Audit" })).toBeEnabled());
  fireEvent.click(within(dialog).getByRole("button", { name: "Open Audit" }));
  await waitFor(() => expect(openMonthlyAuditEarly).toHaveBeenCalledTimes(1));
});

test("a stale dialog cannot open an audit period created in another tab", async () => {
  useSubmittedAudit();
  render(<Audit {...baseProps} embedded earlyOpenActionTarget={headerActionTarget} />);
  const dialog = await reviewEarlyOpening();
  currentContext = { ...baseContext, periodToken: "period-created-elsewhere" };
  fireEvent.click(within(dialog).getByRole("button", { name: "Open Audit" }));
  await within(dialog).findByText(/This audit can no longer be opened from this dialog/);
  expect(openMonthlyAuditEarly).not.toHaveBeenCalled();
  expect(saveMonthlyAuditResponse).not.toHaveBeenCalled();
});

test("the server message remains in the confirmation dialog if early opening fails", async () => {
  useSubmittedAudit();
  openMonthlyAuditEarly.mockRejectedValueOnce({ response: { data: { message: "History PDF is not available" } } });
  render(<Audit {...baseProps} embedded earlyOpenActionTarget={headerActionTarget} />);
  const dialog = await reviewEarlyOpening();
  fireEvent.click(within(dialog).getByRole("button", { name: "Open Audit" }));
  await within(dialog).findByText("History PDF is not available");
  await waitFor(() => expect(within(dialog).getByRole("button", { name: "Open Audit" })).toBeEnabled());
  expect(within(dialog).getByRole("button", { name: "Cancel" })).toBeEnabled();
  expect(baseProps.onAuditSubmitted).not.toHaveBeenCalled();
});

test("opening disables dialog controls and does not allow double-confirm requests", async () => {
  useSubmittedAudit();
  let release;
  const normalOpen = openMonthlyAuditEarly.getMockImplementation();
  openMonthlyAuditEarly.mockImplementationOnce(() => new Promise((resolve) => { release = async () => resolve(await normalOpen()); }));
  render(<Audit {...baseProps} embedded earlyOpenActionTarget={headerActionTarget} />);
  const dialog = await reviewEarlyOpening();
  const confirm = within(dialog).getByRole("button", { name: "Open Audit" });
  fireEvent.click(confirm);
  fireEvent.click(confirm);
  await waitFor(() => expect(openMonthlyAuditEarly).toHaveBeenCalledTimes(1));
  expect(within(dialog).getByRole("button", { name: "Opening..." })).toBeDisabled();
  expect(within(dialog).getByRole("button", { name: "Cancel" })).toBeDisabled();
  await release();
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
});

test("early opening works while the form tab is hidden and notifies the parent to show the Form tab", async () => {
  useSubmittedAudit();
  const onAuditOpened = jest.fn();
  render(<div style={{ display: "none" }}><Audit {...baseProps} embedded
    earlyOpenActionTarget={headerActionTarget} onAuditOpened={onAuditOpened} /></div>);
  const dialog = await reviewEarlyOpening();
  expect(dialog).toBeVisible();
  fireEvent.click(within(dialog).getByRole("button", { name: "Open Audit" }));
  await waitFor(() => expect(onAuditOpened).toHaveBeenCalledTimes(1));
  expect(baseProps.onAuditSubmitted).not.toHaveBeenCalled();
});

test("unmounting a check removes both its header button and its open dialog", async () => {
  useSubmittedAudit();
  const { unmount } = render(<Audit {...baseProps} embedded earlyOpenActionTarget={headerActionTarget} />);
  await reviewEarlyOpening();
  unmount();
  expect(headerActionTarget).toBeEmptyDOMElement();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("a non-Admin cannot see an early-open button when the server withholds permission", async () => {
  useSubmittedAudit({ canOpenEarly: false });
  render(<Audit {...baseProps} embedded earlyOpenActionTarget={headerActionTarget}
    loggedInUserData={{ id: 57, email: "manager@example.test", role: "Manager" }} />);
  await waitFor(() => expect(screen.getByRole("button", { name: "Submitted" })).toBeDisabled());
  expect(headerActionTarget).toBeEmptyDOMElement();
  expect(screen.queryByRole("button", { name: "Open audit early" })).not.toBeInTheDocument();
});

test("the legacy detail route renders into the supplied Frequency-area slot", async () => {
  useSubmittedAudit();
  render(<Audit {...baseProps} earlyOpenActionTarget={headerActionTarget} />);
  const button = await screen.findByRole("button", { name: "Open audit early" });
  expect(headerActionTarget).toContainElement(button);
  expect(button).toHaveTextContent("Open Monthly Audit Early");
  expect(button).not.toHaveClass("site-check-workspace__early-button");
  expect(await reviewEarlyOpening()).toBeInTheDocument();
});
