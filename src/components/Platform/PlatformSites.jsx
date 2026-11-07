import React, { useCallback, useEffect, useRef, useState } from "react";
import { getPlatformSite, getPlatformSites } from "../../api/platform";

const isCancelled = (error) => error?.name === "AbortError" || error?.code === "ERR_CANCELED";
const validSite = (site) => Number.isSafeInteger(site?.siteId) && site.siteId > 0;
const siteAddress = (site) => [site.address1, site.address2, site.city, site.postCode, site.country]
  .filter(Boolean).join(", ");

export default function PlatformSites({ selectedLicenseId, customerName, onSessionExpired, onContextChanged }) {
  const mounted = useRef(false);
  const contextInvalid = useRef(false);
  const listVersion = useRef(0);
  const detailVersion = useRef(0);
  const listRequest = useRef(null);
  const detailRequest = useRef(null);
  const [sites, setSites] = useState([]);
  const [query, setQuery] = useState("");
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [requestedSiteId, setRequestedSiteId] = useState(null);
  const [selectedSite, setSelectedSite] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailUnavailable, setDetailUnavailable] = useState(false);

  const clearDetails = useCallback(() => {
    detailVersion.current += 1;
    detailRequest.current?.abort();
    detailRequest.current = null;
    setRequestedSiteId(null);
    setSelectedSite(null);
    setDetailLoading(false);
    setDetailError("");
    setDetailUnavailable(false);
  }, []);

  const invalidateContext = useCallback((expired = false) => {
    if (!mounted.current || contextInvalid.current) return;
    contextInvalid.current = true;
    listVersion.current += 1;
    listRequest.current?.abort();
    clearDetails();
    setSites([]);
    setListError("");
    setListLoading(true);
    if (expired) onSessionExpired();
    else onContextChanged();
  }, [clearDetails, onSessionExpired, onContextChanged]);

  const handleSessionError = useCallback((error) => {
    if (isCancelled(error)) return true;
    const status = error?.response?.status;
    if (status === 401) {
      invalidateContext(true);
      return true;
    }
    if (status === 403 || status === 409) {
      invalidateContext();
      return true;
    }
    return false;
  }, [invalidateContext]);

  const verifyContext = useCallback((response) => {
    if (!Number.isSafeInteger(response?.selectedLicenseId) ||
        response.selectedLicenseId !== selectedLicenseId) {
      // Another tab may have changed the shared cookie since the page session loaded.
      invalidateContext();
      return false;
    }
    return true;
  }, [selectedLicenseId, invalidateContext]);

  const loadSites = useCallback(async () => {
    if (contextInvalid.current) return;
    const version = ++listVersion.current;
    listRequest.current?.abort();
    const controller = new AbortController();
    listRequest.current = controller;
    clearDetails();
    setSites([]);
    setListError("");
    setListLoading(true);
    try {
      const response = await getPlatformSites({ signal: controller.signal });
      if (!mounted.current || version !== listVersion.current || contextInvalid.current) return;
      if (!verifyContext(response)) return;
      if (!Array.isArray(response.sites) || !response.sites.every(validSite)) {
        throw new Error("Invalid site list");
      }
      setSites(response.sites);
    } catch (error) {
      if (!mounted.current || version !== listVersion.current || contextInvalid.current) return;
      if (!handleSessionError(error)) {
        setListError("Unable to load sites. Use Refresh sites to try again.");
      }
    } finally {
      if (mounted.current && version === listVersion.current && !contextInvalid.current) {
        setListLoading(false);
      }
    }
  }, [clearDetails, verifyContext, handleSessionError]);

  useEffect(() => {
    mounted.current = true;
    contextInvalid.current = false;
    setQuery("");
    void loadSites();
    return () => {
      mounted.current = false;
      listVersion.current += 1;
      detailVersion.current += 1;
      listRequest.current?.abort();
      detailRequest.current?.abort();
    };
  }, [loadSites]);

  const loadSite = async (siteId) => {
    if (contextInvalid.current || listLoading || !Number.isSafeInteger(siteId) || siteId <= 0) return;
    const version = ++detailVersion.current;
    detailRequest.current?.abort();
    const controller = new AbortController();
    detailRequest.current = controller;
    setRequestedSiteId(siteId);
    setSelectedSite(null);
    setDetailError("");
    setDetailUnavailable(false);
    setDetailLoading(true);
    try {
      const response = await getPlatformSite(siteId, { signal: controller.signal });
      if (!mounted.current || version !== detailVersion.current || contextInvalid.current) return;
      if (!verifyContext(response)) return;
      if (!validSite(response.site) || response.site.siteId !== siteId) {
        throw new Error("Invalid site details");
      }
      setSelectedSite(response.site);
    } catch (error) {
      if (!mounted.current || version !== detailVersion.current || contextInvalid.current) return;
      if (!handleSessionError(error)) {
        const unavailable = error?.response?.status === 404;
        setDetailUnavailable(unavailable);
        setDetailError(unavailable
          ? "That site is no longer available for this customer. Refresh the site list to continue."
          : "Unable to load these site details. Please try again.");
      }
    } finally {
      if (mounted.current && version === detailVersion.current && !contextInvalid.current) {
        setDetailLoading(false);
      }
    }
  };

  const search = query.trim().toLowerCase();
  const visibleSites = sites.filter((site) =>
    [site.siteName, siteAddress(site), site.area, site.buildingCode]
      .filter(Boolean).join(" ").toLowerCase().includes(search)
  );

  return (
    <section className="platform-sites" aria-labelledby="platform-sites-title">
      <div className="platform-sites-heading">
        <div>
          <h2 id="platform-sites-title">Sites for {customerName}</h2>
          <p>View the selected customer’s site details.</p>
        </div>
        <button type="button" className="btn btn-outline-primary" disabled={listLoading} onClick={loadSites}>
          Refresh sites
        </button>
      </div>

      {listLoading && <div className="platform-sites-message" role="status">Loading sites...</div>}
      {listError && <div className="alert alert-danger platform-sites-error" role="alert">{listError}</div>}

      {!listLoading && !listError && (
        <>
          <label className="platform-sites-search">
            <span>Search sites</span>
            <input type="search" className="form-control" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, address or postcode" />
          </label>
          <div className="table-responsive">
            <table className="table platform-sites-table">
              <thead><tr><th scope="col">Site</th><th scope="col">Address</th><th scope="col">Status</th><th scope="col"><span className="visually-hidden">View site</span></th></tr></thead>
              <tbody>
                {visibleSites.map((site) => (
                  <tr key={site.siteId} className={selectedSite?.siteId === site.siteId ? "platform-sites-current-row" : undefined}>
                    <th scope="row">{site.siteName || "Unnamed site"}</th>
                    <td>{siteAddress(site) || "Not provided"}</td>
                    <td>{site.status || "Not set"}</td>
                    <td className="platform-sites-action"><button type="button" className="btn btn-outline-primary" disabled={detailLoading && requestedSiteId === site.siteId} onClick={() => loadSite(site.siteId)} aria-label={`View details for ${site.siteName || "site"}`}>
                      {detailLoading && requestedSiteId === site.siteId ? "Loading..." : "View details"}
                    </button></td>
                  </tr>
                ))}
                {visibleSites.length === 0 && <tr><td colSpan={4} className="platform-sites-message">{sites.length === 0 ? "No sites are available for this customer." : "No sites match your search."}</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {requestedSiteId != null && (
        <section className="platform-site-details" aria-labelledby="platform-site-details-title">
          <div className="platform-site-details-heading">
            <h3 id="platform-site-details-title">{selectedSite?.siteName || "Site details"}</h3>
            <button type="button" className="btn btn-outline-secondary" onClick={clearDetails}>Close details</button>
          </div>
          {detailLoading && <p role="status">Loading site details...</p>}
          {detailError && (
            <div className="alert alert-danger" role="alert">
              <p>{detailError}</p>
              {!detailUnavailable && <button type="button" className="btn btn-outline-secondary" onClick={() => loadSite(requestedSiteId)}>Retry details</button>}
            </div>
          )}
          {selectedSite && (
            <dl>
              <div><dt>Address</dt><dd>{siteAddress(selectedSite) || "Not provided"}</dd></div>
              <div><dt>Status</dt><dd>{selectedSite.status || "Not set"}</dd></div>
              <div><dt>Area</dt><dd>{selectedSite.area || "Not provided"}</dd></div>
              <div><dt>Building code</dt><dd>{selectedSite.buildingCode || "Not provided"}</dd></div>
              <div><dt>Local authority</dt><dd>{selectedSite.localAuthority || "Not provided"}</dd></div>
            </dl>
          )}
        </section>
      )}
    </section>
  );
}
