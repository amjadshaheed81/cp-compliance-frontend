import { getWithTimeout } from "./index";

export const normalizePostcode = (value) => String(value || "").trim().toUpperCase().replace(/\s+/g, "").replace(/(.{3})$/, " $1").trim();
export const isUkPostcode = (value) => /^(GIR 0AA|[A-Z]{1,2}[0-9][A-Z0-9]? [0-9][A-Z]{2})$/.test(normalizePostcode(value));

export function searchAddresses(postcode, signal) {
  return getWithTimeout(`/api/site/address-lookup/search?postcode=${encodeURIComponent(normalizePostcode(postcode))}`, 15000, { signal });
}
export function loadAddress(id, postcode, signal) {
  return getWithTimeout(`/api/site/address-lookup/address?id=${encodeURIComponent(id)}&postcode=${encodeURIComponent(normalizePostcode(postcode))}`, 15000, { signal });
}
export function addressLookupMessage(error) {
  const code = error?.response?.data?.code;
  if (code === "INVALID_POSTCODE") return "Enter a full UK postcode to find addresses, or enter the address manually.";
  if (code === "ADDRESS_NOT_FOUND" || error?.response?.status === 404) return "That address is no longer available. Search again or enter it manually.";
  if (code === "LOOKUP_LIMIT") return "Address lookup is busy. Try again shortly or enter the address manually.";
  return "Address lookup is unavailable. You can enter the address manually and save the site.";
}
