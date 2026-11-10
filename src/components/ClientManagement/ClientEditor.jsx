import React, { useEffect, useRef, useState } from "react";
import { Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { combinedMenu } from "../../Constant/Menu";
import {
  clientManagementError, createManagedClient, getManagedClient, setupClientAdministrator,
  updateManagedClient, uploadClientLogo,
} from "../../api/clientManagement";
import {
  administratorPayload, canOpenNewClient, clientPayload, clientToDraft, CLIENT_STATUSES,
  hasClientAdministrator, isClientId, newClientDraft, validateClientDraft,
} from "./clientForm";
import "./ClientManagement.css";

const MAX_LOGO_BYTES = 10 * 1024 * 1024;

export default function ClientEditor({ clientId = null, platform = false, onClose, onSaved, onSessionExpired }) {
  const [record, setRecord] = useState(null);
  const [draft, setDraft] = useState(newClientDraft);
  const [loading, setLoading] = useState(isClientId(clientId));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [adminOnly, setAdminOnly] = useState(false);
  const [retry, setRetry] = useState(0);
  const [loadFailed, setLoadFailed] = useState(false);
  const formRef = useRef(null);
  const fileRef = useRef(null);
  const alive = useRef(false);
  const request = useRef(null);
  const saveInFlight = useRef(false);
  const editing = isClientId(record?.licenseId) || isClientId(clientId);
  const hasAdmin = hasClientAdministrator(record);
  const busy = loading || saving;

  useEffect(() => {
    alive.current = true;
    const controller = new AbortController();
    request.current = controller;
    setRecord(null);
    setDraft(newClientDraft());
    setFile(null);
    setAdminOnly(false);
    setMessage("");
    setErrors({});
    setLoadFailed(false);
    setLoading(isClientId(clientId));
    if (isClientId(clientId)) {
      getManagedClient(clientId, { platform, signal: controller.signal }).then((client) => {
        if (!alive.current || controller.signal.aborted) return;
        if (client?.licenseId !== clientId) throw new Error("The client details could not be verified.");
        setRecord(client);
        setDraft(clientToDraft(client));
      }).catch((error) => {
        if (!alive.current || controller.signal.aborted) return;
        if (error?.response?.status === 401) onSessionExpired?.();
        setMessage(clientManagementError(error, "Unable to load this client's configuration. Please try again."));
        setLoadFailed(true);
      }).finally(() => { if (alive.current && !controller.signal.aborted) setLoading(false); });
    }
    return () => { alive.current = false; controller.abort(); };
  }, [clientId, platform, onSessionExpired, retry]);

  useEffect(() => {
    if (!file || typeof URL.createObjectURL !== "function") { setPreview(null); return undefined; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const update = (event) => {
    const { name, value } = event.target;
    setDraft((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: undefined }));
  };

  const chooseFile = (event) => {
    const candidate = event.target.files?.[0];
    if (!candidate) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(candidate.type) || candidate.size > MAX_LOGO_BYTES) {
      setErrors((previous) => ({ ...previous, logo: "Choose a PNG, JPG or WebP image up to 10 MB." }));
      event.target.value = "";
      return;
    }
    setFile(candidate);
    setErrors((previous) => ({ ...previous, logo: undefined }));
  };

  const save = async (event, action) => {
    event?.preventDefault();
    if (busy || loadFailed || saveInFlight.current) return;
    const nextErrors = validateClientDraft(draft, { creating: !editing, hasAdmin, adminOnly });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setMessage("Please check the highlighted fields.");
      formRef.current?.elements.namedItem(Object.keys(nextErrors)[0])?.focus();
      return;
    }
    if (formRef.current && !formRef.current.checkValidity()) { formRef.current.reportValidity(); return; }
    const openWorkspace = !editing && platform && action !== "save" && canOpenNewClient(draft);
    const created = !editing;
    saveInFlight.current = true;
    setSaving(true);
    setMessage("");
    let saved = null;
    try {
      const options = { platform, signal: request.current?.signal };
      if (adminOnly) {
        saved = await setupClientAdministrator(record.licenseId, administratorPayload(draft), options);
      } else {
        let logo = draft.logo;
        if (file) {
          logo = await uploadClientLogo(file, options);
          if (!alive.current) return;
          // Retain the uploaded reference when a later save fails, so retrying
          // the form does not upload the same file again.
          setDraft((previous) => ({ ...previous, logo }));
          setFile(null);
        }
        const body = clientPayload({ ...draft, logo }, record, { platform });
        saved = editing
          ? await updateManagedClient(record.licenseId, body, options)
          : await createManagedClient(body, options);
      }
      if (!alive.current) return;
      if (!isClientId(saved?.licenseId) || (editing && saved.licenseId !== record.licenseId)) {
        // A successful write with an invalid response must not be submitted as
        // another new client. Let the user reload the authoritative directory.
        setLoadFailed(true);
        setMessage("The save completed, but its result could not be verified. Close this form and refresh Client List before making another change.");
        return;
      }
      setRecord(saved);
      setDraft(clientToDraft(saved));
      await onSaved?.(saved, { created, openWorkspace, administratorCreated: adminOnly });
    } catch (error) {
      if (!alive.current || error?.code === "ERR_CANCELED") return;
      if (error?.response?.status === 401) onSessionExpired?.();
      setMessage(saved
        ? "The client was saved, but the next step could not be completed. Close this form and refresh Client List."
        : clientManagementError(error));
    } finally {
      saveInFlight.current = false;
      if (alive.current) setSaving(false);
    }
  };

  const field = (name, label, { type = "text", required = false, wide = false, ...props } = {}) => (
    <div className={`client-editor-field${wide ? " client-editor-field-wide" : ""}`}>
      <label htmlFor={`client-${name}`}>{label}{required && <span aria-hidden="true"> *</span>}</label>
      <input id={`client-${name}`} name={name} type={type} className={`form-control${errors[name] ? " is-invalid" : ""}`}
        value={draft[name]} onChange={update} required={required} disabled={busy}
        aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `client-error-${name}` : undefined} {...props} />
      {errors[name] && <span className="client-editor-error" id={`client-error-${name}`}>{errors[name]}</span>}
    </div>
  );

  const administratorFields = (
    <div className="client-editor-grid">
      {field("adminFirstName", "Administrator first name", { required: true, maxLength: 100, autoComplete: "given-name" })}
      {field("adminLastName", "Administrator last name", { required: true, maxLength: 100, autoComplete: "family-name" })}
      {field("adminEmail", "Administrator email", { type: "email", required: true, maxLength: 100, autoComplete: "off" })}
      {field("adminContact", "Administrator phone", { type: "tel", maxLength: 100, autoComplete: "tel" })}
      {field("adminPassword", editing && !adminOnly ? "New administrator password" : "Administrator password",
        { type: "password", required: !editing || adminOnly, autoComplete: "new-password", wide: true })}
      {editing && !adminOnly && <p className="client-editor-help client-editor-field-wide">Leave the password blank to keep the existing password.</p>}
    </div>
  );

  const selectedModules = new Set(draft.modules.split(",").filter(Boolean));
  const toggleModule = (key) => {
    const next = new Set(draft.modules.split(",").filter(Boolean));
    if (next.has(String(key))) next.delete(String(key)); else next.add(String(key));
    setDraft((previous) => ({ ...previous, modules: [...next].sort((a, b) => Number(a) - Number(b)).join(",") }));
  };

  return (
    <Dialog open onClose={() => { if (!busy) onClose?.(); }} maxWidth="md" fullWidth aria-labelledby="client-editor-title"
      PaperProps={{ className: "client-editor" }}>
      <form ref={formRef} onSubmit={(event) => save(event)} noValidate aria-label={adminOnly ? "Set up client administrator" : editing ? "Configure client" : "Add client"}>
        <DialogTitle id="client-editor-title">{adminOnly ? "Set up client administrator" : editing ? "Configure client" : "Add client"}</DialogTitle>
        <DialogContent dividers>
          {message && <div className="alert alert-danger" role="alert">{message}</div>}
          {loading && <p role="status">Loading client configuration...</p>}
          {loadFailed && !saving && isClientId(clientId) && <button type="button" className="btn btn-outline-secondary" onClick={() => setRetry((value) => value + 1)}>Reload configuration</button>}
          {!loading && !loadFailed && <>
            {adminOnly ? <>
              <p>Create the primary administrator for <strong>{record?.companyName}</strong>.</p>
              {administratorFields}
            </> : <>
              <section className="client-editor-section" aria-labelledby="client-details-heading">
                <h3 id="client-details-heading">Client details</h3>
                <div className="client-editor-grid">
                  {field("companyName", "Client name", { required: true, maxLength: 255, wide: true })}
                  <div className="client-editor-field client-editor-field-wide">
                    <label htmlFor="client-companyAddress">Client address</label>
                    <textarea id="client-companyAddress" name="companyAddress" className="form-control" rows={2} maxLength={4000} value={draft.companyAddress} onChange={update} disabled={busy} />
                  </div>
                  <div className="client-editor-field client-editor-field-wide">
                    <label htmlFor="client-logo">Client record logo (optional)</label>
                    <div className="client-editor-logo">
                      {(preview || draft.logo) && <img key={preview || draft.logo} src={preview || draft.logo} alt="Client logo preview" onError={(event) => { event.currentTarget.hidden = true; }} />}
                      <input ref={fileRef} id="client-logo" type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseFile} disabled={busy} />
                      {(file || draft.logo) && <button type="button" className="btn btn-outline-secondary btn-sm" disabled={busy} onClick={() => {
                        setFile(null); setDraft((previous) => ({ ...previous, logo: "" })); if (fileRef.current) fileRef.current.value = "";
                      }}>Remove logo</button>}
                    </div>
                    {errors.logo && <span className="client-editor-error" role="alert">{errors.logo}</span>}
                  </div>
                </div>
              </section>
              <section className="client-editor-section" aria-labelledby="client-licence-heading">
                <h3 id="client-licence-heading">Licence and access</h3>
                <div className="client-editor-grid">
                  <div className="client-editor-field">
                    <label htmlFor="client-status">Status *</label>
                    <select id="client-status" name="status" className="form-select" value={draft.status} onChange={update} disabled={busy} required aria-invalid={Boolean(errors.status)}>
                      {!CLIENT_STATUSES.includes(draft.status) && <option value={draft.status}>Choose status</option>}
                      {CLIENT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                    {errors.status && <span className="client-editor-error">{errors.status}</span>}
                  </div>
                  {field("licenceType", "Licence type", { maxLength: 100 })}
                  {field("trialExpiry", "Licence expiry", { type: "date", required: true })}
                  {field("allowedUser", "Allowed users", { type: "number", min: editing ? 0 : 1, max: 2147483647, step: 1, required: true })}
                  {field("allowedSites", "Allowed sites", { type: "number", min: 0, max: 2147483647, step: 1, required: true })}
                </div>
                <p className="client-editor-help">A client must be active and within its licence dates to open a platform workspace.</p>
                <details className="client-editor-modules">
                  <summary>Client menu options ({selectedModules.size} selected)</summary>
                  <div className="client-editor-module-actions">
                    <button type="button" className="btn btn-link btn-sm" disabled={busy} onClick={() => setDraft((previous) => ({ ...previous, modules: combinedMenu.map((module) => module.key).join(",") }))}>Select all</button>
                    <button type="button" className="btn btn-link btn-sm" disabled={busy} onClick={() => setDraft((previous) => ({ ...previous, modules: "" }))}>Clear all</button>
                  </div>
                  <div className="client-editor-module-grid">
                    {combinedMenu.map((module) => <label key={module.key}>
                      <input type="checkbox" checked={selectedModules.has(String(module.key))} onChange={() => toggleModule(module.key)} disabled={busy} />
                      <span>{module.label}</span>
                    </label>)}
                  </div>
                  {platform && <p className="client-editor-help">These menu choices apply to client users. Platform administrators retain their full workspace menu.</p>}
                </details>
              </section>
              <section className="client-editor-section" aria-labelledby="client-admin-heading">
                <h3 id="client-admin-heading">Primary administrator</h3>
                {!editing || hasAdmin ? administratorFields : <>
                  <p>This client does not have a primary administrator. You can save its licence settings and manage its sites using your platform account.</p>
                  {platform && <button type="button" className="btn btn-outline-primary" disabled={busy || Number(record?.allowedUser) < 1} onClick={() => { setAdminOnly(true); setMessage(""); setErrors({}); }}>Set up administrator</button>}
                  {platform && Number(record?.allowedUser) < 1 && <p className="client-editor-help">Save an allowance of at least one user before setting up the administrator.</p>}
                </>}
              </section>
            </>}
          </>}
        </DialogContent>
        <DialogActions className="client-editor-actions">
          <button type="button" className="btn btn-outline-secondary" disabled={saving} onClick={() => {
            if (adminOnly) { setAdminOnly(false); setMessage(""); setErrors({}); } else onClose?.();
          }}>{adminOnly ? "Back to configuration" : "Cancel"}</button>
          {!editing && platform && <button type="button" className="btn btn-outline-primary" disabled={busy || loadFailed} onClick={() => save(null, "save")}>Create client only</button>}
          <button type="submit" className="btn btn-primary" disabled={busy || loadFailed}>
            {saving ? "Saving..." : adminOnly ? "Create administrator" : editing ? "Save changes" : platform && canOpenNewClient(draft) ? "Create and add first site" : "Create client"}
          </button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
