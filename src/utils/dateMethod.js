export const getCurrentDate = () => {
  const now = new Date();
  const formattedDate = now.toISOString();
  return formattedDate;
};
