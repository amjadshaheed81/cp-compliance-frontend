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
    return GeneralMenu.filter((item) => item !== "Portfolio");
  }
  return GeneralMenu;
};

export const filterSiteMenuItems = (loggedInRole) => {
  if (loggedInRole !== ROLE.ADMIN) {
    return SiteMenu.filter(
      (item) => item !== "Site Details"
    );
  }
  return GeneralMenu;
};
