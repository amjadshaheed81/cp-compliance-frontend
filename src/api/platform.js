import axios from "axios";

// Platform errors are handled by the workspace, without the legacy 403 logout redirect.
async function request(method, url, data) {
  return axios.request({
    baseURL: window.location.origin,
    method,
    url,
    data,
    timeout: 15000,
    withCredentials: true,
    headers: { Accept: "application/json" },
  });
}

export async function getPlatformSession() {
  return (await request("GET", "/api/platform/session")).data;
}

export async function getPlatformClients() {
  return (await request("GET", "/api/platform/clients")).data;
}

export async function selectPlatformClient(licenseId) {
  return (await request("POST", "/api/platform/client-context", { licenseId })).data;
}

export async function clearPlatformClient() {
  return (await request("DELETE", "/api/platform/client-context")).data;
}

export async function logoutSession() {
  const response = await request("POST", "/api/user/logout");
  if (response.status !== 204) {
    throw new Error("Sign-out was not confirmed.");
  }
}
