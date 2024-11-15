import moment from "moment";

export const addRepeatFrequency = (startDate, repeatFrequency) => {
  const date = new Date(startDate);
  
  switch (repeatFrequency) {
    case "Daily":
      date.setDate(date.getDate() + 1);
      break;
    case "Weekly":
      date.setDate(date.getDate() + 7);
      break;
    case "Monthly":
      date.setMonth(date.getMonth() + 1);
      break;
    case "Quarterly":
      date.setMonth(date.getMonth() + 3);
      break;
    case "Yearly":
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      throw new Error("Invalid repeat frequency");
  }
  
  return date;
};

export const getSiteCheckDueDate = (siteCheck) => {
  if (siteCheck?.startDate && siteCheck?.repeatFrequency && !siteCheck?.dueDate) {
    const currentDate = new Date();
    let nextDueDate = new Date(siteCheck.startDate);
    
    // Keep advancing by the repeat frequency until the next due date is in the future
    while (nextDueDate <= currentDate) {
      nextDueDate = addRepeatFrequency(nextDueDate, siteCheck.repeatFrequency);
    }
    
    // Format the future due date to "DD-MM-YYYY"
    return moment(nextDueDate).format("DD-MM-YYYY");
  } else {
    return siteCheck?.dueDate
      ? moment(siteCheck.dueDate).format("DD-MM-YYYY")
      : "--";
  }
};

export const getSiteCheckDueDateForStatus = (siteCheck) => {
  if (siteCheck?.startDate && siteCheck?.repeatFrequency && !siteCheck?.dueDate) {
    const currentDate = new Date();
    let nextDueDate = new Date(siteCheck.startDate);
    
    // Keep advancing by the repeat frequency until the next due date is in the future
    while (nextDueDate <= currentDate) {
      nextDueDate = addRepeatFrequency(nextDueDate, siteCheck.repeatFrequency);
    }

    return nextDueDate.toISOString(); // Return in ISO format for comparisons
  } else {
    return siteCheck?.dueDate
      ? new Date(siteCheck.dueDate).toISOString()
      : null; // Return null if no due date is available
  }
};
