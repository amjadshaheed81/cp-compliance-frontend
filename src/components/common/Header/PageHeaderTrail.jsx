import React from "react";
import DashboardIcon from "@mui/icons-material/Dashboard";
import BusinessIcon from "@mui/icons-material/Business";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import FolderIcon from "@mui/icons-material/Folder";
import BuildIcon from "@mui/icons-material/Build";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import ChecklistIcon from "@mui/icons-material/Checklist";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import SignalCellularAltIcon from "@mui/icons-material/SignalCellularAlt";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

const icons = {
  dashboard: DashboardIcon,
  sites: BusinessIcon,
  clients: BusinessIcon,
  users: PeopleAltIcon,
  documents: FolderIcon,
  assets: BuildIcon,
  actions: AssignmentIndIcon,
  contracts: AssignmentIndIcon,
  "site-checks": ChecklistIcon,
  calendar: CalendarTodayIcon,
  energy: ElectricBoltIcon,
  reports: SignalCellularAltIcon,
  notifications: NotificationsNoneIcon,
  user: AccountCircleIcon,
  settings: AdminPanelSettingsIcon,
};

/** Compact, accessible breadcrumb shared by regular and platform pages. */
export default function PageHeaderTrail({ context, onNavigate }) {
  if (!context) return null;
  const Icon = icons[context.icon] || DashboardIcon;
  const breadcrumbs = context.breadcrumbs || [];
  return (
    <div className="app-header-page-context dont-print">
      <nav className="app-header-page-context__breadcrumb" aria-label="Page breadcrumb">
        <Icon className="app-header-page-context__icon" fontSize="small" aria-hidden="true" />
        {breadcrumbs.map((entry, index) => {
          const last = index === breadcrumbs.length - 1;
          return (
            <React.Fragment key={`${entry.label}-${index}`}>
              {index > 0 && <span className="app-header-page-context__separator" aria-hidden="true">/</span>}
              {!last && entry.path && onNavigate ? (
                <button type="button" className="app-header-page-context__link" onClick={() => onNavigate(entry.path)}>{entry.label}</button>
              ) : (
                <span className={last ? "app-header-page-context__current" : "app-header-page-context__parent"} aria-current={last ? "page" : undefined}>{entry.label}</span>
              )}
            </React.Fragment>
          );
        })}
      </nav>
      {context.detail && <span className="app-header-page-detail" title={context.detail}>{context.detail}</span>}
      {context.status && (
        <span className={`app-header-status ${String(context.status).toLowerCase() === "done" ? "is-done" : ""}`}>
          {context.status}
        </span>
      )}
      {context.recordCount !== undefined && context.recordCount !== null && Number.isFinite(Number(context.recordCount)) && (
        <span className="app-header-record-pill" aria-label={`${context.recordCount} records`}>
          <span>Records</span><strong>{context.recordCount}</strong>
        </span>
      )}
    </div>
  );
}
