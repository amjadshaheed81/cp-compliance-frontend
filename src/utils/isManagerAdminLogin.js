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