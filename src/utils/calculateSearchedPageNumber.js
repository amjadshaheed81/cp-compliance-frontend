export const calculateLastPageIndex = (totalItems, pageSize = 7) => {
  if (totalItems <= 0 || pageSize <= 0) {
    return 1;
  }

  // Calculate the total number of pages
  const totalPages = Math.ceil(totalItems / pageSize);
  // Return the last page index
  return totalPages;
};
