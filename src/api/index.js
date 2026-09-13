import axios from "axios";

let axiosInstance = axios.create({
  baseURL: window?.location?.origin, //window?.location?.origin,
  timeout: 2000000,
});

function configAxios() {
  axiosInstance = axios.create({
    baseURL: window?.location?.origin, //,
    timeout: 2000000,
  });
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => handleError(error)
  );
}

function handleError(error) {
  console.error("API Error:", error);

  if (error.response) {
    const { status } = error.response;
    const requestUrl = String(error?.config?.url || "");
    const isLoginRequest = requestUrl.includes("/api/user/login");
    const suppressAuthRedirect = Boolean(error?.config?.suppressAuthRedirect);

    // A rejected login must be handled by the login screen so the user sees
    // the real error. Optional background work must never log the user out.
    if (
      (status === 401 || status === 403) &&
      !isLoginRequest &&
      !suppressAuthRedirect
    ) {
      localStorage.clear();
      window.location.href = "/#/login";
    }

    if (status === 500) {
      const errorMessage = String(error?.response?.data?.message || "");
      if (
        !suppressAuthRedirect &&
        (errorMessage.includes("JWT expired at") ||
          errorMessage.includes("JWT String argument cannot be null or empty."))
      ) {
        localStorage.clear();
        window.location.href = "/#/login";
      }
    }
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
    return axiosInstance({
      method: "POST",
      url,
      data: userData,
      headers: getHeaders(),
    });
  } catch (error) {
    return handleError(error);
  }
}


export function postWithTimeout(url, userData, timeoutMs = 20000) {
  configAxios();
  return axiosInstance({
    method: "POST",
    url,
    data: userData,
    headers: getHeaders(),
    timeout: timeoutMs,
  });
}

export async function getWithTimeout(url, timeoutMs = 15000) {
  configAxios();
  try {
    const res = await axiosInstance({
      method: "GET",
      url,
      headers: getHeaders(),
      timeout: timeoutMs,
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
  return axiosInstance({
    method: "PUT",
    url,
    data,
    headers: getHeaders(),
    timeout: timeoutMs,
    suppressAuthRedirect,
  });
}

export function postMultiPartFormData(url, userData) {
  configAxios();
  try {
    return axiosInstance({
      method: "POST",
      url,
      data: userData,
      headers: { ...getHeaders(), "Content-Type": "multipart/form-data" },
    });
  } catch (error) {
    return handleError(error);
  }
}

export function putMultiPartFormData(url, userData) {
  configAxios();
  try {
    return axiosInstance({
      method: "PUT",
      url,
      data: userData,
      headers: { ...getHeaders(), "Content-Type": "multipart/form-data" },
    });
  } catch (error) {
    return handleError(error);
  }
}

export function del(url, payload) {
  configAxios();
  try {
    return axiosInstance({
      method: "DELETE",
      url,
      headers: getHeaders(),
      data: payload,
    });
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
    return axiosInstance({
      method: "PUT",
      url,
      data: data,
      headers: getHeaders(),
    });
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

export async function getSasToken() {
  configAxios();
  try {
    const { data } = await axiosInstance({
      method: "GET",
      url: "/api/site-check/file/sas-token",
      headers: getHeaders(),
    });
    return data;
  } catch (error) {
    return handleError(error);
  }
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
