import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { isPlatformUser } from "../../../utils/sessionContext";

export default function ClientScopeGate({ children }) {
  const user = useSelector((state) => state.site.loggedInUserData);
  if (isPlatformUser(user)) {
    return <Navigate to="/platform" replace />;
  }
  if (!user?.id) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
