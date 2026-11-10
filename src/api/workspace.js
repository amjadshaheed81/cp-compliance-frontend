import { clearCustomerStorage, CUSTOMER_SESSION_RESET_EVENT } from "../utils/sessionContext";
import axios from "axios";
import {
  getPlatformWorkspace, getWorkspaceSnapshot, hasPlatformIdentity,
  invalidatePlatformWorkspace, WORKSPACE_PREFIX, WORKSPACE_FILE_PREFIX,
  workspaceRequestIsCurrent,
} from "../utils/platformWorkspace";
import { reloadTo } from "../utils/sessionContext";

const installed = new WeakSet();
const cancelled = () => new axios.CanceledError("The customer or site changed. Reload this workspace.");
const relationshipFields = new Set([
  "siteentity", "sitecheck", "userentity", "revieweruserentity", "documentsentity",
  "sitecheckassessmentquestions", "sitecheckrasurveyriskfactors", "inspection", "inspectionbyuser", "user",
  "sitecheckasbestossample", "sitecheckasbestossurvey", "sitecheckassessment", "sitecheckassessmentresponse",
  "sitecheckaudit", "sitecheckdomesticrasurvey", "sitecheckinspection", "sitecheckinspectionfault",
  "sitecheckwateroutlettemp", "sitedocumentsentity", "sitechecks", "assetentity", "assetdocuments",
  "preactionassetsentity", "assetpatentitylist", "assetpfpentity", "assetdoorspecificationentity",
  // Existing selectors retain these display objects beside the scalar IDs.
  "clientuser", "sitecontactuser", "selectedasset", "selectedengineer",
  "companyentity", "contractorentity", "contractoruserentity", "leaduserentity", "assistantuserentity",
  "sitekeycontacts", "sitefloorplans", "siteimages", "sitelocaldetailsentity", "sitetimingsentity",
]);
const licenceFields = new Set(["licenseId", "logo", "companyName", "adminEmail", "adminPassword", "status", "modules",
  "allowedUser", "allowedSites", "licenceType", "creationDate", "trialExpiry", "adminUserId", "adminFirstName",
  "adminLastName", "companyAddress", "adminContact"]);
const only = (value, fields) => Object.fromEntries(Object.entries(value || {}).filter(([key]) => fields.has(key)));

function platformAccountPath(path, method) {
  if (path === "/api/user/clients" && method === "GET") return "/api/platform/client-management/clients";
  if (/^\/api\/user\/clients\/\d+$/.test(path) && ["GET", "PUT"].includes(method)) {
    return path.replace("/api/user/clients/", "/api/platform/client-management/clients/");
  }
  if (path === "/api/user/onboard" && method === "POST") return "/api/platform/client-management/onboard";
  if (path === "/api/user/clinet/logo" && method === "POST") return "/api/platform/client-management/logo";
  return null;
}

function removeHeader(headers, name) {
  if (typeof headers.delete === "function") headers.delete(name);
  else { delete headers[name]; delete headers[name.toLowerCase()]; }
}

export function workspaceFormPayload(value, path = "") {
  if (Array.isArray(value)) return value.map((item) => workspaceFormPayload(item));
  if (!value || typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype) return value;
  if (/\/client-management\/(?:onboard|clients\/\d+)$/.test(path)) return only(value, licenceFields);
  if (path.endsWith("/site/updateSite")) {
    const fields = new Set(["userSitesEntity", "siteProjectContractsEntity", "siteEnergySurvey", "children"]);
    return workspaceFormPayload(Object.fromEntries(Object.entries(value).filter(([key]) => !fields.has(key))));
  }
  if (path.endsWith("/user/manage")) {
    const result = { ...value };
    for (const field of ["userId", "defaultSiteId", "companyId", "siteId"]) {
      if (result[field] === "") result[field] = null;
    }
    return result;
  }
  if (/\/site-check\/\d+\/completion$/.test(path)) {
    // This endpoint deliberately changes only completion dates/status. Preserve
    // the saved assignees rather than echoing a form's logged-in-user defaults.
    return Object.fromEntries(["checkId", "siteId", "status", "startDate", "dueDate"]
      .filter((key) => Object.prototype.hasOwnProperty.call(value, key)).map((key) => [key, value[key]]));
  }
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !relationshipFields.has(key.replace(/_/g, "").toLowerCase()) &&
      !["edit", "add", "isViewMode"].includes(key))
    .map(([key, child]) => [key, workspaceFormPayload(child)]));
}

