import React, { useEffect, useState, useRef } from "react";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { get, post, uploadSiteCheckDoc } from "../../../../api";
import { UploadFile } from "@mui/icons-material";
import {
  Typography,
  Grid,
  IconButton,
  TextField,
  FormControlLabel,
  Checkbox,
  Box,
  Button,
  Chip,
} from "@mui/material";
import {
  deleteUser,
  getSites,
  getUsers,
  getSiteAssets,
  getSiteLayout,
} from "../../../../store/thunk/site";

const AsbestonSample = ({
  sasToken,
  checkId,
  siteAssets,
  siteLayout,
  getSiteAssets,
  siteSelectedForGlobal,
  getSiteLayout,
}) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState([
    { sampleNo: "AS001", expanded: false },
  ]);
  const [completed, setCompleted] = useState(false);

  // Material Assessment Dropdowns Data
  const [materialAssProductType, setmaterialAssProductType] = useState([]);
  const [materialDamage, setMaterialDamage] = useState([]);
  const [materialSurface, setMaterialSurface] = useState([]);
  const [materialAsbestosType, setMaterialAsbestosType] = useState([]);

  // Priority Assessment Dropdown Data
  const [mainActivity, setMainActivity] = useState([]);
  const [secondaryActivity, setSecondaryActivity] = useState([]);
  const [location, setLocation] = useState([]);
  const [accessibility, setAccessibility] = useState([]);
  const [extentAmount, setExtentAmount] = useState([]);
  const [numberOfOccupants, setNumberOfOccupants] = useState([]);
  const [frequencyOfUse, setFrequencyOfUse] = useState([]);
  const [averageUse, setAverageUse] = useState([]);
  const [maintenanceActivityType, setMaintenanceActivityType] = useState([]);
  const [maintenanceActivityFreq, setMaintenanceActivityFreq] = useState([]);
  const fileInputRefs = useRef([]);
  const getDropDowns = async () => {
    // Material Assessment Dropdowns
    const materialAssProductTypes = await get(
      "/api/lov/ASBESTOS_MATERIAL_ASSESSMENT_PRODUCT_TYPE"
    );
    setmaterialAssProductType(materialAssProductTypes);

    const materialDamages = await get("/api/lov/ASBESTOS_MATERIAL_DAMAGE");
    setMaterialDamage(materialDamages);

    const materialSurfaces = await get("/api/lov/ASBESTOS_MATERIAL_SURFACE");
    setMaterialSurface(materialSurfaces);

    const materialAsbestosTypes = await get(
      "/api/lov/ASBESTOS_MATERIAL_ASBESTOS_TYPE"
    );
    setMaterialAsbestosType(materialAsbestosTypes);

    // Priority Assessment Dropdowns
    const mainActivities = await get("/api/lov/ASBESTOS_PA_MAIN_ACTIVITY");
    setMainActivity(mainActivities);

    const secondaryActivities = await get(
      "/api/lov/ASBESTOS_PA_SECONDARY_ACTIVITY"
    );
    setSecondaryActivity(secondaryActivities);

    const locations = await get("/api/lov/ASBESTOS_PA_LOCATION");
    setLocation(locations);

    const accessibilities = await get("/api/lov/ASBESTOS_PA_ACCESSIBILITY");
    setAccessibility(accessibilities);

    const extentAmounts = await get("/api/lov/ASBESTOS_PA_EXTENT_AMOUNT");
    setExtentAmount(extentAmounts);

    // const occupants = await get("/api/lov/ASBESTOS_PA_NUMBER_OF_OCCUPANTS");
    // setNumberOfOccupants(occupants);

    const frequencyOfUses = await get("/api/lov/ASBESTOS_PA_FREQUENCY_OF_USE");
    setFrequencyOfUse(frequencyOfUses);

    const averageUses = await get("/api/lov/ASBESTOS_PA_AVERAGE_USE");
    setAverageUse(averageUses);

    const maintenanceActivityTypes = await get(
      "/api/lov/ASBESTOS_PA_MAINTENANCE_ACTIVITY_TYPE"
    );
    setMaintenanceActivityType(maintenanceActivityTypes);

    const maintenanceActivityFreqs = await get(
      "/api/lov/ASBESTOS_PA_MAINTENANCE_ACTIVITY_FREQ"
    );
    setMaintenanceActivityFreq(maintenanceActivityFreqs);
  };

  useEffect(() => {
    getDropDowns();
    if (siteSelectedForGlobal?.siteId) {
      getSiteAssets(siteSelectedForGlobal?.siteId);
      getSiteLayout(siteSelectedForGlobal?.siteId);
    }
    getAsbestosSample();
  }, []);

  const getAsbestosSample = async () => {
    const data = await get("/api/site-check/asbestos-sample/" + checkId);
    if (data.length > 0) {
      setFormData(data);
      setCompleted(true);
    }
  };

  useEffect(() => {
    console.log("Aesbestos Sample:: ", formData);
  }, [formData]);

  const calculateScores = (data) => {
    // Destructure the relevant fields for totalMatScore
    const { productType, damage, asbestosType, surfaceTreatment } = data;

    // Calculate totalMatScore
    const totalMatScore =
      (Number.parseInt(productType, 10) || 0) +
      (Number.parseInt(damage, 10) || 0) +
      (Number.parseInt(asbestosType, 10) || 0) +
      (Number.parseInt(surfaceTreatment, 10) || 0);

    // Calculate totalPriScore (sum of remaining properties except the 4 above)
    const totalPriScore = Object.keys(data).reduce((sum, key) => {
      if (
        [
          "mainActivityScore",
          "secondaryActivityScore",
          "location",
          "accessibility",
          "extent",
          "occupants",
          "frequencyOfUse",
          "avgTimeInUse",
          "maintenanceActivityType",
          "maintenanceFrequency",
        ].includes(key)
      ) {
        sum += Number.parseInt(data[key], 10) || 0;
      }
      return sum;
    }, 0);

    // Calculate totalRiskScore
    const totalRiskScore = totalMatScore + totalPriScore;

    return { totalMatScore, totalPriScore, totalRiskScore };
  };

  const handleInputChange = (e, idx) => {
    const { name, value } = e.target;
    const updatedFormData = [...formData];
    const updatedData = {
      ...updatedFormData[idx],
      [name]: value,
    };

    // Calculate the scores
    const { totalMatScore, totalPriScore, totalRiskScore } =
      calculateScores(updatedData);

    // Update the form data with the calculated scores
    updatedFormData[idx] = {
      ...updatedData,
      totalMatScore,
      totalPriScore,
      totalRiskScore,
    };

    setFormData(updatedFormData);
  };

  const handleCheckChange = (e, idx) => {
    const uformData = [...formData];
    const udata = {
      ...formData[idx],
      removedFromSite: e.target.checked,
      update: true,
    };
    uformData[idx] = udata;
    setFormData(uformData);
  };

  const handleFileDelete = (idx) => {
    console.log("Set the file object as null for the index:: ", idx);
    const uformData = [...formData];
    const udata = {
      ...formData[idx],
    };
    if (formData[idx]?.file) delete udata["file"];
    uformData[idx] = udata;
    setFormData(uformData);

    // Reset the file input element to allow user to upload
    if (fileInputRefs.current[idx]) {
      fileInputRefs.current[idx].value = "";
    }
  };

  const handleFileChange = (e, idx) => {
    console.log("FIle uplaoded at data index:: ", idx);
    const uformData = [...formData];
    const udata = {
      ...formData[idx],
      file: e.target.files[0],
      update: true,
    };
    console.log("uFormdata:: ", uformData);
    console.log("udata:: ", udata);
    uformData[idx] = udata;
    setFormData(uformData);
  };

  const addAsbestosSample = async (event) => {
    event.preventDefault();
    const form = event.target;

    if (!form.checkValidity()) {
      form.reportValidity();
    }

    for (const data of formData) {
      if (data.update) {
        if (data?.file?.name) {
          data.siteId = siteSelectedForGlobal?.siteId;
          data.sampleFileUrl = await uploadSiteCheckDoc(data);
          delete data.file;
        }
        data.nextInspectionDate = new Date(data.nextInspectionDate);
        data.checkId = checkId;
        data.status = "Pending";
        console.log(formData);
        await post("/api/site-check/asbestos-sample", data);
      }
    }
    toast.success("Asbestos data saved");
    setCompleted(true);
  };

  const expandRow = (e, idx) => {
    e.preventDefault();
    const udata = [...formData];
    udata[idx].expanded = !udata[idx].expanded;
    setFormData(udata);
  };

  return (
    <form onSubmit={addAsbestosSample}>
      <Grid container>
        <Grid sm={6}>
          <br />
          <Typography variant="h6" gutterBottom>
            Asbestos Samples
          </Typography>
        </Grid>
        <Grid sm={6}>
          <button
            type="button"
            style={{
              width: "250px",
              marginBottom: "30px",
              margin: "10px",
              float: "right",
            }}
            className="btn btn-primary btn-light"
            onClick={() => {
              const uformData = [...formData];
              uformData.push({
                sampleNo: "AS00" + (formData[formData.length - 1].sampleId + 1),
              });
              setFormData(uformData);
            }}
          >
            <i className="fas fa-plus" /> Add New Sample
          </button>
        </Grid>

        <Grid sm={12}>
          <div className="table-responsive">
            <table className="table table-bordered f-11">
              <thead className="table-dark">
                <tr>
                  <th scope="col">Sample No.</th>
                  <th scope="col">Location</th>
                  <th scope="col">Product</th>
                  <th scope="col">Qty</th>
                  <th scope="col">Surface Coating</th>
                  <th scope="col">Condition</th>
                  <th scope="col">Access</th>
                  <th scope="col">Asbestos Type</th>
                  <th scope="col">Material Score</th>
                  <th scope="col">Priority Score</th>
                  <th scope="col">Total Score</th>

                  <th scope="col"></th>
                </tr>
              </thead>
              <tbody>
                {formData.map((d, idx) => {
                  return (
                    <>
                      <tr>
                        {/* aaquib */}
                        <td>{d.sampleId ? "AS00" + d.sampleId : d.sampleNo}</td>
                        <td>
                          {
                            location?.filter(
                              (num) => num.lovValue === d.location
                            )?.[0]?.lovDesc
                          }
                        </td>
                        <td>
                          {
                            materialAssProductType?.filter(
                              (num) => num.lovValue === d.productType
                            )?.[0]?.lovDesc
                          }
                        </td>
                        <td>{d.quantity}</td>
                        <td>
                          {
                            materialSurface?.filter(
                              (num) => num.lovValue === d.surfaceTreatment
                            )?.[0]?.lovDesc
                          }
                        </td>
                        <td>
                          {
                            materialDamage?.filter(
                              (num) => num.lovValue === d.damage
                            )?.[0]?.lovDesc
                          }
                        </td>
                        <td>
                          {
                            accessibility?.filter(
                              (num) => num.lovValue === d.accessibility
                            )?.[0]?.lovDesc
                          }
                        </td>
                        <td>
                          {
                            materialAsbestosType?.filter(
                              (num) => num.lovValue === d.asbestosType
                            )?.[0]?.lovDesc
                          }
                        </td>

                        <td>{d.totalMatScore}</td>
                        <td>{d.totalPriScore}</td>
                        <td>{d.totalRiskScore}</td>
                        <td
                          style={{ width: "80px" }}
                          align="center"
                          onClick={(e) => {
                            expandRow(e, idx);
                          }}
                        >
                          <h1> {d.expanded ? "-" : "+"}</h1>
                        </td>
                      </tr>
                      {d.expanded && (
                        <tr>
                          <td
                            style={{ backgroundColor: "#e8e9ea" }}
                            colSpan={12}
                          >
                            <Box>
                              <Grid container>
                                <Grid sm={6}>
                                  <Box
                                    p={2}
                                    style={{
                                      backgroundColor: "white",
                                      margin: "10px",
                                      borderRadius: "5px",
                                    }}
                                  >
                                    <Typography variant="h6" gutterBottom>
                                      &nbsp;Sample Information
                                    </Typography>
                                    <hr />
                                    <Grid container spacing={1}>
                                      <Grid item xs={12}>
                                        <Box
                                          display="flex"
                                          flexDirection="column"
                                          alignItems="center"
                                          justifyContent="center"
                                          border="1px dashed grey"
                                          p={2}
                                          mb={2}
                                          style={{
                                            backgroundColor: "#f9f9f9",
                                            height: "130px",
                                            borderRadius: "4px",
                                            color: "#3f51b5",
                                            margin: "20px",
                                            width: "600px",
                                          }}
                                        >
                                          <IconButton component="label">
                                            <input
                                              hidden
                                              type="file"
                                              ref={(el) =>
                                                (fileInputRefs.current[idx] =
                                                  el)
                                              }
                                              onChange={(e) =>
                                                handleFileChange(e, idx)
                                              }
                                            />
                                            <UploadFile />
                                          </IconButton>
                                          <Typography align="center">
                                            {formData?.[idx]?.sampleFileUrl ||
                                            formData?.[idx]?.file
                                              ? "File Uploaded Successfully!"
                                              : " Click to upload or drag and drop Image File (PDF) (max, 1MB)"}
                                          </Typography>
                                        </Box>
                                        {formData?.[idx]?.file && (
                                          <Grid
                                            xs={12}
                                            alignItems="center"
                                            style={{ margin: "5px" }}
                                          >
                                            <Chip
                                              label={
                                                formData?.[idx]?.file?.name
                                              }
                                              onDelete={() =>
                                                handleFileDelete(idx)
                                              }
                                            />
                                          </Grid>
                                        )}
                                        {formData?.[idx]?.sampleFileUrl && (
                                          <a
                                            href={
                                              formData?.[idx]?.sampleFileUrl
                                            }
                                            target="_blank"
                                          >
                                            <button
                                              type="button"
                                              style={{
                                                width: "200px",
                                                marginBottom: "20px",
                                                margin: "10px",
                                                float: "left",
                                              }}
                                              className="btn btn-primary"
                                              //onClick={(e) => e.preventDefault()}
                                            >
                                              <i className="fas fa-download" />
                                              &nbsp;Download Image
                                            </button>
                                          </a>
                                        )}
                                      </Grid>
                                      <Grid item xs={12} sm={6}>
                                        <label
                                          htmlFor="folder"
                                          name="folder"
                                          style={{ marginLeft: "5px" }}
                                        >
                                          Sample Number
                                        </label>
                                        <input
                                          type="text"
                                          value={
                                            "AS00" +
                                              formData?.[idx]?.sampleId ?? "0"
                                          }
                                          disabled
                                          onChange={(e) =>
                                            handleInputChange(e, idx)
                                          }
                                          name="sampleNumber"
                                          className="form-control"
                                          style={{
                                            marginLeft: "5px",
                                            maxWidth: "300px",
                                          }}
                                        />
                                      </Grid>
                                      <Grid item xs={12} sm={6}>
                                        <label
                                          htmlFor="riskType"
                                          name="riskType"
                                          style={{ marginLeft: "5px" }}
                                        >
                                          Internal/External
                                        </label>
                                        <select
                                          style={{
                                            maxWidth: "300px",
                                            marginLeft: "5px",
                                          }}
                                          disabled={formData[idx]?.completed}
                                          value={formData?.[idx]?.riskType}
                                          className="form-control form-select"
                                          name="riskType"
                                          required
                                          onChange={(e) =>
                                            handleInputChange(e, idx)
                                          }
                                          //value={quest[idx]?.response?.riskType}
                                        >
                                          <option value="">Select </option>
                                          {["Internal", "External"].map(
                                            (num) => (
                                              <option value={num}>
                                                {num}{" "}
                                              </option>
                                            )
                                          )}
                                        </select>
                                      </Grid>
                                      <Grid item xs={12} sm={6}>
                                        <label
                                          htmlFor="floor"
                                          name="floor"
                                          style={{ marginLeft: "5px" }}
                                        >
                                          Floor
                                        </label>
                                        <select
                                          disabled={formData[idx]?.completed}
                                          className="form-control form-select"
                                          name="floor"
                                          required
                                          style={{
                                            maxWidth: "300px",
                                            marginLeft: "5px",
                                          }}
                                          value={formData?.[idx]?.floor}
                                          onChange={(e) =>
                                            handleInputChange(e, idx)
                                          }
                                        >
                                          <option value="">Select </option>
                                          {siteLayout
                                            .filter(
                                              (site) =>
                                                site.nodeType === "floor"
                                            )
                                            .map((site) => (
                                              <option value={site.id}>
                                                {site.nodeName}{" "}
                                              </option>
                                            ))}
                                        </select>
                                      </Grid>
                                      <Grid item xs={12} sm={6}>
                                        <label
                                          htmlFor="room"
                                          name="room"
                                          style={{ marginLeft: "5px" }}
                                        >
                                          Room
                                        </label>
                                        <select
                                          disabled={formData[idx]?.completed}
                                          className="form-control form-select"
                                          name="room"
                                          required
                                          value={formData[idx]?.room}
                                          onChange={(e) =>
                                            handleInputChange(e, idx)
                                          }
                                          style={{
                                            maxWidth: "300px",
                                            marginLeft: "5px",
                                          }}
                                        >
                                          <option value="">Select </option>
                                          {siteLayout
                                            .filter(
                                              (site) => site.nodeType === "room"
                                            )
                                            .map((site) => (
                                              <option value={site.id}>
                                                {site.nodeName}
                                              </option>
                                            ))}
                                        </select>
                                      </Grid>
                                      <Grid item xs={12} sm={6}>
                                        <label
                                          htmlFor="folder"
                                          name="folder"
                                          style={{ marginLeft: "5px" }}
                                        >
                                          Area
                                        </label>
                                        <input
                                          type="text"
                                          disabled={formData[idx]?.completed}
                                          onChange={(e) =>
                                            handleInputChange(e, idx)
                                          }
                                          value={formData[idx]?.area}
                                          name="area"
                                          className="form-control"
                                          style={{
                                            maxWidth: "300px",
                                            marginLeft: "5px",
                                          }}
                                        />
                                      </Grid>
                                      <Grid item xs={12} sm={6}>
                                        <label
                                          htmlFor="folder"
                                          name="folder"
                                          style={{ marginLeft: "5px" }}
                                        >
                                          Quantity
                                        </label>
                                        <input
                                          type="text"
                                          disabled={formData[idx]?.completed}
                                          onChange={(e) =>
                                            handleInputChange(e, idx)
                                          }
                                          value={formData[idx]?.quantity}
                                          name="quantity"
                                          className="form-control"
                                          style={{
                                            maxWidth: "300px",
                                            marginLeft: "5px",
                                          }}
                                        />
                                      </Grid>
                                      <Grid item xs={12} sm={6}>
                                        <label
                                          htmlFor="riskType"
                                          name="riskType"
                                          style={{ marginLeft: "5px" }}
                                        >
                                          HSE Notifiable
                                        </label>
                                        <select
                                          disabled={formData[idx]?.completed}
                                          onChange={(e) =>
                                            handleInputChange(e, idx)
                                          }
                                          value={formData[idx]?.hseNotification}
                                          className="form-control form-select"
                                          name="hseNotification"
                                          required
                                          style={{
                                            maxWidth: "300px",
                                            marginLeft: "5px",
                                          }}
                                        >
                                          <option value="">Select </option>
                                          {["Yes", "No"].map((num) => (
                                            <option value={num}>{num} </option>
                                          ))}
                                        </select>
                                      </Grid>
                                      <Grid item xs={12} sm={6}>
                                        <label
                                          htmlFor="folder"
                                          name="folder"
                                          style={{ marginLeft: "5px" }}
                                        >
                                          Licensed Material
                                        </label>
                                        <input
                                          type="text"
                                          disabled={formData[idx]?.completed}
                                          onChange={(e) =>
                                            handleInputChange(e, idx)
                                          }
                                          value={
                                            formData[idx]?.licensedMaterial
                                          }
                                          name="licensedMaterial"
                                          className="form-control"
                                          style={{
                                            maxWidth: "300px",
                                            marginLeft: "5px",
                                          }}
                                        />
                                      </Grid>
                                      <Grid item xs={12} sm={6}>
                                        <label
                                          htmlFor="folder"
                                          name="folder"
                                          style={{ marginLeft: "5px" }}
                                        >
                                          Identification
                                        </label>
                                        <input
                                          type="text"
                                          disabled={formData[idx]?.completed}
                                          onChange={(e) =>
                                            handleInputChange(e, idx)
                                          }
                                          value={formData[idx]?.identification}
                                          name="identification"
                                          className="form-control"
                                          style={{
                                            maxWidth: "300px",
                                            marginLeft: "5px",
                                            marginBottom: "10px",
                                          }}
                                        />
                                      </Grid>
                                      <Grid item xs={12} sm={6}>
                                        <FormControlLabel
                                          control={
                                            <Checkbox
                                              name="removedFromSite"
                                              onChange={(e) =>
                                                handleCheckChange(e, idx)
                                              }
                                              checked={
                                                formData[idx]?.removedFromSite
                                              }
                                            />
                                          }
                                          label="Mark sample as removed"
                                        />
                                      </Grid>
                                      <Grid item sm={12}>
                                        <label
                                          htmlFor="folder"
                                          name="folder"
                                          style={{ marginLeft: "5px" }}
                                        >
                                          Surveyor Comments
                                        </label>
                                        <textarea
                                          rows="3"
                                          disabled={formData[idx]?.completed}
                                          onChange={(e) =>
                                            handleInputChange(e, idx)
                                          }
                                          value={formData[idx]?.comment}
                                          name="comment"
                                          className="form-control"
                                          style={{
                                            maxWidth: "620px",
                                            marginLeft: "5px",
                                            marginBottom: "10px",
                                          }}
                                        />
                                      </Grid>
                                    </Grid>
                                  </Box>
                                </Grid>
                                <Grid sm={6}>
                                  <Grid container>
                                    <Grid sm={12}>
                                      <Box
                                        padding={2}
                                        style={{
                                          backgroundColor: "white",
                                          margin: "10px",
                                          borderRadius: "5px",
                                        }}
                                      >
                                        <Typography variant="h6" gutterBottom>
                                          &nbsp;Material Assessment
                                        </Typography>
                                        <hr />
                                        <Grid container spacing={1}>
                                          <Grid item xs={12} sm={6}>
                                            <label
                                              htmlFor="riskType"
                                              name="riskType"
                                              style={{ marginLeft: "5px" }}
                                            >
                                              Product Type
                                            </label>
                                            <select
                                              disabled={
                                                formData[idx]?.completed
                                              }
                                              onChange={(e) =>
                                                handleInputChange(e, idx)
                                              }
                                              value={formData[idx]?.productType}
                                              className="form-control form-select"
                                              name="productType"
                                              required
                                              style={{
                                                maxWidth: "300px",
                                                marginLeft: "5px",
                                              }}
                                            >
                                              <option value="">Select </option>
                                              {materialAssProductType.map(
                                                (num) => (
                                                  <option value={num.lovValue}>
                                                    {num.lovValue} -{" "}
                                                    {num.lovDesc}{" "}
                                                  </option>
                                                )
                                              )}
                                            </select>
                                          </Grid>
                                          <Grid item xs={12} sm={6}>
                                            <label
                                              htmlFor="riskType"
                                              name="riskType"
                                              style={{ marginLeft: "5px" }}
                                            >
                                              Damage
                                            </label>
                                            <select
                                              disabled={
                                                formData[idx]?.completed
                                              }
                                              onChange={(e) =>
                                                handleInputChange(e, idx)
                                              }
                                              value={formData[idx]?.damage}
                                              className="form-control form-select"
                                              name="damage"
                                              required
                                              style={{
                                                maxWidth: "300px",
                                                marginLeft: "5px",
                                              }}
                                            >
                                              <option value="">Select </option>
                                              {materialDamage?.map((num) => (
                                                <option value={num.lovValue}>
                                                  {num.lovValue} - {num.lovDesc}{" "}
                                                </option>
                                              ))}
                                            </select>
                                          </Grid>
                                          <Grid item xs={12} sm={6}>
                                            <label
                                              htmlFor="riskType"
                                              name="riskType"
                                              style={{ marginLeft: "5px" }}
                                            >
                                              Surface Treatment
                                            </label>
                                            <select
                                              disabled={
                                                formData[idx]?.completed
                                              }
                                              onChange={(e) =>
                                                handleInputChange(e, idx)
                                              }
                                              value={
                                                formData[idx]?.surfaceTreatment
                                              }
                                              className="form-control form-select"
                                              name="surfaceTreatment"
                                              required
                                              style={{
                                                maxWidth: "300px",
                                                marginLeft: "5px",
                                              }}
                                            >
                                              <option value="">Select </option>
                                              {materialSurface?.map((num) => (
                                                <option value={num.lovValue}>
                                                  {num.lovValue} - {num.lovDesc}{" "}
                                                </option>
                                              ))}
                                            </select>
                                          </Grid>
                                          <Grid item xs={12} sm={6}>
                                            <label
                                              htmlFor="riskType"
                                              name="riskType"
                                              style={{ marginLeft: "5px" }}
                                            >
                                              Asbestos Type
                                            </label>
                                            <select
                                              disabled={
                                                formData[idx]?.completed
                                              }
                                              onChange={(e) =>
                                                handleInputChange(e, idx)
                                              }
                                              value={
                                                formData[idx]?.asbestosType
                                              }
                                              className="form-control form-select"
                                              name="asbestosType"
                                              required
                                              style={{
                                                maxWidth: "300px",
                                                marginLeft: "5px",
                                                marginBottom: "20px",
                                              }}
                                            >
                                              <option value="">Select </option>
                                              {materialAsbestosType.map(
                                                (num) => (
                                                  <option value={num.lovValue}>
                                                    {num.lovValue} -{" "}
                                                    {num.lovDesc}{" "}
                                                  </option>
                                                )
                                              )}
                                            </select>
                                          </Grid>
                                        </Grid>
                                      </Box>
                                    </Grid>
                                    <Grid sm={12}>
                                      <Box
                                        padding={2}
                                        style={{
                                          backgroundColor: "white",
                                          margin: "10px",
                                          borderRadius: "5px",
                                        }}
                                      >
                                        <Typography variant="h6" gutterBottom>
                                          &nbsp;Priority Assessment
                                        </Typography>
                                        <hr />
                                        <Grid container spacing={1}>
                                          <Grid item xs={12} sm={12}>
                                            <b style={{ color: "gray" }}>
                                              &nbsp;NORMAL ACTIVITY
                                            </b>
                                          </Grid>
                                          <Grid item xs={12} sm={6}>
                                            <label
                                              htmlFor="riskType"
                                              name="riskType"
                                              style={{ marginLeft: "5px" }}
                                            >
                                              Main type of activity in area
                                            </label>
                                            <select
                                              disabled={
                                                formData[idx]?.completed
                                              }
                                              onChange={(e) =>
                                                handleInputChange(e, idx)
                                              }
                                              value={
                                                formData[idx]?.mainActivityScore
                                              }
                                              className="form-control form-select"
                                              name="mainActivityScore"
                                              required
                                              style={{
                                                maxWidth: "300px",
                                                marginLeft: "5px",
                                              }}
                                            >
                                              <option value="">Select </option>
                                              {mainActivity?.map((num) => (
                                                <option value={num.lovValue}>
                                                  {num.lovValue} - {num.lovDesc}{" "}
                                                </option>
                                              ))}
                                            </select>
                                          </Grid>
                                          <Grid item xs={12} sm={6}>
                                            <label
                                              htmlFor="riskType"
                                              name="riskType"
                                              style={{ marginLeft: "5px" }}
                                            >
                                              Secondary activities in area
                                            </label>
                                            <select
                                              disabled={
                                                formData[idx]?.completed
                                              }
                                              onChange={(e) =>
                                                handleInputChange(e, idx)
                                              }
                                              value={
                                                formData[idx]
                                                  ?.secondaryActivityScore
                                              }
                                              className="form-control form-select"
                                              name="secondaryActivityScore"
                                              required
                                              style={{
                                                maxWidth: "300px",
                                                marginLeft: "5px",
                                                marginBottom: "5px",
                                              }}
                                            >
                                              <option value="">Select </option>
                                              {secondaryActivity?.map((num) => (
                                                <option value={num.lovValue}>
                                                  {num.lovValue} - {num.lovDesc}{" "}
                                                </option>
                                              ))}
                                            </select>
                                          </Grid>
                                          <Grid item xs={12} sm={12}>
                                            <b style={{ color: "gray" }}>
                                              &nbsp;DISTURBANCE LIKELIHOOD
                                            </b>
                                          </Grid>
                                          <Grid item xs={12} sm={4}>
                                            <label
                                              htmlFor="riskType"
                                              name="riskType"
                                              style={{ marginLeft: "5px" }}
                                            >
                                              Location
                                            </label>
                                            <select
                                              disabled={
                                                formData[idx]?.completed
                                              }
                                              onChange={(e) =>
                                                handleInputChange(e, idx)
                                              }
                                              value={formData[idx]?.location}
                                              className="form-control form-select"
                                              name="location"
                                              required
                                              style={{
                                                maxWidth: "190px",
                                                marginLeft: "5px",
                                              }}
                                            >
                                              <option value="">Select </option>
                                              {location?.map((num) => (
                                                <option value={num.lovValue}>
                                                  {num.lovValue} - {num.lovDesc}{" "}
                                                </option>
                                              ))}
                                            </select>
                                          </Grid>
                                          <Grid item xs={12} sm={4}>
                                            <label
                                              htmlFor="riskType"
                                              name="riskType"
                                              style={{ marginLeft: "5px" }}
                                            >
                                              Accessibility
                                            </label>
                                            <select
                                              disabled={
                                                formData[idx]?.completed
                                              }
                                              onChange={(e) =>
                                                handleInputChange(e, idx)
                                              }
                                              value={
                                                formData[idx]?.accessibility
                                              }
                                              className="form-control form-select"
                                              name="accessibility"
                                              required
                                              style={{
                                                maxWidth: "190px",
                                                marginLeft: "5px",
                                              }}
                                            >
                                              <option value="">Select </option>
                                              {accessibility?.map((num) => (
                                                <option value={num.lovValue}>
                                                  {num.lovValue} - {num.lovDesc}{" "}
                                                </option>
                                              ))}
                                            </select>
                                          </Grid>
                                          <Grid item xs={12} sm={4}>
                                            <label
                                              htmlFor="riskType"
                                              name="riskType"
                                              style={{ marginLeft: "5px" }}
                                            >
                                              Extent/Amount
                                            </label>
                                            <select
                                              disabled={
                                                formData[idx]?.completed
                                              }
                                              onChange={(e) =>
                                                handleInputChange(e, idx)
                                              }
                                              value={formData[idx]?.extent}
                                              className="form-control form-select"
                                              name="extent"
                                              required
                                              style={{
                                                maxWidth: "190px",
                                                marginLeft: "5px",
                                                marginBottom: "5px",
                                              }}
                                            >
                                              <option value="">Select </option>
                                              {extentAmount?.map((num) => (
                                                <option value={num.lovValue}>
                                                  {num.lovValue} - {num.lovDesc}{" "}
                                                </option>
                                              ))}
                                            </select>
                                          </Grid>
                                          <Grid item xs={12} sm={12}>
                                            <b style={{ color: "gray" }}>
                                              &nbsp;HUMAN EXPOSURE POTENTIAL
                                            </b>
                                          </Grid>
                                          <Grid item xs={12} sm={4}>
                                            <label
                                              htmlFor="riskType"
                                              name="riskType"
                                              style={{ marginLeft: "5px" }}
                                            >
                                              Number of occupants
                                            </label>
                                            <select
                                              disabled={
                                                formData[idx]?.completed
                                              }
                                              onChange={(e) =>
                                                handleInputChange(e, idx)
                                              }
                                              value={formData[idx]?.occupants}
                                              className="form-control form-select"
                                              name="occupants"
                                              required
                                              style={{
                                                maxWidth: "190px",
                                                marginLeft: "5px",
                                              }}
                                            >
                                              <option value="">Select </option>
                                              {[
                                                "1",
                                                "2",
                                                "3",
                                                "4",
                                                "5",
                                                "6",
                                                "7",
                                                "8",
                                                "9",
                                                "10",
                                                ">10",
                                              ].map((num) => (
                                                <option value={num}>
                                                  {num}{" "}
                                                </option>
                                              ))}
                                            </select>
                                          </Grid>
                                          <Grid item xs={12} sm={4}>
                                            <label
                                              htmlFor="riskType"
                                              name="riskType"
                                              style={{ marginLeft: "5px" }}
                                            >
                                              Frequency of use of area
                                            </label>
                                            <select
                                              disabled={
                                                formData[idx]?.completed
                                              }
                                              onChange={(e) =>
                                                handleInputChange(e, idx)
                                              }
                                              value={
                                                formData[idx]?.frequencyOfUse
                                              }
                                              className="form-control form-select"
                                              name="frequencyOfUse"
                                              required
                                              style={{
                                                maxWidth: "190px",
                                                marginLeft: "5px",
                                              }}
                                            >
                                              <option value="">Select </option>
                                              {frequencyOfUse?.map((num) => (
                                                <option value={num.lovValue}>
                                                  {num.lovValue} - {num.lovDesc}{" "}
                                                </option>
                                              ))}
                                            </select>
                                          </Grid>
                                          <Grid item xs={12} sm={4}>
                                            <label
                                              htmlFor="riskType"
                                              name="riskType"
                                              style={{ marginLeft: "5px" }}
                                            >
                                              Average use
                                            </label>
                                            <select
                                              disabled={
                                                formData[idx]?.completed
                                              }
                                              onChange={(e) =>
                                                handleInputChange(e, idx)
                                              }
                                              value={
                                                formData[idx]?.avgTimeInUse
                                              }
                                              className="form-control form-select"
                                              name="avgTimeInUse"
                                              required
                                              style={{
                                                maxWidth: "190px",
                                                marginLeft: "5px",
                                                marginBottom: "5px",
                                              }}
                                            >
                                              <option value="">Select </option>
                                              {averageUse?.map((num) => (
                                                <option value={num.lovValue}>
                                                  {num.lovValue} - {num.lovDesc}{" "}
                                                </option>
                                              ))}
                                            </select>
                                          </Grid>
                                          <Grid item xs={12} sm={12}>
                                            <b style={{ color: "gray" }}>
                                              &nbsp;HUMAN EXPOSURE POTENTIAL
                                            </b>
                                          </Grid>
                                          <Grid item xs={12} sm={6}>
                                            <label
                                              htmlFor="riskType"
                                              name="riskType"
                                              style={{ marginLeft: "5px" }}
                                            >
                                              Maintenance activity type
                                            </label>
                                            <select
                                              disabled={
                                                formData[idx]?.completed
                                              }
                                              onChange={(e) =>
                                                handleInputChange(e, idx)
                                              }
                                              value={
                                                formData[idx]
                                                  ?.maintenanceActivityType
                                              }
                                              className="form-control form-select"
                                              name="maintenanceActivityType"
                                              required
                                              style={{
                                                maxWidth: "300px",
                                                marginLeft: "5px",
                                              }}
                                            >
                                              <option value="">Select </option>
                                              {maintenanceActivityType?.map(
                                                (num) => (
                                                  <option value={num.lovValue}>
                                                    {num.lovValue} -{" "}
                                                    {num.lovDesc}{" "}
                                                  </option>
                                                )
                                              )}
                                            </select>
                                          </Grid>
                                          <Grid item xs={12} sm={6}>
                                            <label
                                              htmlFor="riskType"
                                              name="riskType"
                                              style={{ marginLeft: "5px" }}
                                            >
                                              Maintenance activity freq.
                                            </label>
                                            <select
                                              disabled={
                                                formData[idx]?.completed
                                              }
                                              onChange={(e) =>
                                                handleInputChange(e, idx)
                                              }
                                              value={
                                                formData[idx]
                                                  ?.maintenanceFrequency
                                              }
                                              className="form-control form-select"
                                              name="maintenanceFrequency"
                                              required
                                              style={{
                                                maxWidth: "300px",
                                                marginLeft: "5px",
                                                marginBottom: "20px",
                                              }}
                                            >
                                              <option value="">Select </option>
                                              {maintenanceActivityFreq?.map(
                                                (num) => (
                                                  <option value={num.lovValue}>
                                                    {num.lovValue} -{" "}
                                                    {num.lovDesc}{" "}
                                                  </option>
                                                )
                                              )}
                                            </select>
                                          </Grid>
                                        </Grid>
                                      </Box>
                                    </Grid>
                                  </Grid>
                                </Grid>

                                <Grid sm={12}>
                                  <Box
                                    p={2}
                                    style={{
                                      backgroundColor: "white",
                                      margin: "10px",
                                      borderRadius: "5px",
                                    }}
                                  >
                                    <Typography variant="h6" gutterBottom>
                                      &nbsp;Outcome
                                    </Typography>
                                    <hr />
                                    <Grid container spacing={1}>
                                      <Grid item xs={6}>
                                        <Grid container>
                                          <Grid xs={12}>
                                            <div
                                              style={{
                                                display: "flex",
                                                gap: "10px",
                                                marginLeft: "5px",
                                                marginRight: "20px",
                                              }}
                                            >
                                              <div>
                                                <label
                                                  htmlFor="totalMatScore"
                                                  name="totalMatScore"
                                                >
                                                  Mat Score
                                                </label>
                                                <input
                                                  name="totalMatScore"
                                                  id="totalMatScore"
                                                  //style={{ width: '100px'  }}
                                                  type="text"
                                                  className="form-control"
                                                  disabled
                                                  // value={
                                                  //   riskFactor[idx]?.response
                                                  //     ?.score ?? 0
                                                  // }
                                                  value={
                                                    formData[idx]?.totalMatScore
                                                  }
                                                />
                                              </div>
                                              <h1 style={{ lineHeight: "2" }}>
                                                +
                                              </h1>
                                              <div>
                                                <label
                                                  htmlFor="totalPriScore"
                                                  name="totalPriScore"
                                                >
                                                  Pri Score
                                                </label>
                                                <input
                                                  type="text"
                                                  //style={{ width: '100px' }}
                                                  className="form-control"
                                                  disabled
                                                  // value={
                                                  //   riskFactor[idx]?.weight
                                                  // }
                                                  value={
                                                    formData[idx]?.totalPriScore
                                                  }
                                                />
                                              </div>
                                              <h1 style={{ lineHeight: "2" }}>
                                                =
                                              </h1>
                                              <div>
                                                <label
                                                  htmlFor="totalRiskScore"
                                                  name="totalRiskScore"
                                                >
                                                  Total Score
                                                </label>
                                                <input
                                                  //style={{ width: '130px' }}
                                                  type="text"
                                                  className="form-control"
                                                  disabled
                                                  // value={
                                                  //   formData[idx]?.weight *
                                                  //   Number(
                                                  //     riskFactor[idx]?.response
                                                  //       ?.score ?? 0
                                                  //   )
                                                  // }
                                                  value={
                                                    formData[idx]
                                                      ?.totalRiskScore
                                                  }
                                                />
                                              </div>
                                            </div>
                                          </Grid>
                                          <Grid item sm={12}>
                                            <label
                                              htmlFor="folder"
                                              name="folder"
                                              style={{ marginLeft: "5px" }}
                                            >
                                              Options for managing ACMs
                                            </label>
                                            <textarea
                                              rows="4"
                                              disabled={
                                                formData[idx]?.completed
                                              }
                                              onChange={(e) =>
                                                handleInputChange(e, idx)
                                              }
                                              value={formData[idx]?.acmOption}
                                              name="acmOption"
                                              className="form-control"
                                              style={{
                                                maxWidth: "620px",
                                                marginLeft: "5px",
                                              }}
                                            />
                                          </Grid>
                                          <Grid item sm={12}>
                                            <label
                                              htmlFor="folder"
                                              name="folder"
                                              style={{ marginLeft: "5px" }}
                                            >
                                              Measures Required
                                            </label>
                                            <textarea
                                              rows="4"
                                              disabled={
                                                formData[idx]?.completed
                                              }
                                              onChange={(e) =>
                                                handleInputChange(e, idx)
                                              }
                                              value={
                                                formData[idx]?.measureAction
                                              }
                                              name="measureAction"
                                              className="form-control"
                                              style={{
                                                maxWidth: "620px",
                                                marginLeft: "5px",
                                                marginBottom: "10px",
                                              }}
                                            />
                                          </Grid>
                                        </Grid>
                                      </Grid>
                                      <Grid item xs={6}>
                                        <Grid container>
                                          <Grid xs={12}>
                                            <Box
                                              display="flex"
                                              alignItems="center"
                                              justifyContent="center"
                                              p={2}
                                              mb={2}
                                              style={{
                                                height: "290px",
                                                marginTop: "-40px",
                                              }}
                                            >
                                              <img
                                                src="/RiskScore.png"
                                                alt="Risk Score Matrix"
                                                style={{
                                                  width: "100%",
                                                  height: "100%",
                                                }}
                                              />
                                            </Box>
                                          </Grid>
                                          <Grid item xs={12} sm={6}>
                                            <label
                                              htmlFor="riskType"
                                              name="riskType"
                                              style={{ marginLeft: "5px" }}
                                            >
                                              Remedial Cost
                                            </label>
                                            <input
                                              type="text"
                                              disabled={
                                                formData[idx]?.completed
                                              }
                                              onChange={(e) =>
                                                handleInputChange(e, idx)
                                              }
                                              value={
                                                formData[idx]?.remedialCost
                                              }
                                              name="remedialCost"
                                              className="form-control"
                                              style={{
                                                maxWidth: "300px",
                                                marginLeft: "5px",
                                                marginBottom: "10px",
                                              }}
                                            />
                                          </Grid>

                                          <Grid item xs={12} sm={6}>
                                            <label
                                              htmlFor="riskType"
                                              name="riskType"
                                              style={{ marginLeft: "5px" }}
                                            >
                                              Next Inspection Date
                                            </label>
                                            <input
                                              type="date"
                                              disabled={
                                                formData[idx]?.completed
                                              }
                                              onChange={(e) =>
                                                handleInputChange(e, idx)
                                              }
                                              value={String(
                                                formData[idx]
                                                  ?.nextInspectionDate
                                              )?.substring(0, 10)}
                                              name="nextInspectionDate"
                                              className="form-control"
                                              style={{
                                                maxWidth: "300px",
                                                marginLeft: "5px",
                                                marginBottom: "10px",
                                              }}
                                            />
                                          </Grid>

                                          <Grid item xs={12} sm={6}>
                                            <label
                                              htmlFor="riskType"
                                              name="riskType"
                                              style={{ marginLeft: "5px" }}
                                            >
                                              Apply Labels
                                            </label>
                                            <select
                                              disabled={
                                                formData[idx]?.completed
                                              }
                                              onChange={(e) =>
                                                handleInputChange(e, idx)
                                              }
                                              value={formData[idx]?.labels}
                                              className="form-control form-select"
                                              name="labels"
                                              required
                                              style={{
                                                maxWidth: "300px",
                                                marginLeft: "5px",
                                              }}
                                            >
                                              <option value="">Select </option>
                                              {["Yes", "No"].map((num) => (
                                                <option value={num}>
                                                  {num}{" "}
                                                </option>
                                              ))}
                                            </select>
                                          </Grid>

                                          <Grid item xs={12} sm={6}>
                                            <label
                                              htmlFor="riskType"
                                              name="riskType"
                                              style={{ marginLeft: "5px" }}
                                            >
                                              Permit to Work Required
                                            </label>
                                            <select
                                              disabled={
                                                formData[idx]?.completed
                                              }
                                              onChange={(e) =>
                                                handleInputChange(e, idx)
                                              }
                                              value={formData[idx]?.ptwRequired}
                                              className="form-control form-select"
                                              name="ptwRequired"
                                              required
                                              style={{
                                                maxWidth: "300px",
                                                marginLeft: "5px",
                                                marginBottom: "20px",
                                              }}
                                            >
                                              <option value="">Select </option>
                                              {["Yes", "No"].map((num) => (
                                                <option value={num}>
                                                  {num}{" "}
                                                </option>
                                              ))}
                                            </select>
                                          </Grid>
                                        </Grid>
                                      </Grid>
                                    </Grid>
                                  </Box>
                                </Grid>
                                <Grid container spacing={1}>
                                  <Grid item lg={12}>
                                    <Grid container>
                                      <Grid xs={12}>
                                        <Box
                                          p={2}
                                          style={{
                                            margin: "10px",
                                            borderRadius: "5px",
                                            display: "flex",
                                            justifyContent: "flex-end",
                                            flexDirection: "row",
                                            alignItems: "center",
                                            gap: "10px",
                                          }}
                                        >
                                          {/* Why are these two buttons not visible, i want one to be blue and other to be blue outline and i'm using mui */}
                                          <button
                                            className="btn btn-secondary"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              const udata = [...formData];
                                              udata[idx].expanded = !udata[idx].expanded;
                                              setFormData(udata);
                                            }}
                                            type="button"
                                          >
                                            Cancel
                                          </button>
                                          <button
                                            className="btn btn-primary"
                                            type="submit"
                                          >
                                            Save
                                          </button>
                                        </Box>
                                      </Grid>
                                    </Grid>
                                  </Grid>
                                </Grid>
                              </Grid>
                            </Box>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Grid>
      </Grid>
    </form>
  );
};

const mapStateToProps = (state) => ({
  siteAssets: state.site.siteAssets,
  sites: state.site.sites,
  users: state.site.users,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
  siteLayout: state.site.siteLayout,
});
export default connect(mapStateToProps, {
  getUsers,
  deleteUser,
  getSites,
  getSiteAssets,
  getSiteLayout,
})(AsbestonSample);
