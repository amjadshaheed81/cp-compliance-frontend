import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { getPlatformSession } from "../../api/platform";
import { assertPlatformSession, reloadTo, replaceSessionIdentity } from "../../utils/sessionContext";
import { getPlatformWorkspace, invalidatePlatformWorkspace, markPlatformIdentity, setPlatformSessionClient } from "../../utils/platformWorkspace";

// Client onboarding belongs to the platform account and is available before a
// customer is selected. It never borrows a customer's user or permanent licence.
export default function PlatformAccountGate({ user, children }) {
  const dispatch = useDispatch();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    const verify = async () => {
      try {
        const session = assertPlatformSession(await getPlatformSession({ signal: controller.signal }));
        if (!alive) return;
        if (session.user.id !== user.id) {
          replaceSessionIdentity(dispatch, session.user);
          reloadTo("/platform");
          return;
        }
        const workspace = getPlatformWorkspace();
        if (workspace && workspace.selectedLicenseId !== session.selectedLicenseId) invalidatePlatformWorkspace();
        markPlatformIdentity(true);
        setPlatformSessionClient(session.selectedClient);
        setReady(true);
      } catch (failure) {
        if (!alive || failure?.code === "ERR_CANCELED") return;
        if (failure?.response?.status === 401) { reloadTo("/login"); return; }
        setError("Unable to verify platform access. Return to Client List and try again.");
      }
    };
    void verify();
    return () => { alive = false; controller.abort(); };
  }, [dispatch, user.id]);
  if (error) return <section className="platform-customers-main"><p role="alert">{error}</p><button type="button" className="btn btn-primary" onClick={() => reloadTo("/platform")}>Client List</button></section>;
  return ready ? children : <p role="status">Opening platform administration...</p>;
}
