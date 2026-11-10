import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import { getPlatformSession, getPlatformWorkspaceContext } from "../../api/platform";
import { assertPlatformSession, reloadTo, resetCustomerSession } from "../../utils/sessionContext";
import {
  changePlatformCustomer, getPlatformWorkspace, installPlatformWorkspace,
  invalidatePlatformWorkspace, markPlatformIdentity, platformWorkspacePathAllowed,
  platformWorkspacePathNeedsSite,
  WORKSPACE_CHANGED_EVENT,
} from "../../utils/platformWorkspace";

export default function PlatformWorkspaceGate({ user, children }) {
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const [workspace, setWorkspace] = useState(() => getPlatformWorkspace());
  const [checking, setChecking] = useState(!workspace);
  const [message, setMessage] = useState("");
  const [retry, setRetry] = useState(0);
  const alive = useRef(false);
  const requestVersion = useRef(0);

  useEffect(() => {
    alive.current = true;
    markPlatformIdentity(true);
    let inFlight = false;
    const controller = new AbortController();
    const verify = async () => {
      if (inFlight) return;
      inFlight = true;
      const version = ++requestVersion.current;
      setChecking(true);
      setMessage("");
      try {
        const session = assertPlatformSession(await getPlatformSession({ signal: controller.signal }));
        if (!alive.current || version !== requestVersion.current) return;
        if (session.selectionRequired) {
          invalidatePlatformWorkspace();
          reloadTo("/platform");
          return;
        }
        const active = getPlatformWorkspace();
        if (session.user.id !== user.id || (active && (active.user.id !== session.user.id || active.selectedLicenseId !== session.selectedLicenseId))) {
          invalidatePlatformWorkspace();
          reloadTo("/platform/continue");
          return;
        }
        if (!active) {
          const response = await getPlatformWorkspaceContext(session.selectedLicenseId, { signal: controller.signal });
          if (!alive.current || version !== requestVersion.current) return;
          if (response?.selectedLicenseId !== session.selectedLicenseId || response?.user?.id !== session.user.id) {
            throw new Error("The customer selection changed. Choose the customer again.");
          }
          setWorkspace(installPlatformWorkspace(response, dispatch));
        } else {
          setWorkspace(active);
        }
        setChecking(false);
      } catch (error) {
        if (!alive.current || version !== requestVersion.current || error?.code === "ERR_CANCELED") return;
        const status = error?.response?.status;
        if (status === 401) { resetCustomerSession(dispatch); invalidatePlatformWorkspace(); reloadTo("/login"); return; }
        if (status === 403 || status === 409) { invalidatePlatformWorkspace(); reloadTo("/platform"); return; }
        setMessage("Unable to verify this customer workspace. Retry or choose another customer.");
      } finally {
        inFlight = false;
      }
    };
    const onFocus = () => { if (document.visibilityState !== "hidden") void verify(); };
    const onContextChange = () => setWorkspace(getPlatformWorkspace());
    void verify();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener(WORKSPACE_CHANGED_EVENT, onContextChange);
    return () => {
      alive.current = false;
      requestVersion.current += 1;
      controller.abort();
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener(WORKSPACE_CHANGED_EVENT, onContextChange);
    };
  }, [dispatch, user.id, retry]);

  if (!platformWorkspacePathAllowed(pathname)) return <Navigate to="/dashboard" replace />;
  const ready = Boolean(workspace && workspace.user.id === user.id);
  if (!checking && !message && ready && !workspace.sites.length &&
      (pathname === "/sites" || platformWorkspacePathNeedsSite(pathname))) {
    return <Navigate to="/add-site" replace />;
  }
  return (
    <>
      {(checking || !ready || message) && (
        <section className="platform-customers-main" aria-live="polite">
          {message ? <div className="alert alert-danger" role="alert">{message}</div> : <p role="status">Opening customer workspace...</p>}
          {message && <button type="button" className="btn btn-primary me-2" onClick={() => setRetry((value) => value + 1)}>Retry</button>}
          <button type="button" className="btn btn-outline-secondary" onClick={changePlatformCustomer}>Change client</button>
        </section>
      )}
      {ready && (
        <div key={`${workspace.selectedLicenseId}:${workspace.selectedSite?.siteId || "empty"}`}
          style={checking || message ? { display: "none" } : undefined}>
          {children}

        </div>
      )}
    </>
  );
}
