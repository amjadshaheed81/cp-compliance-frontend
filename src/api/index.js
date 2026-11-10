import axios from "axios";
import { installWorkspaceInterceptors } from "./workspace";
import { getWorkspaceSnapshot } from "../utils/platformWorkspace";
import { clearCustomerStorage, CUSTOMER_SESSION_RESET_EVENT, reloadTo } from "../utils/sessionContext";

let axiosInstance = axios.create({
  baseURL: window?.location?.origin, //window?.location?.origin,
  timeout: 2000000,
});

export const SITE_CHECK_DATA_CHANGED_EVENT = "cafm:site-check-data-changed";
export const API_REQUEST_FAILED_EVENT = "cafm:api-request-failed";

export function notifyApiRequestFailed(error) {
  if (!error || axios.isCancel(error) || error.__cafmApiFailureNotified) return;
  error.__cafmApiFailureNotified = true;

  const method = String(error?.config?.method || "GET").toUpperCase();
  const rawUrl = String(error?.config?.url || "");
  const status = Number(error?.response?.status || 0);
  let path = "";
  let internal = false;
  try {
    const parsed = new URL(rawUrl, error?.config?.baseURL || window.location.origin);
    path = parsed.pathname;
    internal = parsed.origin === window.location.origin && path.startsWith("/api/");
  } catch { /* Invalid request details are not exposed. */ }

  window.dispatchEvent(
    new CustomEvent(API_REQUEST_FAILED_EVENT, {
      detail: {
        method,
        url: path,
        path,
        status,
        responseData: internal ? error?.response?.data ?? null : null,
      },
    })
  );
}

export function notifySiteCheckDataChanged(url, method) {
  const rawUrl = String(url || "");
  let path = rawUrl;
  try {
    path = new URL(rawUrl, window.location.origin).pathname;
  } catch {
    // Relative API paths are already usable as-is.
  }
  if (!path.startsWith("/api/site-check") && !path.startsWith("/api/platform/workspace/site-check")) return;
  window.dispatchEvent(
    new CustomEvent(SITE_CHECK_DATA_CHANGED_EVENT, {
      detail: { url: rawUrl, method },
    })
  );
}

function withSiteCheckChangeNotification(request, url, method) {
  return Promise.resolve(request).then((response) => {
    notifySiteCheckDataChanged(url, method);
    return response;
  });
}

function configAxios() {
  axiosInstance = axios.create({
    baseURL: window?.location?.origin, //,
    timeout: 2000000,
  });
  installWorkspaceInterceptors(axiosInstance);
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => handleError(error)
  );
}

function handleError(error) {
  if (axios.isCancel(error) || error?.__cafmErrorHandled) return Promise.reject(error);
  error.__cafmErrorHandled = true;
  const method = String(error?.config?.method || "GET").toUpperCase();
  const status = Number(error?.response?.status || 0);
  let path = "";
  let cafmRequest = false;
  try {
    const request = new URL(error?.config?.url || "", error?.config?.baseURL || window.location.origin);
    path = request.pathname;
    cafmRequest = request.origin === window.location.origin && path.startsWith("/api/");
  } catch { /* A malformed/external request cannot expire our session. */ }
  console.error("API request failed:", { method, path, status });
  notifyApiRequestFailed(error);
  const isLoginRequest = path === "/api/user/login";
  const suppressed = Boolean(error?.config?.suppressAuthRedirect);
  const expiredLegacySession = status === 500 && /JWT expired at|JWT String argument cannot be null or empty\./.test(String(error?.response?.data?.message || ""));
  // Forbidden means the operation is denied; only our own expired/unauthenticated session signs out.
  if (cafmRequest && !isLoginRequest && !suppressed && (status === 401 || expiredLegacySession)) {
    window.dispatchEvent(new Event(CUSTOMER_SESSION_RESET_EVENT));
    clearCustomerStorage();
    reloadTo("/login");
  }
  return Promise.reject(error);
}

function getHeaders() {
  //const token = localStorage.getItem("mployr-token");
  return {
    "Access-Control-Allow-Origin": "*",
  };
}

export function post(url, userData) {
  configAxios();
  try {
    return withSiteCheckChangeNotification(
      axiosInstance({
        method: "POST",
        url,
        data: userData,
        headers: getHeaders(),
      }),
      url,
      "POST"
    );
  } catch (error) {
    return handleError(error);
  }
}


export function postWithTimeout(url, userData, timeoutMs = 20000) {
  configAxios();
  return withSiteCheckChangeNotification(
    axiosInstance({
      method: "POST",
      url,
      data: userData,
      headers: getHeaders(),
      timeout: timeoutMs,
    }),
    url,
    "POST"
  );
}

export async function getWithTimeout(url, timeoutMs = 15000, { signal, suppressAuthRedirect = false } = {}) {
  configAxios();
  try {
    const res = await axiosInstance({
      method: "GET",
      url,
      headers: getHeaders(),
      timeout: timeoutMs,
      signal,
      suppressAuthRedirect,
    });
    return res?.data ?? null;
  } catch (error) {
    return handleError(error);
  }
}

export function putWithTimeout(
  url,
  data,
  timeoutMs = 10000,
  { suppressAuthRedirect = false } = {}
) {
  configAxios();
  return withSiteCheckChangeNotification(
    axiosInstance({
      method: "PUT",
      url,
      data,
      headers: getHeaders(),
      timeout: timeoutMs,
      suppressAuthRedirect,
    }),
    url,
    "PUT"
  );
}

