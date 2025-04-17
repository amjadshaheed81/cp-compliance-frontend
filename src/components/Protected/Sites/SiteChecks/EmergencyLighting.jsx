// src/components/SiteChecks/EmergencyLightingInspection.jsx
import React from "react";

const EmergencyLightingInspection = (props) => {
  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2 style={{ textAlign: "center" }}>
        Emergency Lighting Inspection & Test Certificate
      </h2>
      <h3 style={{ textAlign: "center" }}>BS5266-1: 2011</h3>

      <div
        style={{ margin: "20px 0", border: "1px solid #ccc", padding: "10px" }}
      >
        <strong>WARNING:</strong> Full duration tests involve discharging the
        batteries, so the emergency lighting system will not be fully functional
        until the batteries have had time to recharge. For this reason, always
        carry out testing at times of minimal risk, or only test alternate
        luminaires at one time.
      </div>

      {/* Client Details */}
      <h3>Details of the Client</h3>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "20px",
        }}
      >
        <tbody>
          <tr>
            <td
              style={{
                width: "20%",
                fontWeight: "bold",
                border: "1px solid #000",
                padding: "8px",
              }}
            >
              Name:
            </td>
            <td style={{ border: "1px solid #000", padding: "8px" }}>
              {props.client?.name || ""}
            </td>
          </tr>
          <tr>
            <td
              style={{
                fontWeight: "bold",
                border: "1px solid #000",
                padding: "8px",
              }}
            >
              Address:
            </td>
            <td style={{ border: "1px solid #000", padding: "8px" }}>
              {props.client?.address || ""}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Installation Details */}
      <h3>Details of the Installation</h3>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "20px",
        }}
      >
        <tbody>
          <tr>
            <td
              style={{
                width: "20%",
                fontWeight: "bold",
                border: "1px solid #000",
                padding: "8px",
              }}
            >
              Name:
            </td>
            <td style={{ border: "1px solid #000", padding: "8px" }}>
              {props.installation?.name || ""}
            </td>
          </tr>
          <tr>
            <td
              style={{
                fontWeight: "bold",
                border: "1px solid #000",
                padding: "8px",
              }}
            >
              Address:
            </td>
            <td style={{ border: "1px solid #000", padding: "8px" }}>
              {props.installation?.address || ""}
            </td>
          </tr>
        </tbody>
      </table>

      {/* BSI Installation Category */}
      <h3>BSI Installation Category</h3>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "20px",
        }}
      >
        <thead>
          <tr>
            <th style={{ border: "1px solid #000", padding: "8px" }}>Type</th>
            <th style={{ border: "1px solid #000", padding: "8px" }}>Mode</th>
            <th style={{ border: "1px solid #000", padding: "8px" }}>
              Facilities
            </th>
            <th style={{ border: "1px solid #000", padding: "8px" }}>
              Duration (minutes)
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: "1px solid #000", padding: "8px" }}>
              {props.bsiData?.type || ""}
            </td>
            <td style={{ border: "1px solid #000", padding: "8px" }}>
              {props.bsiData?.mode || ""}
            </td>
            <td style={{ border: "1px solid #000", padding: "8px" }}>
              {props.bsiData?.facilities || ""}
            </td>
            <td style={{ border: "1px solid #000", padding: "8px" }}>
              {props.bsiData?.duration || ""}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Summary of Inspection */}
      <h3>Summary of Inspection</h3>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "20px",
        }}
      >
        <thead>
          <tr>
            <th
              style={{ border: "1px solid #000", padding: "8px", width: "60%" }}
            >
              Check
            </th>
            <th
              style={{ border: "1px solid #000", padding: "8px", width: "40%" }}
            >
              Result
            </th>
          </tr>
        </thead>
        <tbody>
          {props.inspectionChecks?.map((check, index) => (
            <tr key={index}>
              <td style={{ border: "1px solid #000", padding: "8px" }}>
                <input
                  type="checkbox"
                  checked={check.checked || false}
                  readOnly
                  style={{ marginRight: "10px" }}
                />{" "}
                {check.label}
              </td>
              <td style={{ border: "1px solid #000", padding: "8px" }}>
                <input
                  type="checkbox"
                  checked={check.satisfactory || false}
                  readOnly
                  style={{ marginRight: "10px" }}
                />{" "}
                Satisfactory
                <span style={{ marginLeft: "10px" }}>
                  {check.remarks || ""}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Additional Comments & Deviations */}
      <h3>Additional Comments & Deviations</h3>
      <div
        style={{
          border: "1px solid #000",
          minHeight: "100px",
          padding: "10px",
          marginBottom: "20px",
        }}
      >
        <p>{props.comments || "No additional comments"}</p>
      </div>

      {/* Certification */}
      <div style={{ marginTop: "40px" }}>
        <p>
          We hereby certify that the emergency lighting system installation at
          the above premises has been inspected and tested by us in accordance
          with BS 5266-1: 2011, and to the best of our knowledge and belief, the
          installation complies at the time of inspection and testing with the
          recommendations given in BS 5266. Emergency lighting Part 1:2011. Code
          of practice for the Emergency lighting of premises, published by the
          BSI for a category (stated above) except as stated in the deviations
          above.
        </p>

        <table style={{ width: "100%", marginTop: "30px" }}>
          <tbody>
            <tr>
              <td style={{ width: "30%" }}>Name:</td>
              <td style={{ borderBottom: "1px solid #000" }}>
                {props.inspector?.name || ""}
              </td>
              <td style={{ width: "10%" }}></td>
              <td style={{ width: "20%" }}>Position:</td>
              <td style={{ borderBottom: "1px solid #000" }}>
                {props.inspector?.position || ""}
              </td>
            </tr>
            <tr>
              <td>Signature:</td>
              <td
                style={{ borderBottom: "1px solid #000", height: "40px" }}
              ></td>
              <td></td>
              <td>Date:</td>
              <td style={{ borderBottom: "1px solid #000" }}>
                {props.inspector?.date || ""}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmergencyLightingInspection;
