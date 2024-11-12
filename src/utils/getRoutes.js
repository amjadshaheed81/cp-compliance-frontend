import ChangePassword from "../components/ChangePassword/ChangePassword";
import ForgotPassword from "../components/ForgotPassword/ForgotPassword";
import LoginForm from "../components/Login/LoginForm";
import PageNotFound from "../components/PageNotFound/PageNotFound";
import Dashboard from "../components/Protected/Dashboard";
import Sites from "../components/Protected/Sites";
import AddSite from "../components/Protected/Sites/AddSite";
import UpdateSite from "../components/Protected/Sites/UpdateSite";
import Tabs from "../components/Protected/Sites/AddSite/SiteTabs";
import SiteChart from "../components/Protected/Sites/UpdateSite/SiteChart";
import SiteInformation from "../components/Protected/Sites/UpdateSite/SiteInformation";
import Document from "../components/Protected/Sites/Documents";
import Projects from "../components/Protected/Sites/Projects";
import Contracts from "../components/Protected/Sites/Contracts";
import SubFolder from "../components/Protected/Sites/Documents/SubFolder";
import Users from "../components/Protected/Users";
import AdminCategories from "../components/Protected/Admin/AdminCategories";
import AdminCategoriesAdd from "../components/Protected/Admin/AdminCategoriesAdd";
import AdminCategoriesEdit from "../components/Protected/Admin/AdminCategoriesEdit";
import AdminDropdowns from "../components/Protected/Admin/AdminDropdowns";
import CompanyManagement from "../components/Protected/Admin/CompanyManagement";
import Assets from "../components/Protected/Sites/Assets";
import CreateAsset from "../components/Protected/Sites/Assets/CreateAsset";
import PreActions from "../components/Protected/Sites/PreActions";
import Actions from "../components/Protected/Sites/Actions"
import SiteCalendar from "../components/Protected/Sites/SiteCalendar";
import ViewCreatePreActions from "../components/Protected/Sites/PreActions/ViewCreatePreActions";
import SiteChecks from "../components/Protected/Sites/SiteChecks";
import UpdateSiteCheck from "../components/Protected/Sites/SiteChecks/UpdateSiteCheck";
import UpdateAsset from "../components/Protected/Sites/Assets/UpdateAsset";
import ViewEditPreAction from "../components/Protected/Sites/PreActions/ViewEditPreAction";
import EditAction from "../components/Protected/Sites/Actions/EditAction"
import { ROLE } from "../Constant/Role";
import StatutoryRegister from "../components/Protected/Sites/StatutoryRegister";
import EnergyCost from "../components/Protected/Sites/EnergyCost";
import ViewAsset from "../components/Protected/Sites/Assets/ViewAsset";
import EditProfile from "../components/Protected/Users/EditProfile";
import Notifications from "../components/Protected/Notifications";
import Reports from "../components/Protected/Reports";

export const getRoutes = () => {
  const tabs = [
    {
      label: "Basic Details",
      Component: <AddSite />,
    },
    {
      label: "Floor Layout & Plan",
      Component: <SiteChart />,
    },
    {
      label: "Site Information",
      Component: <SiteInformation />,
    },
  ];
  const UpdateSiteTabs = [
    {
      label: "Basic Details",
      Component: <UpdateSite />,
    },
    {
      label: "Floor Layout & Plan",
      Component: <SiteChart />,
    },
    {
      label: "Site Information",
      Component: <SiteInformation />,
    },
  ];
  return [
    {
      path: "/",
      element: <LoginForm />,
    },
    {
      path: "/login",
      element: <LoginForm />,
    },
    {
      path: "/forgot-password",
      element: <ForgotPassword />,
    },
    {
      path: "/change-password",
      element: <ChangePassword />,
    },
    {
      path: "/dashboard",
      element: <Dashboard />,
    },
    {
      path: "/add-site",
      element: <Tabs tabs={tabs} isCreateSite={true} />,
      allowedRoles: [ROLE.ADMIN], // only admin can access this route
    },
    {
      path: "/update-site",
      element: <Tabs tabs={UpdateSiteTabs} isCreateSite={false} />,
    },
    {
      path: "/sites",
      element: <Sites />,
      // allowedRoles: [ROLE.ADMIN], // only admin can access this route
    },
    {
      path: "/documents",
      element: <Document />,
    },
    {
      path: "/statutory-register",
      element: <StatutoryRegister />,
    },
    {
      path: "/site-contracts",
      element: <Contracts />,
      allowedRoles: [
        ROLE.ADMIN,
        ROLE.MANAGER,
        ROLE.SITE_ACTION_MANAGER,
        ROLE.SITE_USERS,
        ROLE.CARE_TAKER,
      ],
    },
    {
      path: "/subfolder",
      element: <SubFolder />,
    },
    {
      path: "/user-management",
      element: <Users />,
      allowedRoles: [ROLE.ADMIN], // only admin can access this route
    },
    {
      path: "/assets",
      element: <Assets />,
    },
    {
      path: "/create-asset",
      element: <CreateAsset />,
    },
    {
      path: "/pre-actions",
      element: <PreActions />,
      allowedRoles: [
        ROLE.ADMIN,
        ROLE.MANAGER,
        ROLE.SITE_ACTION_MANAGER,
        ROLE.SITE_USERS,
        ROLE.CARE_TAKER,
      ],
    },
    {
      path: "/actions",
      element: <Actions />,
    },
    {
      path: "/view-update-pre-actions",
      element: <ViewCreatePreActions />,
    },
    {
      path: "/site-checks",
      element: <SiteChecks />,
    },
    {
      path: "/energy-cost",
      element: <EnergyCost />,
    },
    {
      path: "/site-checks/:id/update",
      element: <UpdateSiteCheck />,
    },
    {
      path: "/admin/categories",
      element: <AdminCategories />,
      allowedRoles: [ROLE.ADMIN], // only admin can access this route
    },
    {
      path: "/admin/dropdowns",
      element: <AdminDropdowns />,
      allowedRoles: [ROLE.ADMIN], // only admin can access this route
    },
    {
      path: "/admin/company",
      element: <CompanyManagement />,
      allowedRoles: [ROLE.ADMIN], // only admin can access this route
    },
    {
      path: "/admin/categories/new",
      element: <AdminCategoriesAdd />,
      allowedRoles: [ROLE.ADMIN], // only admin can access this route
    },
    {
      path: "/admin/categories/:id/update",
      element: <AdminCategoriesEdit />,
      allowedRoles: [ROLE.ADMIN], // only admin can access this route
    },
    {
      path: "/update-asset",
      element: <UpdateAsset />,
    },
    {
      path: "/view-asset",
      element: <ViewAsset />,
    },
    {
      path: "/pre-action-detail",
      element: <ViewEditPreAction />,
    },

    {
      path: "/action-detail",
      element: <EditAction />,
    },
    
    {
      path: "/site-calendar",
      element: <SiteCalendar />,
    },
    {
      path: "/edit-profile",
      element: <EditProfile />,
      allowedRoles: [ROLE.ADMIN], // only admin can access this route
    },
    {
      path: "/notifications",
      element: <Notifications />,
    },
    {
      path: "/reports",
      element: <Reports />,
    },
  ];
};
