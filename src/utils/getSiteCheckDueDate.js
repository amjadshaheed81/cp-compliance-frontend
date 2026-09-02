import moment from "moment";
import {
  calculateSiteCheckDueDate,
  toSiteCheckDateOnly,
} from "./siteCheckRecurrence";

export const addRepeatFrequency = (startDate, repeatFrequency) => {
  const nextDate = calculateSiteCheckDueDate(startDate, repeatFrequency);
  if (!nextDate) {
    throw new Error(`Invalid repeat frequency: ${repeatFrequency || "(empty)"}`);
  }

  // Midday keeps the date stable when this legacy helper is consumed as a
  // Date object by UpdateSiteCheck/grid fallback code.
  return new Date(`${nextDate}T12:00:00`);
};

const getFutureDueDate = (siteCheck) => {
  const startDate = toSiteCheckDateOnly(siteCheck?.startDate);
  const repeatFrequency = siteCheck?.repeatFrequency;
  if (!startDate || !repeatFrequency || repeatFrequency === "None") {
    return null;
  }

  let nextDueDate = new Date(`${startDate}T12:00:00`);
  const currentDate = new Date();

  while (nextDueDate <= currentDate) {
    nextDueDate = addRepeatFrequency(nextDueDate, repeatFrequency);
  }

  return nextDueDate;
};

export const getSiteCheckDueDate = (siteCheck) => {
  if (siteCheck?.dueDate) {
    return moment(siteCheck.dueDate).format("DD-MM-YYYY");
  }

  const nextDueDate = getFutureDueDate(siteCheck);
  return nextDueDate ? moment(nextDueDate).format("DD-MM-YYYY") : "--";
};

export const getSiteCheckDueDateForStatus = (siteCheck) => {
  if (siteCheck?.dueDate) {
    return new Date(siteCheck.dueDate).toISOString();
  }

  const nextDueDate = getFutureDueDate(siteCheck);
  return nextDueDate ? nextDueDate.toISOString() : null;
};
