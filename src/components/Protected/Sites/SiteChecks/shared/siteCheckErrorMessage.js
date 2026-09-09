// Normalise Axios/backend validation errors so Site Check forms show the
// useful server message instead of only "Request failed with status code 400".
export const getSiteCheckErrorMessage = (error, fallback = "Something went wrong") => {
  const data = error?.response?.data;

  if (typeof data === "string" && data.trim()) {
    return data.trim();
  }

  if (data && typeof data === "object") {
    if (typeof data.message === "string" && data.message.trim()) {
      return data.message.trim();
    }

    if (typeof data.error === "string" && data.error.trim()) {
      return data.error.trim();
    }

    if (Array.isArray(data.errors) && data.errors.length > 0) {
      return data.errors
        .map((item) => {
          if (typeof item === "string") return item;
          return item?.message || item?.defaultMessage || "";
        })
        .filter(Boolean)
        .join("\n");
    }
  }

  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message.trim();
  }

  return fallback;
};
