import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import SiteCheckEarlyOpenDialog from "./SiteCheckEarlyOpenDialog";

const defaults = () => ({ open: true, frequency: "Yearly", currentDueDate: "2027-10-07",
  onClose: jest.fn(), onConfirm: jest.fn() });

test("the Inspection dialog retains its title, dates and supplied planned-date controls", () => {
  const props = defaults();
  render(<SiteCheckEarlyOpenDialog {...props}>
    <label htmlFor="plannedInspectionDate">Planned Inspection Date</label>
    <input id="plannedInspectionDate" type="date" defaultValue="2026-10-07" />
    <div>Estimated Next Due Date: 07/10/2027</div>
  </SiteCheckEarlyOpenDialog>);
  const dialog = screen.getByRole("dialog", { name: "Open Inspection Early" });
  expect(within(dialog).getByText("Yearly")).toBeInTheDocument();
  expect(within(dialog).getByText("07-10-2027")).toBeInTheDocument();
  expect(within(dialog).getByLabelText("Planned Inspection Date")).toHaveValue("2026-10-07");
  fireEvent.click(within(dialog).getByRole("button", { name: "Open Inspection" }));
  expect(props.onConfirm).toHaveBeenCalledTimes(1);
  fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
  expect(props.onClose).toHaveBeenCalledTimes(1);
});

test("opening disables both buttons and ignores Escape", () => {
  const props = defaults();
  render(<SiteCheckEarlyOpenDialog {...props} opening />);
  expect(screen.getByRole("button", { name: "Opening..." })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape", code: "Escape", keyCode: 27 });
  expect(props.onClose).not.toHaveBeenCalled();
});

test("form-specific validation disables confirm without blocking Cancel", () => {
  render(<SiteCheckEarlyOpenDialog {...defaults()} confirmDisabled />);
  expect(screen.getByRole("button", { name: "Open Inspection" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Cancel" })).toBeEnabled();
});

test("Monthly Audit uses the same dialog shell with its own title and confirm label", () => {
  render(<SiteCheckEarlyOpenDialog {...defaults()} title="Open Monthly Audit Early" confirmLabel="Open Audit">
    <p>Next audit starts with: Blank answers</p>
  </SiteCheckEarlyOpenDialog>);
  expect(screen.getByRole("dialog", { name: "Open Monthly Audit Early" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Open Audit" })).toHaveClass("btn", "btn-primary");
  expect(screen.getByRole("button", { name: "Cancel" })).toHaveClass("btn", "btn-secondary");
  expect(screen.getByText("Next audit starts with: Blank answers")).toBeInTheDocument();
});

test("a closed dialog renders no action controls", () => {
  render(<SiteCheckEarlyOpenDialog {...defaults()} open={false} />);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Open Inspection" })).not.toBeInTheDocument();
});
