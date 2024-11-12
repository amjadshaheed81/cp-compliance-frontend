import { ROLE } from "./Role";

export const GeneralMenu = [
  "Dashboard",
  "Edit Profile",
  "Portfolio",
  "Reports",
  "Users",
  "Notifications",
  "Actions",
];

export const SiteMenu = [
  "Create Site",
  "Site Details",
  "Site Documents",
  "Statutory Register",
  "Site Assets",
  "Site Contracts",
  "Pre-Action",
  "Site Checks",
  "Energy Cost",
  "Site Calendar",
];

export const filterMenuItems = (loggedInRole) => {
  if (loggedInRole !== ROLE.ADMIN) {
    return GeneralMenu.filter((item) => item !== "Users" && item !== "Edit Profile");
  }
  return GeneralMenu;
};

const siteContractsPreActionallowedRoles = [
  ROLE.MANAGER,
  ROLE.SITE_ACTION_MANAGER,
  ROLE.SITE_USERS,
  ROLE.CARE_TAKER,
];

export const filterSiteMenuItems = (loggedInRole) => {
  if (loggedInRole !== ROLE.ADMIN) {
    if (!siteContractsPreActionallowedRoles.includes(loggedInRole)) {
      return SiteMenu.filter((item) => item !== "Site Contracts" && item !== "Pre-Action" && item !== "Create Site");
    }
    return SiteMenu.filter(
      (item) => item !== "Create Site"
    );
  } 
  return SiteMenu;
};
