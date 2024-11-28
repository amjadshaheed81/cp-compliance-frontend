export const formatToCurrency = (value) => {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatToNumber = (value) => {
  return new Intl.NumberFormat("en-GB", {
    style: "decimal",
    currency: "GBP",
    maximumFractionDigits: 2,
  }).format(value);
};
