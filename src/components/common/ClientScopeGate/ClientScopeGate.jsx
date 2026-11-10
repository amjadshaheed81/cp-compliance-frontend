import React from "react";
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import { isPlatformUser } from "../../../utils/sessionContext";
import PlatformWorkspaceGate from "../../Platform/PlatformWorkspaceGate";
import PlatformAccountGate from "../../Platform/PlatformAccountGate";

export default function ClientScopeGate({ children }) {
  const user = useSelector((state) => state.site.loggedInUserData);
  const { pathname } = useLocation();
  if (isPlatformUser(user)) {
    if (pathname === "/onboard-client") return <PlatformAccountGate user={user}>{children}</PlatformAccountGate>;
    return <PlatformWorkspaceGate user={user}>{children}</PlatformWorkspaceGate>;
  }
  if (!user?.id) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
