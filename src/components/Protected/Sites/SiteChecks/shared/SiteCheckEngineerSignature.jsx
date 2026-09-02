import React, { useEffect, useMemo, useState } from "react";
import { get } from "../../../../../api";

/**
 * Displays the signature uploaded on Edit Profile for the selected Site Check
 * engineer. The full user-details endpoint is authoritative for signatures;
 * the lighter site-user list is only used as a fallback.
 */
const SiteCheckEngineerSignature = ({
  engineer,
  engineerId,
  fallbackSignature = "",
  sasToken = "",
  label = "Signature",
}) => {
  const [profileSignature, setProfileSignature] = useState("");

  const resolvedEngineerId = engineer?.id || engineerId || null;

  useEffect(() => {
    let cancelled = false;

    if (!resolvedEngineerId) {
      setProfileSignature("");
      return undefined;
    }

    // Clear the previous engineer's profile signature immediately while the
    // newly selected engineer details are loading.
    setProfileSignature("");

    const loadEngineerProfile = async () => {
      try {
        const response = await get(`/api/user/${resolvedEngineerId}/details`);
        const user = response?.user || response || null;

        if (!cancelled) {
          setProfileSignature(user?.signature || "");
        }
      } catch (error) {
        if (!cancelled) {
          setProfileSignature("");
        }
      }
    };

    loadEngineerProfile();

    return () => {
      cancelled = true;
    };
  }, [resolvedEngineerId]);

  const signatureUrl =
    profileSignature || engineer?.signature || fallbackSignature || "";

  const signatureSrc = useMemo(() => {
    if (!signatureUrl) return "";
    if (!sasToken) return signatureUrl;

    const token = String(sasToken).replace(/^\?/, "");
    return `${signatureUrl}${signatureUrl.includes("?") ? "&" : "?"}${token}`;
  }, [signatureUrl, sasToken]);

  return (
    <div className="mb-3">
      <label className="form-label">{label}</label>
      <div>
        {signatureSrc ? (
          <img
            width="200"
            height="50"
            style={{ border: "1px solid #ced4da", objectFit: "contain" }}
            src={signatureSrc}
            alt="Engineer Signature"
          />
        ) : (
          <div
            className="form-control d-flex align-items-center text-muted"
            style={{
              width: "200px",
              height: "50px",
              backgroundColor: "#f8f9fa",
            }}
          >
            No signature available
          </div>
        )}
      </div>
    </div>
  );
};

export default SiteCheckEngineerSignature;
