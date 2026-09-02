const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;

const pad2 = (value) => String(value).padStart(2, "0");

/**
 * Return a YYYY-MM-DD calendar value without applying timezone conversion.
 * Site Check inspection controls are calendar-date controls, so their selected
 * day must remain authoritative even around UK DST changes.
 */
export const toSiteCheckDateOnly = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`;
  }

  const match = String(value).trim().match(DATE_ONLY_PATTERN);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
};

const daysInMonth = (year, monthOneBased) =>
  new Date(Date.UTC(year, monthOneBased, 0)).getUTCDate();

const addDays = (dateOnly, days) => {
  const [year, month, day] = dateOnly.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
};

const addMonthsClamped = (dateOnly, monthsToAdd) => {
  const [year, month, day] = dateOnly.split("-").map(Number);
  const targetMonthIndex = year * 12 + (month - 1) + monthsToAdd;
  const targetYear = Math.floor(targetMonthIndex / 12);
  const targetMonthZeroBased = ((targetMonthIndex % 12) + 12) % 12;
  const targetMonthOneBased = targetMonthZeroBased + 1;
  const targetDay = Math.min(day, daysInMonth(targetYear, targetMonthOneBased));

  return `${targetYear}-${pad2(targetMonthOneBased)}-${pad2(targetDay)}`;
};

/**
 * Calculate the next Site Check due date from the actual inspection date.
 * Month/year calculations deliberately clamp month-end dates to match Java
 * LocalDateTime.plusMonths/plusYears used by the backend scheduler.
 */
export const calculateSiteCheckDueDate = (inspectionDate, repeatFrequency) => {
  const dateOnly = toSiteCheckDateOnly(inspectionDate);
  if (!dateOnly) return null;

  switch (repeatFrequency) {
    case "Daily":
      return addDays(dateOnly, 1);
    case "Weekly":
      return addDays(dateOnly, 7);
    case "Monthly":
      return addMonthsClamped(dateOnly, 1);
    case "Quarterly":
      return addMonthsClamped(dateOnly, 3);
    case "6-Monthly":
      return addMonthsClamped(dateOnly, 6);
    case "Yearly":
      return addMonthsClamped(dateOnly, 12);
    case "None":
    case "":
    case null:
    case undefined:
      return dateOnly;
    default:
      // Unknown stored values must not silently become a yearly recurrence.
      return null;
  }
};

export const calculateSiteCheckDueDateTime = (inspectionDate, repeatFrequency) => {
  const dueDate = calculateSiteCheckDueDate(inspectionDate, repeatFrequency);
  return dueDate ? `${dueDate}T00:00:00` : null;
};

export const formatSiteCheckDisplayDate = (value) => {
  const dateOnly = toSiteCheckDateOnly(value);
  if (!dateOnly) return "";
  const [year, month, day] = dateOnly.split("-");
  return `${day}/${month}/${year}`;
};
