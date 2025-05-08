import { ROLE } from "../Constant/Role";

export const isManagerAdminLogin = (loggedInUserData) => {
  if (
    loggedInUserData?.role === ROLE.ADMIN ||
    loggedInUserData?.role === ROLE.MANAGER
  ) {
    return true;
  }
  return false;
};

export const isAdminLogin = (loggedInUserData) => {
  if (
    loggedInUserData?.role === ROLE.ADMIN
  ) {
    return true;
  }
  return false;
};

export const isViewRoleForActions = (loggedInUserData) => {
  if (
    loggedInUserData?.role === ROLE.SITE_USERS || loggedInUserData?.role === ROLE.SURVEYOR
  ) {
    return true;
  }
  return false;
};

export const isTopLevelUser = (loggedInUserData) => {
  if (
    loggedInUserData?.role === ROLE.PROPERTY_MANAGER || loggedInUserData?.role === ROLE.MANAGER
    || loggedInUserData?.role === ROLE.SITE_ACTION_MANAGER  || loggedInUserData?.role === ROLE.ADMIN
  ) {
    return true;
  }
  return false;
};