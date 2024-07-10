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

export const filterMenuItemsForAdmin = (loggedInRole) => {
  if (loggedInRole !== ROLE.ADMIN) {
    return GeneralMenu.filter((item) => item !== "Portfolio");
  }
  return GeneralMenu;
};
