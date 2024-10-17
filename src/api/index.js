import axios from "axios";

let axiosInstance = axios.create({
  baseURL: window?.location?.origin,
  //baseURL: "http://ccp-util-man.ukwest.cloudapp.azure.com",
  //baseURL: "http://cpc-beta.ukwest.cloudapp.azure.com",
  timeout: 2000000,
});

function configAxios() {
  axiosInstance = axios.create({
    baseURL: window?.location?.origin,
    //baseURL: "http://ccp-util-man.ukwest.cloudapp.azure.com",
    //baseURL: "http://cpc-beta.ukwest.cloudapp.azure.com",
    timeout: 2000000,
  });
  axiosInstance.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (error.response && error.response.status === 500) {
        const errorMessage = error.response.data.message;
        if (errorMessage.includes('JWT expired at')) {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
  
      // Return a rejected promise with the error
      return Promise.reject(error);
    }
  );
}

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 500) {
      const errorMessage = error.response.data.message;
      if (errorMessage.includes('JWT expired at')) {
        localStorage.clear();
        window.location.href = '/login';
      }
    }

    // Return a rejected promise with the error
    return Promise.reject(error);
  }
);

function getSubscriptionKey() {
  let key = "";
  const dev = "dev.mployr.com";
  const beta = "beta.mployr.com";
  const prod = "mployr.com";
  const hostname = "localhost";
  const location = window?.location?.host;
  const protocols = !!(window?.location?.protocol === "https:");
  if (protocols && (dev === location || beta === location)) {
    key = "afd51e770091478b9d44869ef67a0d7e";
  } else if (protocols && prod === location) {
    key = "864f3eab5dd54ebebc75c06f48212793";
  } else if (window?.location?.hostname === hostname) {
    key = "afd51e770091478b9d44869ef67a0d7e";
  }
  // console.log("key", key);
  return key;
}

function getHeaders() {
  const token = localStorage.getItem("mployr-token");
  return {
    // Authorization: token && `Token ${token}`,
    "Access-Control-Allow-Origin": "*",
    // 'subscription-key': getSubscriptionKey(),
    // 'x-correlation-id': getLocalStorage(CORRELATION_ID)
  };
}

export function post(url, userData) {
  configAxios();
  return axiosInstance({
    method: "POST",
    url,
    data: userData,
    headers: getHeaders(),
  });
}

export function postMultiPartFormData(url, userData) {
  configAxios();
  return axiosInstance({
    method: "POST",
    url,
    data: userData,
    headers: {...getHeaders(), 'Content-Type': 'multipart/form-data'},
  });
}


export function putMultiPartFormData(url, userData) {
  configAxios();
  return axiosInstance({
    method: "PUT",
    url,
    data: userData,
    headers: {...getHeaders(), 'Content-Type': 'multipart/form-data'},
  });
}

// delete is a reserved name so don't use that
export function del(url) {
  configAxios();
  return axiosInstance({
    method: "DELETE",
    url,
    headers: getHeaders(),
  });
}

export async function get(url) {
  configAxios();
  const { data } = await axiosInstance({
    method: "GET",
    url,
    headers: getHeaders(),
  });
  return data;
}

export function put(url, data) {
  configAxios();
  return axiosInstance({
    method: "PUT",
    url,
    data: data,
    headers: getHeaders(),
  });
}
export function uploadPhoto(url, formData) {
  configAxios();
  return axiosInstance({
    method: "POST",
    url,
    data: formData,
    headers: {...getHeaders(), 'Content-Type': `multipart/form-data`},
  });
}

export async function uploadNewVersion(url, formData) {
  configAxios();
  return axiosInstance({
    method: "PUT",
    url,
    data: formData,
    headers: {...getHeaders(), 'Content-Type': `multipart/form-data`},
  });
}

export async function uploadSiteCheckDoc(reqData) {
  const formData = new FormData();
  formData.append("siteId", reqData.siteId);
  formData.append("file", reqData.file);
  formData.append("fileName", reqData.file?.name);
  formData.append("folderName", reqData.folderName ? reqData.folderName : "others");
  configAxios();
  const { data } = await axiosInstance({
    method: "POST",
    url: "/api/site-check/file/upload",
    data: formData,
    headers: { ...getHeaders(), 'Content-Type': `multipart/form-data` },
  });
  return data;
}

export async function getSasToken() {
  configAxios();
  const { data } = await axiosInstance({
    method: "GET",
    url: "/api/site-check/file/sas-token",
    headers: getHeaders(),
  });
  return data;
}

export async function getPdf(id) {
  configAxios();
  const { data } = await axiosInstance({
    method: "GET",
    url: "/api/site-check/pdf-report/"+id,
    headers: getHeaders(),
    responseType: 'blob',
  });
  return data;
}


