import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { clearPlatformClient, getPlatformClients, getPlatformSession, selectPlatformClient } from "../../api/platform";
import { logoutUser } from "../../store/thunk/site";
import { USER_LOGIN } from "../../store/actionTypes";
import {
  announceSessionChange, assertPlatformSession, isPlatformUser, reloadTo,
  replaceSessionIdentity, resetCustomerSession,
} from "../../utils/sessionContext";
import {
  getPlatformWorkspace, invalidatePlatformWorkspace, markPlatformIdentity, setPlatformSessionClient,
} from "../../utils/platformWorkspace";
import SidebarNew from "../common/Sidebar/SidebarNew";
import PageHeaderTrail from "../common/Header/PageHeaderTrail";
import { getPageHeaderContext } from "../../utils/pageHeaderContext";
import ClientEditor from "../ClientManagement/ClientEditor";
import { displayClientDate, isClientId } from "../ClientManagement/clientForm";
import "./PlatformCustomers.css";

function selectionError(error) {
  switch (error?.response?.status) {
    case 400: return "That selection could not be accepted. Choose a client from the list.";
    case 403: return "You cannot open that client. Choose an available client from the refreshed list.";
    case 404: return "That client is no longer available. Choose another client.";
    case 409: return "That client is currently unavailable. You can review its configuration below.";
    default: return "The client selection could not be confirmed. Please try again.";
  }
}

function availability(client) {
  if (client.selectable === true) return "Available";
  if (client.status && client.status !== "Active") return client.status;
  if (client.trialExpiry && new Date(client.trialExpiry).getTime() < Date.now()) return "Expired";
  return "Unavailable";
}

