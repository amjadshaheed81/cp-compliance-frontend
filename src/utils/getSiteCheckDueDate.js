import moment from "moment";

const getRepeatFrequency = (repeatFrequency) => {
  if (repeatFrequency === "Daily") {
    return 1;
  } else if (repeatFrequency === "Weekly") {
    return 7;
  } else if (repeatFrequency === "Monthly") {
    return 30;
  } else if (repeatFrequency === "Quarterly") {
    return 30 * 3;
  } else if (repeatFrequency === "Yearly") {
    return 365;
  }
};

export const getSiteCheckDueDate = (siteCheck) => {
  if (
    siteCheck?.startDate &&
    siteCheck?.repeatFrequency &&
    !siteCheck?.dueDate
  ) {
    // Convert start date to Date object
    const startDate = new Date(siteCheck.startDate);
    // Add repeatFrequency (assumed in days) to start date
    const expiryDate = startDate;
    expiryDate.setDate(
      startDate.getDate() + getRepeatFrequency(siteCheck.repeatFrequency)
    );

    // Update dueDate state with the formatted date (YYYY-MM-DD)
    return moment(expiryDate.toISOString().substring(0, 10)).format("DD-MM-YYYY");
  } else {
    return siteCheck?.dueDate
      ? String(siteCheck?.dueDate)?.substring(0, 10)
      : "--";
  }
};
