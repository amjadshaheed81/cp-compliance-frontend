import axios from "axios";

let axiosInstance = axios.create({
  baseURL: "http://ccp-util-man.ukwest.cloudapp.azure.com",
  timeout: 20000,
});

function configAxios() {
  axiosInstance = axios.create({
    baseURL: "http://ccp-util-man.ukwest.cloudapp.azure.com",
    timeout: 20000,
  });
}

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
