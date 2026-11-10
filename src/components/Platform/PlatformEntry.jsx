import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Navigate, Link } from "react-router-dom";
import { resolvePlatformEntry } from "../../utils/platformEntry";
import { replaceSessionIdentity, resetCustomerSession } from "../../utils/sessionContext";
import { installPlatformWorkspace, invalidatePlatformWorkspace, setPlatformSessionClient } from "../../utils/platformWorkspace";

export default function PlatformEntry() {
  const dispatch = useDispatch();
  const [destination, setDestination] = useState(null);
  const [message, setMessage] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let alive = true;
    setMessage("");
    invalidatePlatformWorkspace();
    resolvePlatformEntry({ signal: controller.signal }).then(({ session, workspace, destination: next }) => {
      if (!alive) return;
      if (workspace) installPlatformWorkspace(workspace, dispatch);
      else {
        replaceSessionIdentity(dispatch, session.user);
        setPlatformSessionClient(null);
      }
      setDestination(next);
    }).catch((error) => {
      if (!alive || error?.code === "ERR_CANCELED") return;
      if (error?.response?.status === 401) {
        resetCustomerSession(dispatch);
        setDestination("/login");
      } else if ([403, 409].includes(error?.response?.status)) {
        setDestination("/platform");
      } else {
        setMessage("Your client workspace could not be opened. Your saved selection has been kept. Please retry.");
      }
    });
    return () => { alive = false; controller.abort(); };
  }, [dispatch, attempt]);
  if (destination) return <Navigate to={destination} replace />;
  return <main className="platform-customers-main" aria-live="polite">
    <h1>Opening your workspace</h1>
    {message ? <><p role="alert">{message}</p><button className="btn btn-primary me-2" onClick={() => setAttempt(attempt + 1)}>Retry</button><Link to="/platform">Client List</Link></> : <p role="status">Checking your saved client and site…</p>}
  </main>;
}
