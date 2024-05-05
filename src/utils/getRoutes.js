import ChangePassword from "../components/ChangePassword/ChangePassword";
import ForgotPassword from "../components/ForgotPassword/ForgotPassword";
import LoginForm from "../components/Login/LoginForm";
import PageNotFound from "../components/PageNotFound/PageNotFound";
import Dashboard from "../components/Protected/Dashboard";
import Sites from "../components/Protected/Sites";
import AddSite from "../components/Protected/Sites/AddSite";
import UpdateSite from "../components/Protected/Sites/UpdateSite";

export const getRoutes = () => {
  return [
    {
      path: "/",
      element: <LoginForm />,
      errorElement: <PageNotFound />,
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
      element: <AddSite />,
    },
    {
      path: "/update-site",
      element: <UpdateSite />,
    },
    {
      path: "/sites",
      element: <Sites />,
    },
  ];
};
