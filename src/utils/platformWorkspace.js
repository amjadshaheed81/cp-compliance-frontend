import { GET_SITES_SUCCESS, SELECT_GLOBAL_SITE } from "../store/actionTypes";
import { CUSTOMER_SESSION_RESET_EVENT, getStoredSessionUser, isPlatformUser, reloadTo, replaceSessionIdentity } from "./sessionContext";

export const WORKSPACE_CHANGED_EVENT = "cafm:workspace-changed";
export const WORKSPACE_PREFIX = "/api/platform/workspace";
export const WORKSPACE_FILE_PREFIX = `${WORKSPACE_PREFIX}/files/content/`;
let current = null;
let generation = 0;
let platformIdentity = false;
let sessionClient = null;

const positiveId = (value) => Number.isSafeInteger(value) && value > 0;
const lastSiteKey = (userId, licenseId) => `cafm.platform.lastSite.${userId}.${licenseId}`;

export function assertPlatformWorkspace(response) {
  const id = response?.selectedLicenseId;
  if (!isPlatformUser(response?.user) || !positiveId(response.user.id) ||
      response.user.licenseId != null || !positiveId(id) ||
      response?.selectedClient?.licenseId !== id || !Array.isArray(response.sites) ||
      !response.sites.every((site) => positiveId(site?.siteId) &&
        (site.licenseId == null || site.licenseId === id)) ||
      new Set(response.sites.map((site) => site.siteId)).size !== response.sites.length) {
    throw new Error("The selected customer's workspace could not be verified.");
  }
  return response;
}

export function getPlatformWorkspace() { return current; }
export function hasPlatformIdentity() { return platformIdentity || isPlatformUser(getStoredSessionUser()); }
export function markPlatformIdentity(value) { platformIdentity = Boolean(value); }
// Header display only. Request authority always comes from the verified workspace.
export function setPlatformSessionClient(client) {
  sessionClient = client || null;
  window.dispatchEvent(new Event(WORKSPACE_CHANGED_EVENT));
}
export function getPlatformDisplayClient() { return current?.selectedClient || sessionClient; }

export function invalidatePlatformWorkspace() {
  current?.controller.abort();
  current = null;
  generation += 1;
  window.dispatchEvent(new Event(WORKSPACE_CHANGED_EVENT));
}

export function rememberPlatformSite(userId, licenseId, siteId) {
  if (!positiveId(userId) || !positiveId(licenseId) || !positiveId(siteId)) return;
  try { localStorage.setItem(lastSiteKey(userId, licenseId), String(siteId)); } catch { /* Optional preference. */ }
}

export function choosePlatformSite(response) {
  const verified = assertPlatformWorkspace(response);
  let remembered = null;
  try { remembered = Number(localStorage.getItem(lastSiteKey(verified.user.id, verified.selectedLicenseId))); } catch { /* Optional preference. */ }
  return verified.sites.find((site) => site.siteId === remembered) || verified.sites[0] || null;
}

export function installPlatformWorkspace(response, dispatch) {
  const verified = assertPlatformWorkspace(response);
  const selectedSite = choosePlatformSite(verified);
  invalidatePlatformWorkspace();
  replaceSessionIdentity(dispatch, verified.user);
  platformIdentity = true;
  // Licence display/modules belong to the working customer; the authenticated
  // user's permanent licence remains null in Redux and on the server.
  try { localStorage.setItem("license", JSON.stringify(verified.selectedClient)); } catch { /* Redux still holds context. */ }
  current = { ...verified, selectedSite, generation, controller: new AbortController() };
  sessionClient = verified.selectedClient;
  dispatch({ type: GET_SITES_SUCCESS, payload: verified.sites });
  dispatch({ type: SELECT_GLOBAL_SITE, payload: selectedSite });
  if (selectedSite) rememberPlatformSite(verified.user.id, verified.selectedLicenseId, selectedSite.siteId);
  window.dispatchEvent(new Event(WORKSPACE_CHANGED_EVENT));
  return current;
}

export function selectPlatformWorkspaceSite(site, destination = "/dashboard") {
  if (!current || !positiveId(site?.siteId)) return false;
  const verifiedSite = current.sites.find((candidate) => candidate.siteId === site.siteId);
  if (!verifiedSite) throw new Error("Choose a site belonging to the selected customer.");
  if (current.selectedSite?.siteId === verifiedSite.siteId && destination === "/dashboard") return true;
  rememberPlatformSite(current.user.id, current.selectedLicenseId, verifiedSite.siteId);
  invalidatePlatformWorkspace();
  // Reload removes mounted inspection forms and all pending customer data.
  reloadTo(destination);
  return true;
}

export function changePlatformCustomer() {
  invalidatePlatformWorkspace();
  reloadTo("/platform");
}

export function openPlatformSitePath(siteId, destination) {
  if (!hasPlatformIdentity()) return false;
  if (!current) throw new Error("Open a client workspace before choosing a site.");
  const site = current.sites.find((candidate) => candidate.siteId === Number(siteId));
  if (!site) throw new Error("Choose a site belonging to the selected customer.");
  selectPlatformWorkspaceSite(site, destination);
  return true;
}

export function workspaceRequestIsCurrent(snapshot) {
  return Boolean(current && snapshot && current.generation === snapshot.generation &&
    current.selectedLicenseId === snapshot.selectedLicenseId &&
    (current.selectedSite?.siteId || null) === snapshot.siteId);
}

export function getWorkspaceSnapshot() {
  return current ? { generation: current.generation, selectedLicenseId: current.selectedLicenseId,
    siteId: current.selectedSite?.siteId || null } : null;
}

export function platformWorkspacePathAllowed(path) {
  path = String(path || "").replace(/\/+$/, "");
  return new Set([
    "/dashboard", "/edit-profile", "/sites", "/reports", "/user-management", "/notifications", "/actions",
    "/add-site", "/update-site", "/documents", "/subfolder", "/statutory-register", "/assets",
    "/create-asset", "/update-asset", "/view-asset", "/site-contracts", "/pre-actions",
    "/view-update-pre-actions", "/pre-action-detail", "/action-detail", "/site-checks",
    "/site-check-health", "/site-check-scheduler-logs", "/energy-cost",
    "/site-calendar", "/admin/categories", "/admin/categories/new", "/admin/dropdowns",
    "/admin/company", "/admin/folders", "/onboard-client",
  ]).has(path) || /^\/site-checks\/\d+\/update$/.test(path) || /^\/admin\/categories\/\d+\/update$/.test(path);
}

export function platformWorkspacePathNeedsSite(path) {
  path = String(path || "").replace(/\/+$/, "");
  return !new Set(["/sites", "/add-site", "/edit-profile", "/user-management", "/reports",
    "/admin/categories", "/admin/categories/new", "/admin/dropdowns", "/admin/company", "/admin/folders", "/onboard-client"])
    .has(path) && !/^\/admin\/categories\/\d+\/update$/.test(path);
}

export function workingLicenseId(user) {
  return isPlatformUser(user) ? current?.selectedLicenseId : user?.licenseId;
}

window.addEventListener(CUSTOMER_SESSION_RESET_EVENT, () => {
  platformIdentity = false;
  sessionClient = null;
  invalidatePlatformWorkspace();
});
