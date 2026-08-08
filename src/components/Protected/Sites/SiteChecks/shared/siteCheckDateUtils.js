/**
 * Return the current calendar date in the UK/London time zone.
 *
 * This intentionally matches the approved Air Conditioning behaviour:
 * - Open Site Check: use today's UK date.
 * - Done Site Check: use the date saved with the inspection record.
 */
export const getUkLocalDate = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
};

/**
 * Apply the approved Site Check date rule.
 */
export const getSiteCheckDateByStatus = (status, savedDate = "") =>
  status === "Open" ? getUkLocalDate() : savedDate || "";

/**
 * Used when an Open inspection has temporarily been saved on the same day,
 * for example while linking a risk assessment action.
 */
export const isCurrentUkInspectionDate = (inspectionDate) =>
  String(inspectionDate || "").slice(0, 10) === getUkLocalDate();

/**
 * Date-object version of the current UK calendar date.
 * Midday avoids browser/DST midnight edge cases when used by DatePicker.
 */
export const getUkLocalDateAsDate = (date = new Date()) => {
  const [year, month, day] = getUkLocalDate(date)
    .split("-")
    .map(Number);

  return new Date(year, month - 1, day, 12, 0, 0, 0);
};
/**
 * Return a value suitable for <input type="datetime-local"> using the
 * Europe/London calendar date and clock time.
 */
export const getUkLocalDateTimeInput = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
};
