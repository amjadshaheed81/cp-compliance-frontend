import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import SiteCheckHealth from "./SiteCheckHealth";
import { get, post } from "../../../../api";
import { getMonthlyAuditContext } from "./shared/monthlyAuditWorkflow";

jest.mock("react-redux", () => ({ connect: () => (component) => component }));
jest.mock("react-router-dom", () => ({ useNavigate: () => jest.fn() }));
jest.mock("../../../common/Header/Header", () => () => <div />);
jest.mock("../../../common/BreadCrumHeader/BreadCrumHeader", () => () => <div />);
jest.mock("../../../common/Sidebar/SidebarNew", () => () => <div />);
jest.mock("../../../../api", () => ({ get: jest.fn(), post: jest.fn(), del: jest.fn(), postMultiPartFormData: jest.fn() }));
jest.mock("react-toastify", () => ({ toast: { error: jest.fn(), success: jest.fn() } }));
jest.mock("./shared/monthlyAuditWorkflow", () => ({
  ...jest.requireActual("./shared/monthlyAuditWorkflow"), getMonthlyAuditContext: jest.fn(),
}));

const props = { siteSelectedForGlobal: { siteId: 296, siteName: "Test Site" }, loggedInUserData: { role: "Admin" } };
const issue = { checkId: 408, type: "Audit", subType: "Monthly Audit", status: "Done", repeatFrequency: "Monthly",
  startDate: "2026-09-01", dueDate: "2026-10-01", recommendedAction: "REOPEN_EARLY", problems: ["MISSED_REOPEN"] };

beforeEach(() => {
  jest.clearAllMocks();
  get.mockResolvedValue([issue]);
  getMonthlyAuditContext.mockResolvedValue({ checkId: 408, siteId: 296, periodToken: "period-at-review", status: "SUBMITTED", canOpenEarly: true });
  post.mockResolvedValue({ data: { message: "Audit opened" } });
});

test("Monthly recovery retries retain the reviewed token instead of opening another period", async () => {
  post.mockRejectedValueOnce({ response: { status: 409, data: { message: "The audit period changed. Refresh before opening it." } } });
  render(<SiteCheckHealth {...props} />);
  fireEvent.click(await screen.findByRole("button", { name: "Review" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Reopen Now" })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", { name: "Reopen Now" }));
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Confirm" })); });
  await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(screen.getByRole("button", { name: "Confirm" })).toBeEnabled());
  getMonthlyAuditContext.mockResolvedValue({ checkId: 408, siteId: 296, periodToken: "later-period", status: "SUBMITTED", canOpenEarly: true });
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Confirm" })); });
  await waitFor(() => expect(post).toHaveBeenCalledTimes(2));
  expect(getMonthlyAuditContext).toHaveBeenCalledTimes(1);
  for (const [, request] of post.mock.calls) expect(request.periodToken).toBe("period-at-review");
  await waitFor(() => expect(screen.queryByRole("button", { name: "Confirm" })).not.toBeInTheDocument());
});

test("Monthly missed-cycle recovery does not send a replacement inspection date", async () => {
  get.mockResolvedValue([{ ...issue, recommendedAction: "OPEN_MISSED_CYCLE" }]);
  render(<SiteCheckHealth {...props} />);
  fireEvent.click(await screen.findByRole("button", { name: "Review" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Open Missed Cycle" })).toBeEnabled());
  expect(screen.queryByLabelText("Cycle Start Date")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Open Missed Cycle" }));
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Confirm" })); });
  await waitFor(() => expect(post).toHaveBeenCalledWith("/api/site-check/recovery/408", {
    action: "OPEN_MISSED_CYCLE", cycleStartDate: null, reason: "", periodToken: "period-at-review",
  }));
  await waitFor(() => expect(screen.queryByRole("button", { name: "Confirm" })).not.toBeInTheDocument());
});

test("Monthly date correction is review-only and cannot rewrite the submitted date", async () => {
  get.mockResolvedValue([{ ...issue, recommendedAction: "CORRECT_DUE_DATE" }]);
  render(<SiteCheckHealth {...props} />);
  fireEvent.click(await screen.findByRole("button", { name: "Review" }));
  await screen.findByText(/Monthly Audit dates are recorded from the actual Inspection Date/);
  expect(screen.queryByRole("button", { name: "Correct Due Date" })).not.toBeInTheDocument();
  expect(post).not.toHaveBeenCalled();
});

test("Annual Winter review keeps its existing date-correction control", async () => {
  get.mockResolvedValue([{ ...issue, subType: "Annual Winter Audit", recommendedAction: "CORRECT_DUE_DATE" }]);
  render(<SiteCheckHealth {...props} />);
  fireEvent.click(await screen.findByRole("button", { name: "Review" }));
  expect(await screen.findByRole("button", { name: "Correct Due Date" })).toBeEnabled();
  expect(getMonthlyAuditContext).not.toHaveBeenCalled();
});
