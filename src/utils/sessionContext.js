import { CPCOM_STATE_STORE } from "../Constant/Session";
import { USER_LOGIN, USER_LOGOUT } from "../store/actionTypes";

export const SESSION_CHANGE_KEY = "cafm.session.change";
export const CUSTOMER_SESSION_RESET_EVENT = "cafm:customer-session-reset";

const CUSTOMER_KEYS = new Set([
  CPCOM_STATE_STORE,
  "license",
  "site",
  "userData",
  "token",
  "assetFilters",
  "doorAssetFilters",
  "patAssetFilters",
  "PFAssetFilters",
]);
const CUSTOMER_PREFIXES = [
  "cafm.siteChecks.gridState.",
  "cafm-site-check-test-launcher-v1:",
];

export const isPlatformUser = (user) => user?.accountScope === "PLATFORM";

export function clearCustomerStorage() {
  for (const name of ["localStorage", "sessionStorage"]) {
    try {
      const storage = window[name];
      const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index));
      keys.forEach((key) => {
        if (CUSTOMER_KEYS.has(key) || CUSTOMER_PREFIXES.some((prefix) => key?.startsWith(prefix))) {
          storage.removeItem(key);
        }
      });
    } catch {
      // Storage may be unavailable in private browsing; the in-memory reset still runs.
    }
  }
}

export function resetCustomerSession(dispatch) {
  window.dispatchEvent(new Event(CUSTOMER_SESSION_RESET_EVENT));
  dispatch({ type: USER_LOGOUT, payload: {} });
  clearCustomerStorage();
}

export function replaceSessionIdentity(dispatch, user) {
  resetCustomerSession(dispatch);
  dispatch({ type: USER_LOGIN, payload: user });
}

export function announceSessionChange() {
  try {
    localStorage.setItem(SESSION_CHANGE_KEY, `${Date.now()}-${Math.random()}`);
  } catch {
    // Other tabs also refresh their platform session when they regain focus.
  }
}

export function getStoredSessionUser() {
  try {
    return JSON.parse(localStorage.getItem(CPCOM_STATE_STORE) || "null")?.site?.loggedInUserData || null;
  } catch {
    return null;
  }
}

export function reloadTo(path) {
  const location = new URL(window.location.href);
  location.hash = path;
  window.history.replaceState(null, "", `${location.pathname}${location.search}${location.hash}`);
  // A hash navigation alone would retain old requests, components and Redux data.
  window.location.reload();
}

export function assertPlatformSession(session) {
  const selectedId = session?.selectedLicenseId;
  const noSelection = selectedId == null;
  const validSelection = noSelection
    ? session?.selectionRequired === true && session?.selectedClient == null
    : Number.isSafeInteger(selectedId) && selectedId > 0 &&
      session?.selectionRequired === false &&
      session?.selectedClient?.licenseId === selectedId &&
      session?.selectedClient?.selectable === true;

  if (!isPlatformUser(session?.user) || !session?.user?.id ||
      session.user.licenseId != null || !validSelection) {
    throw new Error("The platform session could not be verified. Please sign in again.");
  }
  return session;
}
