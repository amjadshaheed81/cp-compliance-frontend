import { combinedMenu } from "../../Constant/Menu";

export const CLIENT_STATUSES = ["Active", "Inactive"];
export const isClientId = (id) => Number.isSafeInteger(id) && id > 0;
export const hasClientAdministrator = (client) => isClientId(client?.adminUserId);
const text = (value) => value == null ? "" : String(value);

export function newClientDraft() {
  return {
    companyName: "", companyAddress: "", logo: "", status: "Active",
    licenceType: "", trialExpiry: "", allowedUser: "1", allowedSites: "1",
    modules: combinedMenu.map((module) => module.key).join(","),
    adminFirstName: "", adminLastName: "", adminEmail: "", adminContact: "", adminPassword: "",
  };
}

export function clientToDraft(client) {
  const fields = newClientDraft();
  Object.keys(fields).forEach((key) => { fields[key] = text(client?.[key]); });
  fields.trialExpiry = fields.trialExpiry.slice(0, 10);
  fields.adminPassword = "";
  if (!hasClientAdministrator(client)) {
    ["adminFirstName", "adminLastName", "adminEmail", "adminContact"].forEach((key) => { fields[key] = ""; });
  }
  return fields;
}

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateClientDraft(draft, { creating = false, hasAdmin = false, adminOnly = false } = {}) {
  const errors = {};
  if (!adminOnly) {
    if (!draft.companyName.trim()) errors.companyName = "Enter the client name.";
    if (!CLIENT_STATUSES.includes(draft.status)) errors.status = "Choose Active or Inactive.";
    if (!validDate(draft.trialExpiry)) errors.trialExpiry = "Choose a valid licence expiry date.";
    for (const [field, label] of [["allowedUser", "users"], ["allowedSites", "sites"]]) {
      const value = Number(draft[field]);
      if (!/^\d+$/.test(draft[field]) || !Number.isSafeInteger(value) || value > 2147483647) {
        errors[field] = `Enter a whole number of ${label}, zero or more.`;
      }
    }
    if (creating && !errors.allowedUser && Number(draft.allowedUser) < 1) {
      errors.allowedUser = "Allow at least one user for the client administrator.";
    }
  }
  if (creating || hasAdmin || adminOnly) {
    if (!draft.adminFirstName.trim()) errors.adminFirstName = "Enter the administrator's first name.";
    if (!draft.adminLastName.trim()) errors.adminLastName = "Enter the administrator's last name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.adminEmail.trim())) errors.adminEmail = "Enter a valid administrator email.";
    if ((creating || adminOnly) && !draft.adminPassword.trim()) errors.adminPassword = "Enter an administrator password.";
    if (new Blob([draft.adminPassword]).size > 72) errors.adminPassword = "Use a password of at most 72 bytes (some characters use more than one byte).";
  }
  return errors;
}

export function administratorPayload(draft) {
  return {
    adminFirstName: draft.adminFirstName.trim(), adminLastName: draft.adminLastName.trim(),
    adminEmail: draft.adminEmail.trim(), adminContact: draft.adminContact.trim(),
    adminPassword: draft.adminPassword,
  };
}

export function clientPayload(draft, stored, { platform = false } = {}) {
  let logo = draft.logo || null;
  // The existing CLIENT API reads include an Azure query grant. Platform logo
  // grants must remain intact so its service can restore the owned reference.
  if (!platform && typeof logo === "string" && logo.includes("?sv=")) logo = logo.split("?sv=")[0];
  const sameExpiryDate = text(stored?.trialExpiry).slice(0, 10) === draft.trialExpiry;
  const payload = {
    companyName: draft.companyName.trim(), companyAddress: draft.companyAddress.trim(), logo,
    status: draft.status, licenceType: draft.licenceType.trim() || null,
    allowedUser: Number(draft.allowedUser), allowedSites: Number(draft.allowedSites), modules: draft.modules,
    trialExpiry: sameExpiryDate ? stored.trialExpiry : `${draft.trialExpiry}T23:59:59`,
  };
  if (isClientId(stored?.licenseId)) payload.licenseId = stored.licenseId;
  if (!stored || hasClientAdministrator(stored)) Object.assign(payload, administratorPayload(draft));
  else {
    // Some imported licences retain contact metadata without an administrator
    // account. Preserve it verbatim during licence-only edits; setup is explicit.
    ["adminFirstName", "adminLastName", "adminEmail", "adminContact"].forEach((key) => {
      if (stored[key] != null) payload[key] = stored[key];
    });
  }
  return payload;
}

export function canOpenNewClient(draft) {
  return draft.status === "Active" && Number(draft.allowedSites) > 0 && validDate(draft.trialExpiry) &&
    new Date(`${draft.trialExpiry}T23:59:59`).getTime() > Date.now();
}

export function displayClientDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(text(value));
  return match ? `${match[3]}/${match[2]}/${match[1]}` : "Not set";
}
