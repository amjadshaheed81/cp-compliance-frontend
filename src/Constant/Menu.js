import { ROLE } from "./Role";

export const combinedMenu = [
  {key: 1, label: "Dashboard", type: "General"},
  {key: 2, label: "Edit Profile", type: "General"},
  {key: 3, label: "Portfolio", type: "General"},
  {key: 4, label: "Reports", type: "General"},
  {key: 5, label: "Users", type: "General"},
  {key: 6, label: "Notifications", type: "General"},
  {key: 7, label: "Actions", type: "General"},
  {key: 8, label: "Create Site", type: "Site"},
  {key: 9, label: "Site Details", type: "Site"},
  {key: 10, label: "Site Documents", type: "Site"},
  {key: 11, label: "Statutory Register", type: "Site"},
  {key: 12, label: "Site Assets", type: "Site"},
  {key: 13, label: "Site Contracts", type: "Site"},
  {key: 14, label: "Pre-Action", type: "Site"},
  {key: 15, label: "Site Checks", type: "Site"},
  {key: 16, label: "Energy Cost", type: "Site"},
  {key: 17, label: "Site Calendar", type: "Site"},

];

// export const GeneralMenu = [
//   "Dashboard",
//   "Edit Profile",
//   "Portfolio",
//   "Reports",
//   "Users",
//   "Notifications",
//   "Actions",
// ];

// export const SiteMenu = [
//   "Create Site",
//   "Site Details",
//   "Site Documents",
//   "Statutory Register",
//   "Site Assets",
//   "Site Contracts",
//   "Pre-Action",
//   "Site Checks",
//   "Energy Cost",
//   "Site Calendar",
// ];

export const filterMenuItems = (loggedInRole) => {
  const license = JSON.parse(localStorage.getItem('license'));
  const allowedMenus = license?.modules?.length > 0 ? license?.modules?.split(",") : [];
  const generalMenu = combinedMenu.filter(m=>m.type === "General" && allowedMenus.includes(String(m.key))).map(k=> k.label);
  if (loggedInRole !== ROLE.ADMIN) {
    return generalMenu.filter((item) => item !== "Users" && item !== "Edit Profile");
  }
  return generalMenu;
};

const siteContractsPreActionallowedRoles = [
  ROLE.MANAGER,
  ROLE.SITE_ACTION_MANAGER,
  ROLE.SITE_USERS,
  ROLE.CARE_TAKER,
];

export const filterSiteMenuItems = (loggedInRole) => {
  const license = JSON.parse(localStorage.getItem('license'));
  const allowedMenus = license?.modules?.length > 0 ? license?.modules?.split(",") : [];
  const siteMenu = combinedMenu.filter(m=>m.type === "Site" && allowedMenus.includes(String(m.key))).map(k=> k.label);
  
  //const siteMenu = combinedMenu.filter(m=>m.type === "Site").map(k=> k.label);
  
  if (loggedInRole !== ROLE.ADMIN) {
    if (!siteContractsPreActionallowedRoles.includes(loggedInRole)) {
      return siteMenu.filter((item) => item !== "Site Contracts" && item !== "Pre-Action" && item !== "Create Site");
    }
    return siteMenu.filter(
      (item) => item !== "Create Site"
    );
  } 
  return siteMenu;
};
