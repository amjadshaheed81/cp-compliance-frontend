import axios from "axios";

// Client administration uses the authenticated account, independently of the
// client/site currently open in the workspace. Errors belong to the form.
const client = axios.create({
  baseURL: window.location.origin,
  timeout: 20000,
  withCredentials: true,
  headers: { Accept: "application/json" },
});

const validId = (id) => Number.isSafeInteger(id) && id > 0;
const base = (platform) => platform ? "/api/platform/client-management" : "/api/user";

function clientPath(id, platform) {
  if (!validId(id)) throw new Error("Choose a client from the list.");
  return `${base(platform)}/clients/${id}`;
}

async function request(method, url, data, signal) {
  const response = await client.request({ method, url, data, signal });
  return response.data;
}

export function getManagedClients({ platform = false, signal } = {}) {
  return request("GET", `${base(platform)}/clients`, undefined, signal);
}

export function getManagedClient(id, { platform = false, signal } = {}) {
  return request("GET", clientPath(id, platform), undefined, signal);
}

export function createManagedClient(data, { platform = false, signal } = {}) {
  return request("POST", `${base(platform)}/onboard`, data, signal);
}

export function updateManagedClient(id, data, { platform = false, signal } = {}) {
  return request("PUT", clientPath(id, platform), data, signal);
}

export function setupClientAdministrator(id, data, { signal } = {}) {
  return request("POST", `${clientPath(id, true)}/administrator`, data, signal);
}

export function uploadClientLogo(file, { platform = false, signal } = {}) {
  const data = new FormData();
  data.append("file", file);
  return request("POST", platform ? `${base(true)}/logo` : "/api/user/clinet/logo", data, signal);
}

export function clientManagementError(error, fallback = "The client could not be saved. Please try again.") {
  if (error?.response?.status === 401) return "Your session has ended. Please sign in again.";
  if (error?.response?.status === 403) return "You do not have permission to change this client.";
  const message = error?.response?.data?.message || error?.response?.data?.detail;
  return typeof message === "string" && message.trim() ? message : fallback;
}
