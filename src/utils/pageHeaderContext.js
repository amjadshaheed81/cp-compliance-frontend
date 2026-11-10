/**
 * The shared application toolbar is the sole owner of page-level breadcrumbs.
 * Keep this route list aligned with getRoutes.js; it is presentation metadata,
 * not a navigation or permission allowlist.
 */
import { matchPath } from "react-router-dom";

const DASHBOARD = { label: "Dashboard", path: "/dashboard" };
const crumb = (label, path) => ({ label, ...(path ? { path } : {}) });
const withDashboard = (...items) => [DASHBOARD, ...items.map((item) =>
  typeof item === "string" ? crumb(item) : item
)];

const pageRoutes = [
  ["/dashboard", "dashboard", withDashboard("Home")],
  ["/sites", "sites", withDashboard("Portfolio")],
  ["/add-site", "sites", withDashboard("Create Site")],
  ["/update-site", "sites", withDashboard(crumb("Portfolio", "/sites"), "Site Details")],
  ["/documents", "documents", withDashboard("Site Documents")],
  ["/subfolder", "documents", withDashboard(crumb("Site Documents", "/documents"), "Folder")],
  ["/statutory-register", "documents", withDashboard("Statutory Register")],
  ["/site-contracts", "contracts", withDashboard("Site Contracts")],
  ["/user-management", "users", withDashboard("Users")],
  ["/assets", "assets", withDashboard("Site Assets")],
  ["/create-asset", "assets", withDashboard(crumb("Site Assets", "/assets"), "Create Asset")],
  ["/update-asset", "assets", withDashboard(crumb("Site Assets", "/assets"), "Edit Asset")],
  ["/view-asset", "assets", withDashboard(crumb("Site Assets", "/assets"), "View Asset")],
  ["/pre-actions", "actions", withDashboard("Pre-Action")],
  ["/view-update-pre-actions", "actions", withDashboard(crumb("Pre-Action", "/pre-actions"), "View / Edit")],
  ["/pre-action-detail", "actions", withDashboard(crumb("Pre-Action", "/pre-actions"), "Detail")],
  ["/actions", "actions", withDashboard("Actions")],
  ["/action-detail", "actions", withDashboard(crumb("Actions", "/actions"), "Detail")],
  ["/site-checks", "site-checks", withDashboard("Site Checks")],
  ["/site-checks/:id/update", "site-checks", withDashboard(crumb("Site Checks", "/site-checks"), "Inspection")],
  ["/site-check-health", "site-checks", withDashboard(crumb("Site Checks", "/site-checks"), "Health")],
  ["/site-check-scheduler-logs", "site-checks", withDashboard(crumb("Site Checks", "/site-checks"), "Scheduler Logs")],
  ["/energy-cost", "energy", withDashboard("Energy Cost")],
  ["/site-calendar", "calendar", withDashboard("Site Calendar")],
  ["/reports", "reports", withDashboard("Reports")],
  ["/notifications", "notifications", withDashboard("Notifications")],
  ["/edit-profile", "user", withDashboard("Edit Profile")],
  ["/admin/categories", "settings", withDashboard("Admin", "Categories")],
  ["/admin/categories/new", "settings", withDashboard(crumb("Categories", "/admin/categories"), "Add Category")],
  ["/admin/categories/:id/update", "settings", withDashboard(crumb("Categories", "/admin/categories"), "Edit Category")],
  ["/admin/dropdowns", "settings", withDashboard("Admin", "Dropdowns")],
  ["/admin/company", "settings", withDashboard("Admin", "Company")],
  ["/admin/folders", "documents", withDashboard("Admin", "Folders")],
  ["/onboard-client", "clients", withDashboard("Client Administration")],
  ["/platform", "clients", [crumb("Client List")]],
];

export const getPageHeaderContext = (pathname) => {
  const match = pageRoutes.find(([path]) => matchPath({ path, end: true }, pathname));
  return match
    ? { icon: match[1], breadcrumbs: match[2] }
    : { icon: "dashboard", breadcrumbs: withDashboard("Home") };
};

/** Maintain compatibility with older Header.pageContext props (Dashboard and Site Checks). */
export const mergePageHeaderContext = (pathname, explicit) => {
  const routeContext = getPageHeaderContext(pathname);
  if (!explicit) return routeContext;
  const breadcrumbs = Array.isArray(explicit.breadcrumbs)
    ? explicit.breadcrumbs
    : explicit.label
      ? [
          crumb(explicit.parentLabel || "Dashboard", explicit.parentPath || "/dashboard"),
          crumb(explicit.label),
        ]
      : routeContext.breadcrumbs;
  return { ...routeContext, ...explicit, breadcrumbs };
};
