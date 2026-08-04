export const formatDate = (dateInput) => {
  if (!dateInput) return "";

  // If it's already a properly formatted YYYY-MM-DD string, return as-is
  if (typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return dateInput;
  }

  // Handle both Date objects and ISO strings
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  // Use local date components (not UTC)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// Formats Java LocalDateTime values using ISO-8601 without milliseconds.
// Example: 2027-07-30T00:00:00
export const formatLocalDateTime = (dateInput) => {
  if (!dateInput) return null;

  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString().split(".")[0];
};
