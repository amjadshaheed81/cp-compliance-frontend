import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  clearPlatformClient,
  getPlatformClients,
  getPlatformSession,
  selectPlatformClient,
} from "../../api/platform";
import { logoutUser } from "../../store/thunk/site";
import {
  announceSessionChange,
  assertPlatformSession,
  getStoredSessionUser,
  isPlatformUser,
  reloadTo,
  replaceSessionIdentity,
  resetCustomerSession,
} from "../../utils/sessionContext";
import "./PlatformCustomers.css";
import PlatformSites from "./PlatformSites";

function selectionError(error) {
  switch (error?.response?.status) {
    case 400: return "That selection could not be accepted. Please choose a customer from the list.";
    case 403: return "You cannot select that customer. Choose an available customer from the refreshed list.";
    case 404: return "That customer is no longer available. Please choose another customer.";
    case 409: return "That customer is currently unavailable. Please choose another customer.";
    default: return "The customer selection could not be confirmed. Please try again.";
  }
}

function displayDate(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not set"
    : new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

export default function PlatformCustomers() {
  const dispatch = useDispatch();
  const cachedUser = useSelector((state) => state.site.loggedInUserData);
  const cachedUserRef = useRef(cachedUser);
  cachedUserRef.current = cachedUser;
  const mounted = useRef(false);
  const requestVersion = useRef(0);
  const operationInFlight = useRef(false);
  const [session, setSession] = useState(null);
  const [clients, setClients] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(null);
  const [message, setMessage] = useState("");

  const expireSession = useCallback(() => {
    resetCustomerSession(dispatch);
    announceSessionChange();
    reloadTo("/login");
  }, [dispatch]);

  const loadSession = useCallback(async ({ preserveMessage = false } = {}) => {
    const version = ++requestVersion.current;
    setLoading(true);
    setSession(null);
    setClients([]);
    if (!preserveMessage) setMessage("");
    try {
      const [response, customers] = await Promise.all([getPlatformSession(), getPlatformClients()]);
      const verified = assertPlatformSession(response);
      if (!Array.isArray(customers)) throw new Error("Invalid customer list");
      if (!mounted.current || version !== requestVersion.current) return;

      const previous = cachedUserRef.current;
      const identityChanged = Boolean(previous?.id) &&
        (!isPlatformUser(previous) || String(previous.id) !== String(verified.user.id));
      replaceSessionIdentity(dispatch, verified.user);
      setSession(verified);
      setClients(customers);
      if (identityChanged) {
        // The cookie may belong to a different account from the browser's saved state.
        announceSessionChange();
        const storedUser = getStoredSessionUser();
        if (isPlatformUser(storedUser) && String(storedUser.id) === String(verified.user.id)) {
          reloadTo("/platform");
        }
      }
    } catch (error) {
      if (!mounted.current || version !== requestVersion.current) return;
      if (error?.response?.status === 401) {
        expireSession();
      } else {
        setMessage(error?.response?.status === 403
          ? "Platform access is unavailable for this account. Sign out to use another account."
          : "Unable to verify your customer workspace. Please refresh or sign in again.");
      }
    } finally {
      if (mounted.current && version === requestVersion.current) setLoading(false);
    }
  }, [dispatch, expireSession]);

  useEffect(() => {
    mounted.current = true;
    void loadSession();
    const refreshOnFocus = () => {
      if (!operationInFlight.current && document.visibilityState !== "hidden") void loadSession();
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

  const changeSelection = async (licenseId) => {
    if (operationInFlight.current || loading) return;
    operationInFlight.current = true;
    requestVersion.current += 1;
    setPending(licenseId == null ? "clear" : licenseId);
    setMessage("");
    try {
      const response = licenseId == null
        ? await clearPlatformClient()
        : await selectPlatformClient(licenseId);
      const verified = assertPlatformSession(response);
      if (!mounted.current) return;
      // Install only the returned context; never turn the chosen licence into user.licenseId.
      setSession(verified);
      replaceSessionIdentity(dispatch, verified.user);
      announceSessionChange();
      reloadTo("/platform");
    } catch (error) {
      if (!mounted.current) return;
      if (error?.response?.status === 401) {
        expireSession();
      } else {
        setMessage(selectionError(error));
        // A timeout or rejection must not leave an assumed customer on screen.
        await loadSession({ preserveMessage: true });
      }
    } finally {
      operationInFlight.current = false;
      if (mounted.current) setPending(null);
    }
  };

  const signOut = async () => {
    if (operationInFlight.current) return;
    operationInFlight.current = true;
    requestVersion.current += 1;
    setPending("logout");
    const result = await dispatch(logoutUser());
    if (mounted.current && !result?.success) {
      setMessage("Unable to sign out. Please check your connection and try again.");
      setPending(null);
      setLoading(false);
    }
    operationInFlight.current = false;
  };

  const selected = session?.selectedClient || null;
  const busy = loading || pending != null;
  const search = query.trim().toLowerCase();
  const visibleClients = clients.filter((client) =>
    `${client.companyName || ""} ${client.companyAddress || ""}`.toLowerCase().includes(search)
  );

  return (
    <div className="platform-customers-page">
      <header className="platform-customers-header">
        <div className="platform-customers-brand">CAFM <span>Customer workspace</span></div>
        <div className="platform-customers-account">
          {session?.user?.name && <span>{session.user.name}</span>}
          <button type="button" className="btn btn-outline-secondary" onClick={signOut} disabled={pending != null}>
            {pending === "logout" ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </header>

      <main className="platform-customers-main">
        <div className="platform-customers-heading">
          <div>
            <h1>Customers</h1>
            <p>Select a customer to view its account details and sites.</p>
          </div>
          <button type="button" className="btn btn-outline-primary" onClick={() => loadSession()} disabled={busy}>
            Refresh
          </button>
        </div>

        {message && <div className="alert alert-danger" role="alert">{message}</div>}
        {loading && <div className="platform-customers-loading" role="status">Loading customers...</div>}

        {!loading && session && (
          <>
            <section className="platform-customers-selection" aria-labelledby="selected-customer-title">
              <div className="platform-customers-selection-heading">
                <div>
                  <p className="platform-customers-eyebrow" id="selected-customer-title">Selected customer</p>
                  <h2>{selected?.companyName || "No customer selected"}</h2>
                </div>
                {selected && (
                  <button type="button" className="btn btn-outline-secondary" disabled={busy} onClick={() => changeSelection(null)}>
                    {pending === "clear" ? "Clearing..." : "Clear selection"}
                  </button>
                )}
              </div>
              {selected ? (
                <dl className="platform-customers-details">
                  <div><dt>Address</dt><dd>{selected.companyAddress || "Not provided"}</dd></div>
                  <div><dt>Allowed users</dt><dd>{selected.allowedUser ?? "Not set"}</dd></div>
                  <div><dt>Allowed sites</dt><dd>{selected.allowedSites ?? "Not set"}</dd></div>
                  <div><dt>Licence expiry</dt><dd>{displayDate(selected.trialExpiry)}</dd></div>
                </dl>
              ) : <p className="platform-customers-empty-selection">Choose an available customer below.</p>}
            </section>

            {selected && !busy && (
              <PlatformSites
                key={`${session.user.id}:${session.selectedLicenseId}`}
                selectedLicenseId={session.selectedLicenseId}
                customerName={selected.companyName || "selected customer"}
                onSessionExpired={expireSession}
                onContextChanged={loadSession}
              />
            )}

            <section className="platform-customers-list" aria-labelledby="customer-list-title">
              <div className="platform-customers-list-heading">
                <div>
                  <h2 id="customer-list-title">Select a customer</h2>
                  <p>Inactive or expired customers cannot be selected.</p>
                </div>
                <label className="platform-customers-search">
                  <span>Search customers</span>
                  <input type="search" className="form-control" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name or address" />
                </label>
              </div>
              <div className="table-responsive">
                <table className="table platform-customers-table">
                  <thead><tr><th scope="col">Customer</th><th scope="col">Availability</th><th scope="col">Licence expiry</th><th scope="col"><span className="visually-hidden">Selection</span></th></tr></thead>
                  <tbody>
                    {visibleClients.map((client) => {
                      const isSelected = session.selectedLicenseId === client.licenseId;
                      const canSelect = client.selectable === true && Number.isSafeInteger(client.licenseId) && client.licenseId > 0;
                      return (
                        <tr key={client.licenseId} className={isSelected ? "platform-customers-current-row" : undefined}>
                          <th scope="row"><strong>{client.companyName || "Unnamed customer"}</strong><span className="platform-customers-address">{client.companyAddress || "Address not provided"}</span></th>
                          <td><span className={`platform-customers-status ${canSelect ? "is-available" : "is-unavailable"}`}>{canSelect ? "Available" : "Unavailable"}</span></td>
                          <td>{displayDate(client.trialExpiry)}</td>
                          <td className="platform-customers-action"><button type="button" className={`btn ${isSelected ? "btn-outline-secondary" : "btn-primary"}`} disabled={busy || !canSelect || isSelected} onClick={() => changeSelection(client.licenseId)} aria-label={`${isSelected ? "Selected" : "Select"} ${client.companyName || "customer"}`}>
                            {pending === client.licenseId ? "Selecting..." : isSelected ? "Selected" : "Select customer"}
                          </button></td>
                        </tr>
                      );
                    })}
                    {visibleClients.length === 0 && <tr><td colSpan={4} className="platform-customers-empty-list">{clients.length === 0 ? "No customers are available for this platform account." : "No customers match your search."}</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