export function prepareWorkspaceRequest(config) {
  const url = new URL(config.url || "", config.baseURL || window.location.origin);
  if (url.origin !== window.location.origin || !url.pathname.startsWith("/api/")) return config;
  if (url.pathname.startsWith("/api/platform/") &&
      (!url.pathname.startsWith(`${WORKSPACE_PREFIX}/`) || url.pathname === `${WORKSPACE_PREFIX}/context`)) return config;
  if (["/api/user/login", "/api/user/logout"].includes(url.pathname)) return config;
  if (!hasPlatformIdentity()) return config;

  const method = String(config.method || "GET").toUpperCase();
  const accountPath = platformAccountPath(url.pathname, method);
  if (accountPath) {
    config.url = `${accountPath}${url.search}`;
    config.baseURL = window.location.origin;
    config.withCredentials = true;
    config.headers = config.headers || {};
    removeHeader(config.headers, "Authorization");
    removeHeader(config.headers, "X-CAFM-Client-Id");
    removeHeader(config.headers, "X-CAFM-Site-Id");
    config.suppressAuthRedirect = true;
    if (method !== "GET") config.data = workspaceFormPayload(config.data, accountPath);
    return config;
  }

  const workspace = getPlatformWorkspace();
  if (!workspace) throw cancelled();
  if (!url.pathname.startsWith(`${WORKSPACE_PREFIX}/`)) {
    url.pathname = `${WORKSPACE_PREFIX}/${url.pathname.slice("/api/".length)}`;
  }
  config.url = `${url.pathname}${url.search}`;
  if (method !== "GET") {
    config.data = workspaceFormPayload(config.data, url.pathname);
  }
  config.baseURL = window.location.origin;
  config.withCredentials = true;
  config.headers = config.headers || {};
  // Some existing certificate forms supply an old localStorage bearer token.
  // Platform work always uses the authenticated cookie and verified context.
  if (typeof config.headers.delete === "function") {
    config.headers.delete("Authorization");
  } else {
    delete config.headers.Authorization;
    delete config.headers.authorization;
  }
  config.headers["X-CAFM-Client-Id"] = String(workspace.selectedLicenseId);
  if (workspace.selectedSite) config.headers["X-CAFM-Site-Id"] = String(workspace.selectedSite.siteId);
  else if (typeof config.headers.delete === "function") config.headers.delete("X-CAFM-Site-Id");
  else delete config.headers["X-CAFM-Site-Id"];
  config.__cafmWorkspace = getWorkspaceSnapshot();
  config.suppressAuthRedirect = true;
  config.signal = config.signal || workspace.controller.signal;
  return config;
}

export function acceptWorkspaceResponse(response) {
  const snapshot = response?.config?.__cafmWorkspace;
  if (snapshot && !workspaceRequestIsCurrent(snapshot)) throw cancelled();
  if (snapshot) {
    const client = response.headers?.get?.("X-CAFM-Client-Id") ?? response.headers?.["x-cafm-client-id"];
    const site = response.headers?.get?.("X-CAFM-Site-Id") ?? response.headers?.["x-cafm-site-id"];
    if ((client != null && String(client) !== String(snapshot.selectedLicenseId)) ||
        (site != null && String(site) !== String(snapshot.siteId))) {
      invalidatePlatformWorkspace();
      reloadTo("/platform");
      throw cancelled();
    }
  }
  return response;
}

export function rejectWorkspaceResponse(error) {
  const snapshot = error?.config?.__cafmWorkspace;
  if (snapshot && !workspaceRequestIsCurrent(snapshot)) return Promise.reject(cancelled());
  if (snapshot && error?.response?.status === 401) {
    window.dispatchEvent(new Event(CUSTOMER_SESSION_RESET_EVENT));
    clearCustomerStorage();
    invalidatePlatformWorkspace();
    reloadTo("/login");
  }
  return Promise.reject(error);
}

export function installWorkspaceInterceptors(client) {
  if (installed.has(client)) return client;
  installed.add(client);
  client.interceptors.request.use(prepareWorkspaceRequest);
  client.interceptors.response.use(acceptWorkspaceResponse, rejectWorkspaceResponse);
  return client;
}

// Native evidence fetches in existing PDF forms use credentials:'omit' for Azure.
// Scoped same-origin grants need the session cookie; templates/external URLs
// retain their existing behavior and never receive customer/site headers.
export function isWorkspaceFileUrl(input) {
  let url;
  try { url = new URL(typeof input === "string" ? input : input?.url, window.location.origin); }
  catch { return false; }
  return url.origin === window.location.origin && (url.pathname.startsWith(WORKSPACE_FILE_PREFIX) ||
    url.pathname.startsWith("/api/platform/client-management/files/content/"));
}

export function workspaceFetchOptions(input, options) {
  if (isWorkspaceFileUrl(input)) {
    return { ...options, credentials: "same-origin" };
  }
  return options;
}

installWorkspaceInterceptors(axios);
export async function fetchWorkspaceResource(input, options) {
  const prepared = workspaceFetchOptions(input, options);
  const snapshot = prepared !== options ? getWorkspaceSnapshot() : null;
  const response = await fetch(input, prepared);
  if (snapshot && !workspaceRequestIsCurrent(snapshot)) throw cancelled();
  return response;
}
