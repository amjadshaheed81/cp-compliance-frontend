import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import Audit from "./Audit";
import { get } from "../../../../api";
import {
  getMonthlyAuditActions, getMonthlyAuditContext, getMonthlyAuditResponses, saveMonthlyAuditResponse,
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
  saveMonthlyAuditResponse: jest.fn(),
}));
jest.mock("jspdf", () => ({ jsPDF: jest.fn(() => ({
  setFontSize: jest.fn(), setFont: jest.fn(), splitTextToSize: (text) => [String(text)],
  getTextWidth: () => 10, setDrawColor: jest.fn(), line: jest.fn(), setFillColor: jest.fn(),
  rect: jest.fn(), addPage: jest.fn(), addImage: jest.fn(), text: jest.fn(),
  output: () => new Blob(["test pdf"], { type: "application/pdf" }),
})) }));

const baseContext = {
  checkId: 408, siteId: 296, periodToken: "period-1", generation: 1, status: "OPEN",
  siteName: "Test Site", hasSavedResponses: false,
  checkHeader: { checkId: 408, siteId: 296, type: "Audit", subType: "Monthly Audit", category: "Verified category",
    leadUserID: 56, assistantUserID: 57, repeatFrequency: "Monthly", startDate: "2026-10-08T00:00:00", dueDate: "2026-11-08T00:00:00" },
  canEdit: true, canSubmit: false, canOpenEarly: false, canTestFill: true,
  carryForwardEnabled: false, nextCarryForwardEnabled: false, pdfStored: false,
};
const definition = { qid: 7, order: "1.1.1", question: "Inspect the lights", assetCategory: "Lighting" };
const baseProps = {
  checkId: 408, subType: "Monthly Audit", sasToken: "", getSiteCheckAssets: jest.fn(), getSiteLayout: jest.fn(),
  siteAssets: [{ assetId: 12, assetName: "Hall light", category: "Lighting" }],
  siteSelectedForGlobal: { siteId: 296, siteName: "Test Site" },
  siteCheck: { checkId: 408, siteId: 296, type: "Audit", subType: "Monthly Audit", repeatFrequency: "Monthly", startDate: "2026-10-08T00:00:00" },
  loggedInUserData: { id: 56, email: "amjad.shaheed81@gmail.com", role: "Admin" },
  managerList: [], onAuditSubmitted: jest.fn(),
};

let currentContext;
let states;
let errorSpy;

beforeEach(() => {
  jest.clearAllMocks();
  currentContext = { ...baseContext };
  states = [];
  errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  get.mockImplementation(async (url) => {
    if (url === "/api/site/296/assets?siteCheckSummary=true") return { assets: baseProps.siteAssets };
    if (url === "/api/lov/SITE_CHECK_AUDIT_HEADER") return [{ lovDesc: "1.1", lovValue: "Lighting", attribite1: "monthly-inspection" }];
    if (url.includes("/assessment/questions/")) return [{ ...definition }];
    if (url === "/api/document/site/296/parent/folders") return { parentFolders: [] };
    throw new Error(`Unexpected GET ${url}`);
  });
  getMonthlyAuditActions.mockResolvedValue([]);
  getMonthlyAuditContext.mockImplementation(async () => ({ ...currentContext }));
  getMonthlyAuditResponses.mockImplementation(async () => states.map((state) => ({ ...state, response: { ...state.response } })));
  saveMonthlyAuditResponse.mockImplementation(async (checkId, request) => {
    const saved = { periodToken: request.periodToken, revision: request.responseRevision + 1,
      response: { ...request.response, responseId: 227, status: "Closed", images: [] }, actionLinks: [], actionChoices: request.actionChoices };
    states = [saved];
    currentContext = { ...currentContext, hasSavedResponses: true,
      inspectionDate: `${request.inspectionDate}T00:00:00`, nextDueDate: "2026-11-08T00:00:00" };
    return saved;
  });
});

afterEach(() => errorSpy.mockRestore());

test("new Monthly Audit stays editable with no Submit or Open Early controls", async () => {
  render(<Audit {...baseProps} />);
  expect(await screen.findByText("New Monthly Audit. Save the first answer to start this period's record.")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Submit audit/i })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Open Early/i })).not.toBeInTheDocument();
});

test("first saved answer records Inspection Date and changes the banner to editing current audit", async () => {
  render(<Audit {...baseProps} />);
  const inspection = await screen.findByLabelText("Inspection Date");
  fireEvent.change(inspection, { target: { value: "2026-10-08" } });
  fireEvent.click(await screen.findByRole("button", { name: "Fill test answers" }));

  await waitFor(() => expect(saveMonthlyAuditResponse).toHaveBeenCalledTimes(1));
  expect(saveMonthlyAuditResponse).toHaveBeenCalledWith(408, expect.objectContaining({
    periodToken: "period-1", inspectionDate: "2026-10-08",
  }));
  expect(await screen.findByText(/Editing current Monthly Audit\. Changes can be made until/i)).toBeInTheDocument();
});

test("existing saved Monthly Audit reopens with its stored Inspection Date", async () => {
  currentContext = { ...baseContext, hasSavedResponses: true, inspectionDate: "2026-10-03T00:00:00", nextDueDate: "2026-11-03T00:00:00" };
  states = [{ periodToken: "period-1", revision: 1, actionLinks: [], actionChoices: [],
    response: { checkId: 408, qid: 7, responseId: 227, assets: "12", faultassets: "", status: "Closed", images: [] } }];
  render(<Audit {...baseProps} />);

  const inspection = await screen.findByLabelText("Inspection Date");
  await waitFor(() => expect(inspection).toHaveValue("2026-10-03"));
  expect(screen.getByText(/Editing current Monthly Audit\. Changes can be made until/i)).toBeInTheDocument();
});
