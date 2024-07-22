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
