import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import MonthlyAuditActionChoices from "./MonthlyAuditActionChoices";

jest.mock("../../../../../api", () => ({
  get: jest.fn(), post: jest.fn(), del: jest.fn(), postMultiPartFormData: jest.fn(),
}));

const question = { qid: 7, response: { faultassets: "12" }, actionChoices: {}, actionLinks: [] };
const candidate = { actionId: 50, siteId: 296, assetIds: [12], status: "Reported",
  createdAt: "2026-08-07T10:30:00", observation: "Light does not illuminate", requiredAction: "Replace the lamp" };
const common = { question, siteId: 296, assets: [{ assetId: 12, assetName: "Hall light" }], candidates: [candidate] };

test("the user sees the previous fault, original date and status and must choose it", () => {
  const onChange = jest.fn();
  render(<MonthlyAuditActionChoices {...common} onChange={onChange} />);
  expect(onChange).not.toHaveBeenCalled();
  fireEvent.mouseDown(screen.getByLabelText("Action for this failure"));
  const option = screen.getByRole("option", { name: /Action 50.*07\/08\/2026.*Reported.*Light does not illuminate/ });
  fireEvent.click(option);
  expect(onChange).toHaveBeenCalledWith("12", { mode: "EXISTING", actionId: 50 });
  expect(candidate.createdAt).toBe("2026-08-07T10:30:00");
});

test("a different fault remains an explicit new-Action choice", () => {
  const onChange = jest.fn();
  render(<MonthlyAuditActionChoices {...common} onChange={onChange} />);
  fireEvent.mouseDown(screen.getByLabelText("Action for this failure"));
  fireEvent.click(screen.getByRole("option", { name: "New fault — create new Action" }));
  expect(onChange).toHaveBeenCalledWith("12", { mode: "NEW" });
});

test("a saved selection stays visible if its Action has since been completed", () => {
  render(<MonthlyAuditActionChoices {...common} candidates={[]} disabled
    question={{ ...question, actionChoices: { 12: { mode: "EXISTING", actionId: 50 } },
      actionLinks: [{ ...candidate, assetId: 12, originalActionDate: candidate.createdAt, status: "Completed" }] }}
    onChange={jest.fn()} />);
  expect(screen.getAllByText(/Action 50.*07\/08\/2026.*Completed/).length).toBeGreaterThan(0);
  expect(screen.getByText("Required action: Replace the lamp")).toBeInTheDocument();
  expect(screen.getByLabelText("Action for this failure")).toHaveAttribute("aria-disabled", "true");
});

test("a different site's Action is not suggested for the same numeric asset ID", () => {
  render(<MonthlyAuditActionChoices {...common} candidates={[{ ...candidate, siteId: 297 }]} onChange={jest.fn()} />);
  expect(screen.queryByLabelText("Action for this failure")).not.toBeInTheDocument();
  expect(screen.getByText(/No outstanding Action was found/)).toBeInTheDocument();
});
