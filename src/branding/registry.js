import core from "../content/core/brand";
import unite from "../content/unite/brand";

export const BRANDS = Object.freeze({ core, unite });

// The frontend owns the customer-to-theme configuration. IDs come from the
// authenticated client or the verified PLATFORM workspace, never URL parameters,
// display names, localStorage "license", or a request header.
// Unite is confirmed as licence 1. Add each new customer here by its real ID.
// Customers without an explicit entry use the Core CAFM theme.
export const BRAND_BY_CLIENT_ID = Object.freeze({
  1: "unite",
});

const DEFAULT_CLIENT_BRAND = "core";

export function brandForClient(clientId) {
  const id = Number(clientId);
  if (!Number.isSafeInteger(id) || id <= 0) return BRANDS[DEFAULT_CLIENT_BRAND];
  const configuredId = BRAND_BY_CLIENT_ID[id];
  return BRANDS[configuredId] || BRANDS[DEFAULT_CLIENT_BRAND];
}

/**
 * URL branding for anonymous/PLATFORM-selection screens; authenticated client
 * branding once the client is known. A PLATFORM client is considered selected
 * only after the server-validated workspace has been installed in memory.
 */
export function resolveWorkspaceBrand(user, verifiedPlatformClientId, hostname, localBrand = "") {
  if (!user?.id) return resolveBrand(hostname, localBrand);
  if (user.accountScope === "PLATFORM") {
    return Number.isSafeInteger(verifiedPlatformClientId) && verifiedPlatformClientId > 0
      ? brandForClient(verifiedPlatformClientId)
      : resolveBrand(hostname, localBrand);
  }
  return Number.isSafeInteger(user.licenseId) && user.licenseId > 0
    ? brandForClient(user.licenseId)
    : resolveBrand(hostname, localBrand);
}

// Explicit website-to-brand mapping only. Brand choice never grants client access.
// Add future approved hostnames here; do not infer a brand from a licence or URL query.
export const BRAND_HOSTS = Object.freeze({
  "app.corecafm.co.uk": "core",
  "property.unitetheunion.org": "unite",
});

const localHosts = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
const has = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

export function resolveBrand(hostname, localBrand = "") {
  const host = String(hostname || "").trim().toLowerCase().replace(/\.$/, "");
  if (has(BRAND_HOSTS, host)) return BRANDS[BRAND_HOSTS[host]];
  // A local build can preview Unite with REACT_APP_BRAND=unite. This override
  // is ignored on every non-loopback host, including deployed test environments.
  const localId = String(localBrand || "").trim().toLowerCase();
  if (localHosts.has(host) && has(BRANDS, localId)) return BRANDS[localId];
  return core;
}
