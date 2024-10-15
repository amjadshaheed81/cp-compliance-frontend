export const getCurrentDate = () => {
  const now = new Date();
  const formattedDate = now.toISOString();
  return formattedDate;
};


export function isValidDate(dateString) {
  const date = new Date(dateString);
  return !isNaN(date.getTime()); // Returns true if date is valid
}