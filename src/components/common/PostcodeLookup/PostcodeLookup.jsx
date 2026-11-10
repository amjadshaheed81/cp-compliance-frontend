import React, { useEffect, useRef, useState } from "react";
import { searchAddresses, loadAddress, normalizePostcode, isUkPostcode, addressLookupMessage } from "../../../api/addressLookup";
import "./PostcodeLookup.css";

export default function PostcodeLookup({ register, getValues, setValue, error, disabled = false }) {
  const [suggestions, setSuggestions] = useState([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const request = useRef(null);
  const sequence = useRef(0);
  const cancel = () => { sequence.current += 1; request.current?.abort(); request.current = null; };
  useEffect(() => () => { sequence.current += 1; request.current?.abort(); }, []);
  const postcodeField = register("postCode", { required: "Please enter the postcode." });
  const start = () => { cancel(); const controller = new AbortController(); request.current = controller; return { controller, version: sequence.current }; };
  const find = async () => {
    const postcode = normalizePostcode(getValues("postCode"));
    setSuggestions([]); setMessage("");
    if (!isUkPostcode(postcode)) { cancel(); setBusy(false); setMessage("Enter a full UK postcode to find addresses, or enter the address manually."); return; }
    setValue("postCode", postcode, { shouldValidate: true, shouldDirty: true });
    const { controller, version } = start(); setBusy(true);
    try {
      const response = await searchAddresses(postcode, controller.signal);
      if (version !== sequence.current) return;
      const items = Array.isArray(response?.suggestions) ? response.suggestions : [];
      setSuggestions(items);
      if (!items.length) setMessage("No addresses were found. Check the postcode or enter the address manually.");
    } catch (failure) { if (version === sequence.current && failure?.code !== "ERR_CANCELED") setMessage(addressLookupMessage(failure)); }
    finally { if (version === sequence.current) setBusy(false); }
  };
  const select = async (suggestion) => {
    const postcode = normalizePostcode(getValues("postCode"));
    const fields = ["address1", "address2", "city", "country", "area"];
    const previous = fields.map((name) => String(getValues(name) ?? ""));
    const { controller, version } = start(); setBusy(true); setMessage("");
    try {
      const address = await loadAddress(suggestion.id, postcode, controller.signal);
      if (version !== sequence.current) return;
      if (fields.some((name, index) => String(getValues(name) ?? "") !== previous[index])) {
        setSuggestions([]);
        setMessage("Your manual address changes have been kept. Search again if you want to use the lookup result.");
        return;
      }
      ["address1", "address2", "city", "country", "postCode"].forEach((field) => setValue(field, address[field] || "", { shouldDirty: true, shouldValidate: true }));
      setValue("latitude", address.latitude ?? "", { shouldDirty: true });
      setValue("longitude", address.longitude ?? "", { shouldDirty: true });
      const map = address.latitude != null && address.longitude != null ? `https://maps.google.com/maps?q=${address.latitude},${address.longitude}` : "";
      setValue("mapViewUrl", map); setValue("streetViewUrl", map);
      setSuggestions([]); setMessage("Address filled in. Check the details and choose the site area before saving.");
    } catch (failure) { if (version === sequence.current && failure?.code !== "ERR_CANCELED") setMessage(addressLookupMessage(failure)); }
    finally { if (version === sequence.current) setBusy(false); }
  };
  return <div className="cafm-postcode-lookup">
    <label htmlFor="postCode" className="form-label">Postcode</label>
    <div className="cafm-postcode-controls">
      <input {...postcodeField} id="postCode" type="text" className="form-control" autoComplete="postal-code" disabled={disabled}
        aria-describedby="postcode-help" aria-invalid={Boolean(error)} onChange={(event) => {
          postcodeField.onChange(event); cancel(); setBusy(false); setSuggestions([]); setMessage("");
          ["latitude", "longitude", "mapViewUrl", "streetViewUrl"].forEach((field) => setValue(field, ""));
        }} />
      {!disabled && <button type="button" className="btn btn-outline-primary" disabled={busy} onClick={find}>{busy ? "Finding…" : "Find address"}</button>}
    </div>
    <small id="postcode-help">You can enter the address manually at any time.</small>
    {error && <p className="text-danger" role="alert">{error.message}</p>}
    {message && <p className="cafm-postcode-message" role="status">{message}</p>}
    {suggestions.length > 0 && <ul className="cafm-address-results" aria-label="Matching addresses">{suggestions.map((item) => <li key={item.id}><button type="button" disabled={busy} onClick={() => select(item)}>{item.label}</button></li>)}</ul>}
  </div>;
}
