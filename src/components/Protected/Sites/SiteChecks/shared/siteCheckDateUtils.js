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

/**
 * Serialize a date/date-time value for Java LocalDateTime without replacing
 * the value selected in the form control.
 *
 * Examples:
 * - 2026-07-24            -> 2026-07-24T00:00:00
 * - 2026-07-24T14:35      -> 2026-07-24T14:35:00
 * - 2026-07-24 14:35:00   -> 2026-07-24T14:35:00
 */
export const toJavaLocalDateTime = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value.toISOString().split(".")[0];
  }

  const raw = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return `${raw}T00:00:00`;
  }

  const localValue = raw.replace(" ", "T");

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(localValue)) {
    return `${localValue}:00`;
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(localValue)) {
    return localValue.slice(0, 19);
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().split(".")[0];
};

/**
 * Serialize a form value for a Java LocalDate field.
 * The form control remains the source of truth; only the API representation
 * is normalised here.
 */
export const toJavaLocalDate = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    return getUkLocalDate(value);
  }

  const raw = String(value).trim();
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : raw;
};

