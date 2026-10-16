import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import SiteCheckHealth from "./SiteCheckHealth";
import { get, post } from "../../../../api";

jest.mock("react-redux", () => ({ connect: () => (component) => component }));
jest.mock("react-router-dom", () => ({ useNavigate: () => jest.fn() }));
jest.mock("../../../common/Header/Header", () => () => <div />);
jest.mock("../../../common/BreadCrumHeader/BreadCrumHeader", () => () => <div />);
jest.mock("../../../common/Sidebar/SidebarNew", () => () => <div />);
jest.mock("../../../../api", () => ({ get: jest.fn(), post: jest.fn(), del: jest.fn(), postMultiPartFormData: jest.fn() }));
jest.mock("react-toastify", () => ({ toast: { error: jest.fn(), success: jest.fn() } }));

const props = { siteSelectedForGlobal: { siteId: 296, siteName: "Test Site" }, loggedInUserData: { role: "Admin" } };
const issue = { checkId: 408, type: "Audit", subType: "Monthly Audit", status: "Done", repeatFrequency: "Monthly",
  startDate: "2026-10-08", dueDate: "2026-11-08", recommendedAction: "REVIEW_ONLY", problems: ["OVERDUE_BUT_DONE"] };

beforeEach(() => {
  jest.clearAllMocks();
  get.mockResolvedValue([issue]);
});

test("Monthly Audit health review explains Submit and directs renewal to View Inspection", async () => {
  render(<SiteCheckHealth {...props} />);
  fireEvent.click(await screen.findByRole("button", { name: "Review" }));
  expect(await screen.findByText(/Use Submit Audit in View Inspection/i)).toBeInTheDocument();
  expect(screen.getByText(/saves its PDF and History and locks that period/i)).toBeInTheDocument();
  expect(screen.getByText(/preserves the previous period before starting the next one/i)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Reopen Now|Open Missed Cycle|Correct Due Date/i })).not.toBeInTheDocument();
  expect(post).not.toHaveBeenCalled();
});

test("Annual Winter review keeps its existing recovery controls", async () => {
  get.mockResolvedValue([{ ...issue, type: "Audit", subType: "Annual Winter Audit", status: "Done", recommendedAction: "CORRECT_DUE_DATE" }]);
  render(<SiteCheckHealth {...props} />);
  fireEvent.click(await screen.findByRole("button", { name: "Review" }));
  expect(await screen.findByRole("button", { name: "Correct Due Date" })).toBeEnabled();
});
