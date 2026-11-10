import { put } from "../../../../../api";
import { isPlatformUser } from "../../../../../utils/sessionContext";

export function saveGasBoilerActionLink(inspectionId, checkId, payload, actor) {
  let requestId = inspectionId;
  if (isPlatformUser(actor)) {
    const ownerCheckId = Number(checkId);
    if (!Number.isSafeInteger(ownerCheckId) || ownerCheckId <= 0 || Number(payload?.checkId) !== ownerCheckId) {
      throw new Error("The Gas Boiler Site Check could not be verified. Reload before linking this Action.");
    }
    // The workspace endpoint updates by owning Site Check, not inspection row ID.
    requestId = ownerCheckId;
  }
  return put(`/api/site-check/gas-boiler-inspection/${requestId}`, payload);
}