export function postMultiPartFormData(url, userData) {
  configAxios();
  try {
    return withSiteCheckChangeNotification(
      axiosInstance({
        method: "POST",
        url,
        data: userData,
        headers: { ...getHeaders(), "Content-Type": "multipart/form-data" },
      }),
      url,
      "POST"
    );
  } catch (error) {
    return handleError(error);
  }
}

export function putMultiPartFormData(url, userData) {
  configAxios();
  try {
    return withSiteCheckChangeNotification(
      axiosInstance({
        method: "PUT",
        url,
        data: userData,
        headers: { ...getHeaders(), "Content-Type": "multipart/form-data" },
      }),
      url,
      "PUT"
    );
  } catch (error) {
    return handleError(error);
  }
}

export function del(url, payload) {
  configAxios();
  try {
    return withSiteCheckChangeNotification(
      axiosInstance({
        method: "DELETE",
        url,
        headers: getHeaders(),
        data: payload,
      }),
      url,
      "DELETE"
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function get(url) {
  configAxios();
  try {
    const res = await axiosInstance({
      method: "GET",
      url,
      headers: getHeaders(),
    });
    return res?.data || [];
  } catch (error) {
    return handleError(error);
  }
}

export function put(url, data) {
  configAxios();
  try {
    return withSiteCheckChangeNotification(
      axiosInstance({
        method: "PUT",
        url,
        data: data,
        headers: getHeaders(),
      }),
      url,
      "PUT"
    );
  } catch (error) {
    return handleError(error);
  }
}

export function uploadPhoto(url, formData) {
  configAxios();
  try {
    return axiosInstance({
      method: "POST",
      url,
      data: formData,
      headers: { ...getHeaders(), "Content-Type": `multipart/form-data` },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function uploadNewVersion(url, formData) {
  configAxios();
  try {
    return axiosInstance({
      method: "PUT",
      url,
      data: formData,
      headers: { ...getHeaders(), "Content-Type": `multipart/form-data` },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function uploadSiteCheckDoc(reqData) {
  const formData = new FormData();
  formData.append("siteId", reqData.siteId);
  formData.append("file", reqData.file);
  formData.append("fileName", reqData.file?.name);
  formData.append(
    "folderName",
    reqData.folderName ? reqData.folderName : "others"
  );
  configAxios();
  try {
    const { data } = await axiosInstance({
      method: "POST",
      url: "/api/site-check/file/upload",
      data: formData,
      headers: { ...getHeaders(), "Content-Type": `multipart/form-data` },
    });
    return data;
  } catch (error) {
    return handleError(error);
  }
}

export async function uploadProfileSignature(file) {
  const formData = new FormData();
  formData.append("file", file);
  configAxios();
  try {
    const { data } = await axiosInstance({
      method: "POST",
      url: "/api/user/profile/signature",
      data: formData,
      headers: { ...getHeaders(), "Content-Type": `multipart/form-data` },
    });
    return data;
  } catch (error) {
    return handleError(error);
  }
}

export async function uploadLogo(reqData) {
  const formData = new FormData();
  formData.append("file", reqData.file);
  configAxios();
  try {
    const { data } = await axiosInstance({
      method: "POST",
      url: "/api/user/clinet/logo",
      data: formData,
      headers: { ...getHeaders(), "Content-Type": `multipart/form-data` },
    });
    return data;
  } catch (error) {
    return handleError(error);
  }
}

const SAS_TOKEN_CACHE_MS = 30 * 60 * 1000;
let cachedSasToken = null;
let cachedSasTokenLoadedAt = 0;
let sasTokenRequestInFlight = null;
let sasTokenContext = "client";

export async function getSasToken(forceRefresh = false) {
  const workspace = getWorkspaceSnapshot();
  const contextKey = workspace ? `${workspace.selectedLicenseId}:${workspace.siteId}:${workspace.generation}` : "client";
  if (sasTokenContext !== contextKey) {
    sasTokenContext = contextKey;
    cachedSasToken = null;
    cachedSasTokenLoadedAt = 0;
    sasTokenRequestInFlight = null;
  }
  const cacheAge = Date.now() - cachedSasTokenLoadedAt;
  if (
    !forceRefresh &&
    cachedSasToken &&
    cacheAge >= 0 &&
    cacheAge < SAS_TOKEN_CACHE_MS
  ) {
    return cachedSasToken;
  }

  if (!forceRefresh && sasTokenRequestInFlight) {
    return sasTokenRequestInFlight;
  }

  configAxios();
  sasTokenRequestInFlight = axiosInstance({
    method: "GET",
    url: "/api/site-check/file/sas-token",
    headers: getHeaders(),
  })
    .then(({ data }) => {
      if (sasTokenContext !== contextKey) throw new axios.CanceledError("The workspace changed.");
      cachedSasToken = data;
      cachedSasTokenLoadedAt = Date.now();
      return data;
    })
    .finally(() => {
      if (sasTokenContext === contextKey) sasTokenRequestInFlight = null;
    });

  return sasTokenRequestInFlight;
}

export async function getPdf(id) {
  configAxios();
  try {
    const { data } = await axiosInstance({
      method: "GET",
      url: `/api/site-check/pdf-report/${id}`,
      headers: getHeaders(),
      responseType: "blob",
    });
    return data;
  } catch (error) {
    return handleError(error);
  }
}

export async function getPdfFromUrl(url) {
  configAxios();
  try {
    const { data } = await axiosInstance({
      method: "GET",
      url: url,
      headers: getHeaders(),
      responseType: "blob",
    });
    return data;
  } catch (error) {
    return handleError(error);
  }
}
