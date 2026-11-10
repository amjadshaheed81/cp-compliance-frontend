import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Header from "../../common/Header/Header";
import SidebarNew from "../../common/Sidebar/SidebarNew";
import PlatformCustomers from "../../Platform/PlatformCustomers";
import ClientEditor from "../../ClientManagement/ClientEditor";
import { displayClientDate, isClientId } from "../../ClientManagement/clientForm";
import { clientManagementError, getManagedClients } from "../../../api/clientManagement";
import { announceSessionChange, isPlatformUser, reloadTo, resetCustomerSession } from "../../../utils/sessionContext";
import "../../ClientManagement/ClientManagement.css";

function LegacyClientAdministration({ user }) {
  const dispatch = useDispatch();
  const mounted = useRef(false);
  const requestVersion = useRef(0);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [editor, setEditor] = useState(null);
  const [query, setQuery] = useState("");

  const expireSession = useCallback(() => {
    resetCustomerSession(dispatch);
    announceSessionChange();
    reloadTo("/login");
  }, [dispatch]);

  const loadClients = useCallback(async ({ signal } = {}) => {
    const version = ++requestVersion.current;
    setLoading(true);
    setMessage("");
    try {
      const result = await getManagedClients({ signal });
      if (!mounted.current || version !== requestVersion.current) return;
      if (!Array.isArray(result) || !result.every((client) => isClientId(client?.licenseId))) {
        throw new Error("Invalid client list");
      }
      setClients(result);
    } catch (error) {
      if (!mounted.current || error?.code === "ERR_CANCELED" || version !== requestVersion.current) return;
      if (error?.response?.status === 401) expireSession();
      setMessage(clientManagementError(error, "Unable to load clients. Please try again."));
    } finally {
      if (mounted.current && version === requestVersion.current) setLoading(false);
    }
  }, [expireSession]);

  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    void loadClients({ signal: controller.signal });
    return () => { mounted.current = false; requestVersion.current += 1; controller.abort(); };
  }, [loadClients]);

  const savedClient = async (client, result) => {
    setEditor(null);
    setNotice(result.created ? "Client created." : "Client configuration saved.");
    if (!result.created && client.licenseId === user?.licenseId) {
      // Refresh the ordinary CLIENT's own menu configuration, without changing
      // its identity or borrowing another client's licence.
      try { localStorage.setItem("license", JSON.stringify(client)); } catch { /* A reload still rechecks the session. */ }
      reloadTo("/onboard-client");
      return;
    }
    await loadClients();
  };

  const search = query.trim().toLowerCase();
  const visible = clients.filter((client) => `${client.companyName || ""} ${client.adminEmail || ""}`.toLowerCase().includes(search));

  return (
    <div className="client-administration-page">
      <SidebarNew />
      <div className="content">
        <Header />
        <main className="client-administration-main">
          <div className="client-administration-heading">
            <p className="mb-0">Create a client or update its existing configuration.</p>
            <button type="button" className="btn btn-primary" disabled={loading} onClick={() => { setNotice(""); setEditor({ clientId: null }); }}>Add Client</button>
          </div>
          {message && <div className="alert alert-danger" role="alert">{message}</div>}
          {notice && <div className="alert alert-success" role="status">{notice}</div>}
          <div className="client-administration-heading">
            <label>Search clients<input type="search" className="form-control" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name or administrator email" /></label>
            <button type="button" className="btn btn-outline-secondary" disabled={loading} onClick={() => loadClients()}>Refresh</button>
          </div>
          {loading && <p role="status">Loading clients...</p>}
          <div className="table-responsive">
            <table className="table align-middle">
              <thead><tr><th scope="col">Client</th><th scope="col">Administrator</th><th scope="col">Status</th><th scope="col">Licence expiry</th><th scope="col">Allowed users / sites</th><th scope="col"><span className="visually-hidden">Actions</span></th></tr></thead>
              <tbody>
                {visible.map((client) => <tr key={client.licenseId}>
                  <th scope="row">{client.companyName || "Unnamed client"}</th>
                  <td>{client.adminEmail || "Not configured"}</td>
                  <td>{client.status || "Not set"}</td>
                  <td>{displayClientDate(client.trialExpiry)}</td>
                  <td>{client.allowedUser} / {client.allowedSites}</td>
                  <td><button type="button" className="btn btn-outline-secondary btn-sm" disabled={loading} onClick={() => { setNotice(""); setEditor({ clientId: client.licenseId }); }} aria-label={`Configure ${client.companyName || "client"}`}>Configure</button></td>
                </tr>)}
                {!loading && visible.length === 0 && <tr><td colSpan={6}>{clients.length ? "No clients match your search." : "No clients available."}</td></tr>}
              </tbody>
            </table>
          </div>
        </main>
      </div>
      {editor && <ClientEditor key={editor.clientId || "new"} clientId={editor.clientId} onClose={() => setEditor(null)} onSaved={savedClient} onSessionExpired={expireSession} />}
    </div>
  );
}

export default function OnboradClient() {
  const user = useSelector((state) => state.site.loggedInUserData);
  // Keep the existing menu/route, with one platform directory and one shared
  // editor. Ordinary transitional Super Admins retain their existing API scope.
  return isPlatformUser(user) ? <PlatformCustomers /> : <LegacyClientAdministration user={user} />;
}