export default function PlatformCustomers() {
  const dispatch = useDispatch();
  const cachedUser = useSelector((state) => state.site.loggedInUserData);
  const cachedUserRef = useRef(cachedUser);
  cachedUserRef.current = cachedUser;
  const mounted = useRef(false);
  const requestVersion = useRef(0);
  const operationInFlight = useRef(false);
  const editorRef = useRef(false);
  const [session, setSession] = useState(null);
  const [clients, setClients] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(null);
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [editor, setEditor] = useState(null);
  editorRef.current = editor !== null;

  const expireSession = useCallback(() => {
    resetCustomerSession(dispatch);
    announceSessionChange();
    reloadTo("/login");
  }, [dispatch]);

  const loadSession = useCallback(async ({ preserveMessage = false } = {}) => {
    const version = ++requestVersion.current;
    setLoading(true);
    if (!preserveMessage) setMessage("");
    try {
      const [response, customers] = await Promise.all([getPlatformSession(), getPlatformClients()]);
      const verified = assertPlatformSession(response);
      if (!Array.isArray(customers) || !customers.every((client) => isClientId(client?.licenseId))) {
        throw new Error("Invalid client list");
      }
      if (!mounted.current || version !== requestVersion.current) return;
      const previous = cachedUserRef.current;
      const identityChanged = Boolean(previous?.id) &&
        (!isPlatformUser(previous) || previous.id !== verified.user.id);
      if (!previous?.id || identityChanged) replaceSessionIdentity(dispatch, verified.user);
      else dispatch({ type: USER_LOGIN, payload: verified.user });
      const workspace = getPlatformWorkspace();
      if (workspace && (workspace.user.id !== verified.user.id || workspace.selectedLicenseId !== verified.selectedLicenseId)) {
        invalidatePlatformWorkspace();
      }
      markPlatformIdentity(true);
      setPlatformSessionClient(verified.selectedClient);
      setSession(verified);
      setClients(customers);
      if (identityChanged) {
        setEditor(null);
        announceSessionChange();
        reloadTo("/platform");
      }
    } catch (error) {
      if (!mounted.current || version !== requestVersion.current) return;
      if (error?.response?.status === 401) expireSession();
      else {
        if (error?.response?.status === 403) {
          invalidatePlatformWorkspace();
          setPlatformSessionClient(null);
          setSession(null);
          setClients([]);
          setEditor(null);
        }
        // Keep a temporary failure separate from the explicit Clear action.
        setMessage(error?.response?.status === 403
          ? "Platform access is unavailable for this account. Sign out to use another account."
          : "Unable to refresh Client List. Check your connection and try again.");
      }
    } finally {
      if (mounted.current && version === requestVersion.current) setLoading(false);
    }
  }, [dispatch, expireSession]);

  useEffect(() => {
    mounted.current = true;
    void loadSession();
    const refreshOnFocus = () => {
      if (!operationInFlight.current && !editorRef.current && document.visibilityState !== "hidden") void loadSession();
    };
    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", refreshOnFocus);
    return () => {
      mounted.current = false;
      requestVersion.current += 1;
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", refreshOnFocus);
    };
  }, [loadSession]);

  const changeSelection = async (licenseId, destination = "/dashboard") => {
    if (operationInFlight.current || loading) return;
    operationInFlight.current = true;
    requestVersion.current += 1;
    setPending(licenseId == null ? "clear" : licenseId);
    setMessage("");
    try {
      const response = licenseId == null ? await clearPlatformClient() : await selectPlatformClient(licenseId);
      const verified = assertPlatformSession(response);
      if (!mounted.current) return;
      if (verified.selectedLicenseId !== licenseId || verified.user.id !== session?.user?.id) {
        throw new Error("The client selection changed before it could be confirmed.");
      }
      invalidatePlatformWorkspace();
      replaceSessionIdentity(dispatch, verified.user);
      markPlatformIdentity(true);
      setPlatformSessionClient(verified.selectedClient);
      setSession(verified);
      announceSessionChange();
      reloadTo(verified.selectionRequired ? "/platform" : destination);
    } catch (error) {
      if (!mounted.current) return;
      if (error?.response?.status === 401) expireSession();
      else {
        setMessage(selectionError(error));
        await loadSession({ preserveMessage: true });
      }
    } finally {
      operationInFlight.current = false;
      if (mounted.current) setPending(null);
    }
  };

  const openClient = (client) => {
    const destination = client.siteCount === 0 ? "/add-site" : "/dashboard";
    if (session?.selectedLicenseId === client.licenseId) reloadTo(destination);
    else void changeSelection(client.licenseId, destination);
  };

  const savedClient = async (client, result) => {
    setEditor(null);
    if (!result.created && session?.selectedLicenseId === client.licenseId) invalidatePlatformWorkspace();
    setNotice(result.administratorCreated ? "Client administrator created." : result.created ? "Client created." : "Client configuration saved.");
    if (result.created && result.openWorkspace) await changeSelection(client.licenseId, "/add-site");
    else await loadSession();
  };

  const signOut = async () => {
    if (operationInFlight.current) return;
    operationInFlight.current = true;
    requestVersion.current += 1;
    setPending("logout");
    const result = await dispatch(logoutUser());
    if (mounted.current && !result?.success) {
      setMessage("Unable to sign out. Check your connection and try again.");
      setPending(null);
      setLoading(false);
    }
    operationInFlight.current = false;
  };

  const selected = session?.selectedClient || null;
  const busy = loading || pending != null;
  const search = query.trim().toLowerCase();
  const visibleClients = clients.filter((client) =>
    `${client.companyName || ""} ${client.companyAddress || ""}`.toLowerCase().includes(search) &&
    (statusFilter === "all" || (statusFilter === "available" ? client.selectable === true : client.selectable !== true))
  );

  return (
    <div className="platform-customers-page">
      {session && <SidebarNew workspaceAvailable={Boolean(getPlatformWorkspace())} />}
      <div className="content">
        <header className="platform-customers-header">
          <div className="platform-customers-brand">{selected?.companyName || "No client selected"}</div>
          <PageHeaderTrail context={getPageHeaderContext("/platform")} />
          <div className="platform-customers-account">
            {session?.user?.name && <span>{session.user.name}</span>}
            <button type="button" className="btn btn-outline-secondary" onClick={signOut} disabled={pending != null}>
              {pending === "logout" ? "Signing out..." : "Sign out"}
            </button>
          </div>
        </header>
        <main className="platform-customers-main">
          <div className="platform-customers-heading">
            <div><h1 className="visually-hidden">Client List</h1><p>Open a client workspace, or manage its configuration.</p></div>
            <div className="platform-customers-buttons">
              <button type="button" className="btn btn-outline-secondary" onClick={() => loadSession()} disabled={busy}>Refresh</button>
              <button type="button" className="btn btn-primary" onClick={() => { setNotice(""); setEditor({ clientId: null }); }} disabled={busy || !session}>Add Client</button>
            </div>
          </div>
          {message && <div className="alert alert-danger" role="alert">{message}</div>}
          {notice && <div className="alert alert-success" role="status">{notice}</div>}
          {selected && <div className="platform-customers-current" aria-label="Selected client">
            <span>Working client: <strong>{selected.companyName || "Unnamed client"}</strong></span>
            <div className="platform-customers-buttons">
              <button type="button" className="btn btn-outline-primary btn-sm" disabled={busy} onClick={() => openClient(selected)}>{selected.siteCount === 0 ? "Add first site" : "Return to workspace"}</button>
              <button type="button" className="btn btn-outline-secondary btn-sm" disabled={busy} onClick={() => changeSelection(null)}>{pending === "clear" ? "Clearing..." : "Clear selection"}</button>
            </div>
          </div>}
          <section className="platform-customers-list" aria-label="Clients">
            <div className="platform-customers-list-heading">
              <label className="platform-customers-search">
                <span>Search clients</span>
                <input type="search" className="form-control" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name or address" />
              </label>
              <label className="platform-customers-filter">
                <span>Availability</span>
                <select className="form-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option value="all">All clients</option><option value="available">Available</option><option value="unavailable">Unavailable</option>
                </select>
              </label>
              <span className="platform-customers-count">{visibleClients.length} of {clients.length} clients</span>
            </div>
            {loading && <div className="platform-customers-loading" role="status">Refreshing clients...</div>}
            <div className="table-responsive">
              <table className="table platform-customers-table">
                <thead><tr><th scope="col">Client</th><th scope="col">Status</th><th scope="col">Sites</th><th scope="col">Licence expiry</th><th scope="col"><span className="visually-hidden">Actions</span></th></tr></thead>
                <tbody>
                  {visibleClients.map((client) => {
                    const isSelected = session?.selectedLicenseId === client.licenseId;
                    const canSelect = client.selectable === true;
                    const name = client.companyName || "Unnamed client";
                    const count = Number.isSafeInteger(client.siteCount) && client.siteCount >= 0 ? client.siteCount : null;
                    return <tr key={client.licenseId} className={isSelected ? "platform-customers-current-row" : undefined}>
                      <th scope="row"><strong>{name}</strong>{isSelected && <span className="platform-customers-selected-label">Selected</span>}<span className="platform-customers-address">{client.companyAddress || "Address not provided"}</span></th>
                      <td><span className={`platform-customers-status ${canSelect ? "is-available" : "is-unavailable"}`}>{availability(client)}</span></td>
                      <td>{count == null ? "—" : `${count} / ${client.allowedSites}`}</td>
                      <td>{displayClientDate(client.trialExpiry)}</td>
                      <td className="platform-customers-action">
                        <div className="platform-customers-buttons">
                          <button type="button" className="btn btn-outline-secondary btn-sm" disabled={busy} onClick={() => { setNotice(""); setEditor({ clientId: client.licenseId }); }} aria-label={`Configure ${name}`}>Configure</button>
                          <button type="button" className="btn btn-primary btn-sm" disabled={busy || !canSelect} onClick={() => openClient(client)} aria-label={`${count === 0 ? "Add first site for" : "Open"} ${name}`}>
                            {pending === client.licenseId ? "Opening..." : count === 0 ? "Add first site" : "Open client"}
                          </button>
                        </div>
                      </td>
                    </tr>;
                  })}
                  {!loading && visibleClients.length === 0 && <tr><td colSpan={5} className="platform-customers-empty-list">{clients.length === 0 ? "No clients yet. Add a client to get started." : "No clients match your search or availability filter."}</td></tr>}
                </tbody>
              </table>
            </div>
            <p className="platform-customers-list-note">Sites shows the number used and the licence allowance. You can configure inactive or expired clients before opening their workspace.</p>
          </section>
        </main>
      </div>
      {editor && <ClientEditor key={editor.clientId || "new"} clientId={editor.clientId} platform onClose={() => setEditor(null)} onSaved={savedClient} onSessionExpired={expireSession} />}
    </div>
  );
}
