import React, { useEffect, useState } from "react";
import SidebarNew from "../../../common/Sidebar/SidebarNew";
import Header from "../../../common/Header/Header";
import BreadCrumHeader from "../../../common/BreadCrumHeader/BreadCrumHeader";
import { CSVLink } from "react-csv";
import CreateFiles from "../Documents/CreateFiles";
import { get, put } from "../../../../api";
import Swal from "sweetalert2";
import { connect } from "react-redux";
import { getSiteAssets, selectGlobalSite } from "../../../../store/thunk/site";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import PdfViewer from "../Documents/PdfViewer";
import DutiesIdentifiedLogo from "../../../../images/sreg-1.png";
import DutiesMetLogo from "../../../../images/sreg-2.png";
import DutiesNotMetLogo from "../../../../images/sreg-3.png";
import StatuaryStatus from "../../../common/Alert/Status/StatuaryStatus";
import { useForm } from "react-hook-form";
import { isManagerAdminLogin } from "../../../../utils/isManagerAdminLogin";
import { toast } from "react-toastify";
import FaSave from "@mui/icons-material/Check";
import { showLoader, hideLoader } from "js-loader-fn";
import TagStatutory from "./TagStatutory";
import { getSiteCheckDueDate, getSiteCheckDueDateForStatus } from "../../../../utils/getSiteCheckDueDate";

export const findAssetWithNearestPatNextDate = (assets) => {
  let nearestAsset = null;
  let nearestPatItem = null;
  let nearestMoment = null;
  const now = moment();
  
  assets.forEach((asset) => {
    if (asset.assetPATItems) {
      asset.assetPATItems.forEach((patItem) => {
        const patNextDate = patItem.patNextDate;
        
        if (patNextDate) {
          const patNextMoment = moment(patNextDate);
          
          // Only consider future dates (matching backend logic)
          if (patNextMoment.isAfter(now)) {
            // Check if it's the first date or closer than the previous nearestDate
            if (!nearestMoment || patNextMoment.isBefore(nearestMoment)) {
              nearestMoment = patNextMoment;
              nearestPatItem = patItem;
              nearestAsset = asset;
            }
          }
        }
      });
    }
  });

  return nearestAsset && nearestPatItem
    ? { asset: nearestAsset, patItem: nearestPatItem }
    : null;
};
export const requirementsNotRequiredForFileCheck = [
  "Asbestos Surveys",
  "Fire Emergency Plan",
  "Fire alarm Commissioning Certificate",
  "Fire Alarm Commissioning Certificate (BS5839)",
  "Fire Log Book Hard Copy",
  "Health and Safety Law Poster",
  "Health and Certificate Accident Book",
  "Health and Safety Accident Book",
  "Water Schematic Drawing",
  "Water Legionella Samples"
];
const StatutoryRegister = ({
  loggedInUserData,
  siteSelectedForGlobal,
  getSiteAssets,
  siteAssets,
}) => {
  let chipColor;
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecked, setIsChecked] = useState(true);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState("");
  const [statutory, setStatutory] = useState([]);
  const [siteChecks, setSiteChecks] = useState([]);
  const [patItems, setPatItems] = useState([]);
  const [folder, setFolder] = useState({});
  const [responsibleTexts, setResponsibleTexts] = useState({});
  const [showSaveIcon, setShowSaveIcon] = useState({});
  const [showTagDocumentModal, setShowTagDocumentModal] = useState(false);
  

  const handleTextChange = (e, item) => {
    const { value } = e.target;
    setResponsibleTexts({
      ...responsibleTexts,
      [item.id]: value,
    });
    setShowSaveIcon({
      ...showSaveIcon,
      [item.id]: true, // Show save icon when text changes
    });
  };

  const handleSaveClick = (item) => {
    // Only update setValue and setSearchTerm on save
    setValue(`residence-${item.id}`, responsibleTexts[item.id]);
    setSearchTerm({
      ...item,
      residence: responsibleTexts[item.id],
    });

    // Hide save icon after saving
    setShowSaveIcon({
      ...showSaveIcon,
      [item.id]: false,
    });
  };
  const {
    register,
    formState: { errors },
    setValue,
  } = useForm({});
  const [searchTerm, setSearchTerm] = useState({});
  useEffect(() => {
    updateResidence();
  }, [searchTerm]);
  const updateResidence = async () => {
    try {
      showLoader({ title: "Please wait..." });
      const res = await put(
        "/api/document/statutoryRegister/manage",
        searchTerm
      );
      if (res?.status === 200) {
        hideLoader();
        getStatutory(siteSelectedForGlobal?.siteId);
      } else {
        hideLoader();
        toast.error(
          "Responsible text is not updated due to some technical issue. Please try again."
        );
      }
    } catch (e) {
      hideLoader();
    }
  };
  const navigate = useNavigate();
  let dutiesIdentified = 0;
  let dutiesMet = 0;
  const getDutiesIdentified = (item) => {
    for (let i = 0; i < item.length; i++) {
      if (item[i].required === true) {
        dutiesIdentified++;
      }
    }
    return dutiesIdentified;
  };

  const getDutiesMet = (item) => {
    for (let i = 0; i < item.length; i++) {
      if (item[i].files !== null && item[i].status === "Passed") {
        dutiesMet++;
      }
    }
    return dutiesMet;
  };
  const getStatutory = async (siteId, currentPatItems = patItems) => {
    setIsLoading(true);
    let getStatutoryDocuments = await get(
      `/api/document/${siteId}/statutoryRegister`
    );
    getStatutoryDocuments = getStatutoryDocuments.sort(
      (a, b) => parseInt(a.sortOrder) - parseInt(b.sortOrder)
    );
    
    // Recalculate status for PAT Testing based on current PAT items
    const updatedStatutoryWithRecalculatedStatus = getStatutoryDocuments.map(item => {
      if (item?.subType === "PAT / Microwave Testing" && item?.required) {
        const recalculatedStatus = recalculatePatStatus(item, currentPatItems);
        return {
          ...item,
          status: recalculatedStatus
        };
      }
      return item;
    });

    if (isManagerAdminLogin(loggedInUserData)) {
      setStatutory(updatedStatutoryWithRecalculatedStatus);
    } else {
      const updatedStatutoryRegister = updatedStatutoryWithRecalculatedStatus?.filter(itm => itm?.required === true);
      setStatutory(updatedStatutoryRegister);
    }
    
    // Set initial values for residence fields using setValue
    const newResponsibleTexts = {};

    getStatutoryDocuments.forEach((item) => {
      newResponsibleTexts[item.id] = item.residence || "";
      setValue(`residence-${item.id}`, item.residence || ""); // Prepopulate with existing residence value if available
    });
    setResponsibleTexts(newResponsibleTexts);
    chipColor = statutory.filter((item) => {
      return item.status === "Passed";
    });
    setIsLoading(false);
  };

  const recalculatePatStatus = (item, patItems) => {
    if (item?.subType === "PAT / Microwave Testing" && item?.required) {
      const assetWithNearestPatNextDate = findAssetWithNearestPatNextDate(patItems);
      if (assetWithNearestPatNextDate?.patItem) {
        const patNextDate = assetWithNearestPatNextDate.patItem.patNextDate;
        if (patNextDate) {
          const isPatValid = moment(patNextDate).isAfter(new Date());
          return isPatValid ? "Passed" : "Fail";
        } else {
          return "Fail"; // No expiry date = Fail
        }
      } else {
        return "Fail"; // No PAT items = Fail
      }
    }
    // Return existing status for non-PAT items
    return item.status;
  };

  const getChipStatus = (item) => {
    return item.status === "Passed"
      ? "Passed"
      : item.status === "Open"
      ? "Open"
      : "";
  };
  const handleCheckboxField = async (e, item, idx) => {
    const isChecked = e.target.checked; // Directly using checked value
    setIsChecked(isChecked); // Update local state, if used for other purposes
    let status = "Fail"; // Default status

    // Checking conditions based on item type and subType
    if (isChecked && String(item?.type).toLowerCase() === "pdf") {
      if (item?.files?.length > 0) {
        const isExpiryDateValid = item.files.every((file) =>
          moment(file.expiryDate).isAfter(new Date())
        );
        status = isExpiryDateValid ? "Passed" : "Fail";
      }
    } else if (String(item?.type).toLowerCase() === "link" && isChecked) {
      try {
        // Asbestos Check
        if (item?.subType === "Asbestos Management Plan") {
          const isAsbestosRecordAvailable = siteChecks?.some(
            (itm) => itm?.subType === "Asbestos"
          );
          status = isAsbestosRecordAvailable ? "Passed" : "Fail";
        }

        // PAT Check - Use PAT items instead of site checks
        else if (item?.subType === "PAT / Microwave Testing") {
          const assetWithNearestPatNextDate = findAssetWithNearestPatNextDate(patItems);
          if (assetWithNearestPatNextDate?.patItem) {
            const patNextDate = assetWithNearestPatNextDate.patItem.patNextDate;
            if (patNextDate) {
              const isPatValid = moment(patNextDate).isAfter(new Date());
              status = isPatValid ? "Passed" : "Fail";
            } else {
              status = "Fail"; // No expiry date = Fail
            }
          } else {
            status = "Fail"; // No PAT items = Fail
          }
        //   const isPAtExpired = siteChecks?.some(
        //     (itm) =>
        //       itm?.type === "Inspection" &&
        //       itm?.subType === "Electrical" &&
        //       itm?.category === "WC Alarm Testing" &&
        //       moment(getSiteCheckDueDateForStatus(itm)).isAfter(new Date())
        //   );
        //   status = isPAtExpired ? "Passed" : "Fail";
        }
 

        // Emergency Check
        else if (item?.subType === "Emergency light and Fire Alarm") {
          const isEmergencyAvailable = siteChecks?.some(
            (itm) =>
              itm?.type === "Audit" && moment(getSiteCheckDueDateForStatus(itm)).isAfter(new Date())
          );
          status = isEmergencyAvailable ? "Passed" : "Fail";
        }

        // Water Risk Assessment Check
        else if (item?.requirement === "Water Risk Assessment" && item?.subType === "Water") {
          const isWaterAvailable = siteChecks?.some(
            (itm) =>
              itm?.subType === "Water Risk Assessment" && itm?.category === "Water" &&
              moment(getSiteCheckDueDateForStatus(itm)).isAfter(new Date())
          );
          status = isWaterAvailable ? "Passed" : "Fail";
        }
        // Water Risk Assessment Check
        else if (item?.subType === "Water Risk Assessment" && item?.requirement === "Water Risk Assessment") {
          const isWaterAvailable = siteChecks?.some(
            (itm) =>
              itm?.category === "Water Risk Assessment" &&
              itm?.subType === "Water" &&
              moment(getSiteCheckDueDateForStatus(itm)).isAfter(new Date())
          );
          status = isWaterAvailable ? "Passed" : "Fail";
        }
        // Water Risk Assessment Check
        else if (item?.requirement === "Fire Alarm Weekly Call Point Test" && item?.subType === "Fire Alarm Weekly In House Testing") {
          const isFireAlarm = siteChecks?.some(
            (itm) =>
              itm?.category === "Fire Alarm - Weekly Call Point testing to meet BS5839" &&
              itm?.subType === "Fire Alarm to meet BS5839" &&
              moment(getSiteCheckDueDateForStatus(itm)).isAfter(new Date())
          );
          status = isFireAlarm ? "Passed" : "Fail";
        }
        // Water Risk Assessment Check
        else if (item?.requirement === "Water Temperature Monitoring" && item?.subType === "Water Systems Service & Test Records") {
          const isWaterTempMonitor = siteChecks?.some(
            (itm) =>
              itm?.category === "Water Temperature Monitoring" &&
              itm?.subType === "Water" &&
              moment(getSiteCheckDueDateForStatus(itm)).isAfter(new Date())
          );
          status = isWaterTempMonitor ? "Passed" : "Fail";
        }
        // Water Risk Assessment Check
        else if (item?.requirement === "Shower Head Cleaning" && item?.subType === " Water Systems Service & Test Records") {
          const isShowerClaeaning = siteChecks?.some(
            (itm) =>
              itm?.category === "Periodic Shower Head Cleaning" &&
              itm?.subType === "Legionella" &&
              moment(getSiteCheckDueDateForStatus(itm)).isAfter(new Date())
          );
          status = isShowerClaeaning ? "Passed" : "Fail";
        }
      } catch (error) {
        console.error("Error fetching site data:", error);
      }
    }

    // Update payload and possibly update state/props
    const payload = {
      ...item,
      status: status,
      required: isChecked,
    };
    if (!isChecked) {
      payload.status = "";
    }

    if (isChecked && requirementsNotRequiredForFileCheck.includes(item?.requirement)) {
      payload.status = "Passed";
    }

    const res = await put("/api/document/statutoryRegister/manage", payload);
    if (res?.status === 200) {
      getStatutory(siteSelectedForGlobal?.siteId, patItems);
    }
  };
  const getPatItems = async () => {
    let url = `/api/site/${siteSelectedForGlobal?.siteId}/assets?patItem=true`;
    const { assets } = await get(url);
    setPatItems(assets);
    return assets;
  };

  useEffect(() => {
    if (siteSelectedForGlobal?.siteId) {
      getStatutory(siteSelectedForGlobal?.siteId);
      getSiteAssets(siteSelectedForGlobal?.siteId);
      getSiteChecks();
      // Load PAT items and recalculate status after they're loaded
      getPatItems().then((patItemsData) => {
        // Recalculate status after PAT items load
        getStatutory(siteSelectedForGlobal?.siteId, patItemsData);
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Please select site from site search and try again.",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteSelectedForGlobal?.siteId]);
  const getSiteChecks = async () => {
    const siteChecksData = await get(
      `/api/site-check/site/${siteSelectedForGlobal?.siteId}`
    );
    setSiteChecks(siteChecksData);
  };

  const getViewEvidenceExpiryDate = (row) => {
    // Group siteChecks by types to avoid multiple filtering
    const surveys = siteChecks?.filter((itm) => itm?.type === "Survey");
    const inspections = siteChecks?.filter((itm) => itm?.type === "Inspection");
    const assessments = siteChecks?.filter((itm) => itm?.type === "Assessment");
    const assetWithNearestPatNextDate =
      findAssetWithNearestPatNextDate(patItems);
    // Pre-filter categories and subTypes for easier lookups
    const filteredSiteChecks = {
      asbestosManagementPlan: surveys?.find(
        (itm) => itm?.category === "Asbestos Management Plan"
      ),
      patItems: assetWithNearestPatNextDate?.patItem,
      fireAlarmsWeekly: inspections?.find(
        (itm) =>
          itm?.subType === "Fire Alarm to meet BS5839" &&
          itm?.category ===
            "Fire Alarm - Weekly Call Point testing to meet BS5839"
      ),
      emergencyLightWeekly: inspections?.find(
        (itm) =>
          itm?.subType === "Emergency Lighting to meet BS5266" &&
          itm?.category === "Emergency Lighting - weekly testing to meet BS5266"
      ),
      waterSafetyRiskAssessment: inspections?.find(
        (itm) =>
          itm?.subType === "Legionella" &&
          (itm?.category === "Domestic RA" || "Water Safety Annual Inspection")
      ),
      waterOutletTemperature: inspections?.find(
        (itm) =>
          itm?.subType === "Legionella" &&
          (itm?.category === "Outlet Temperature" ||
            itm?.category === "Water Temperature Monitoring")
      ),
      waterStorage: inspections?.find(
        (itm) =>
          itm?.subType === "Legionella" &&
          itm?.category === "Water - Storage System Chlorination"
      ),
      showerHeadCleaning: inspections?.find(
        (itm) =>
          itm?.subType === "Legionella" &&
          itm?.category === "Periodic Shower Head Cleaning"
      ),
      fireRiskAssessment: assessments?.find(
        (itm) => itm?.subType === "Fire Risk Assessment"
      ),
      waterTemprature: surveys?.find(
        (itm) =>
          itm?.subType === "Water" &&
          itm?.category === "Water Temperature Monitoring"
      ),
      waterRiskAssessment: surveys?.find(
        (itm) =>
          itm?.subType === "Water" && itm?.category === "Water Risk Assessment"
      ),
    };
    // Define a mapping of row subTypes to filteredSiteChecks
    const checkMappings = {
      "Asbestos Management Plan": filteredSiteChecks.asbestosManagementPlan,
      "PAT / Microwave Testing": filteredSiteChecks.patItems,
      "Fire Alarm Weekly In House Testing": filteredSiteChecks.fireAlarmsWeekly,
      "Emergency Lighting Weekly In House Testing":
        filteredSiteChecks.emergencyLightWeekly,
      "Water Systems Service & Test Records":
        filteredSiteChecks.waterOutletTemperature,
      " Water Systems Service & Test Records":
        filteredSiteChecks.showerHeadCleaning,
      "Shower Head Cleaning": filteredSiteChecks.waterStorage,
      "Fire Evacuation Drill": filteredSiteChecks.fireRiskAssessment,
    };

    const checkMappingsReq = {
      "PAT / Microwave Testing": filteredSiteChecks.patItems,
      "Shower Head Cleaning": filteredSiteChecks.waterStorage,
      "Water Temperature Monitoring": filteredSiteChecks.waterTemprature,
      "Water Risk Assessment": filteredSiteChecks.waterRiskAssessment,
    };

    const matchedCheck =
      checkMappings[row?.subType] || checkMappings[row?.requirement];
    const matchedCheckReq =
      checkMappingsReq[row?.requirement] || checkMappings[row?.subType];

    // If a matching check exists, return the expiry date row
    // console.log("row", row);
    if (matchedCheck || matchedCheckReq) {
      if (row?.requirement == "Water Risk Assessment") {
        return getStartAndExpiryDateRow(
          matchedCheckReq.startDate,
          matchedCheckReq.dueDate,
          matchedCheckReq,
        );
      } else if (row?.requirement == "Water Temperature Monitoring") {
        return getStartAndExpiryDateRow(
          matchedCheckReq.startDate,
          matchedCheckReq.dueDate,
          matchedCheckReq,
        );
      } else if (row?.requirement == "Shower Head Cleaning") {
        return getStartAndExpiryDateRow(
          matchedCheckReq.startDate,
          matchedCheckReq.dueDate,
          matchedCheckReq,
        );
      } else if (row?.subType == "PAT / Microwave Testing") {
        // Use dates from backend if available, otherwise fallback to PAT items
        const issueDate = row.patIssueDate || matchedCheckReq?.patDate;
        const expiryDate = row.patExpiryDate || matchedCheckReq?.patNextDate;
        return getStartAndExpiryDateRow(
          issueDate,
          expiryDate,
          matchedCheckReq,
          true,
        );
      } else {
        return getStartAndExpiryDateRow(
          matchedCheck.startDate,
          matchedCheck.dueDate,
          matchedCheckReq,
        );
      }
    }

    return null;
  };

  // Helper function to create table row with start and expiry dates
  const getStartAndExpiryDateRow = (startDate, dueDate, action, isPatItem = false) => {
    return (
      <tr>
        {[...Array(3)].map((_, idx) => (
          <th
            key={`empty-${idx}`}
            style={{ backgroundColor: "#DEE3E9", color: "#5A6371" }}
          />
        ))}
        <th style={{ backgroundColor: "#DEE3E9", color: "#5A6371" }}>
          {startDate ? moment(startDate).format("DD-MM-YYYY") : "--"}
        </th>
        <th style={{ backgroundColor: "#DEE3E9", color: "#5A6371" }}>
          {isPatItem
            ? (dueDate ? moment(dueDate).format("DD-MM-YYYY") : "--")
            : getSiteCheckDueDate(action)
          }
        </th>
        {[...Array(2)].map((_, idx) => (
          <th
            key={`empty2-${idx}`}
            style={{ backgroundColor: "#DEE3E9", color: "#5A6371" }}
          />
        ))}
      </tr>
    );
  };

  const untagAsset = async (selectedRow, statutory) => {
    const fileIds = [selectedRow]?.map((item) => item.id);
    const url = `/api/document/untag-file`;
    const data = {
      fileIds: fileIds,
      statutoryCategoryId: statutory?.id,
    };
    const res = await put(url, data);
    if (res?.status === 200) {
      toast.success("Files un tagged successfully.");
      getStatutory(siteSelectedForGlobal?.siteId);
    } else {
      toast.error("Something went wrong while un tagging files.");
    }
  };

  return (
    <>
    {showTagDocumentModal && (
        <TagStatutory
          showModal={showTagDocumentModal}
          setShowModal={setShowTagDocumentModal}
          statutoryCategory={folder}
          siteId={siteSelectedForGlobal?.siteId}
          refresh={() => {
            getStatutory(siteSelectedForGlobal?.siteId);
          }}
        />
      )}
      <SidebarNew />

      <div className="content">
        <Header />
        <div className="container-fluid">
          <BreadCrumHeader
            header={"Statutory Register"}
            page={"Statutory Register"}
          />
          <div class="card card-body">
            <div className="pt-2 bd-highlight ">
              <div className="row" style={{ height: "auto" }}>
                <div className="col border-end">
                  <div className="row">
                    <div className="col-md-4 border-right">
                      <img src={DutiesIdentifiedLogo} height={"40px"} />
                    </div>
                    <div className="col-md-8">
                      <span>Duties Identified</span>
                      <p class="fw-bold fs-3">
                        {getDutiesIdentified(statutory)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col border-end">
                  <div className="row">
                    <div className="col-md-4">
                      <img src={DutiesMetLogo} height={"40px"} />
                    </div>
                    <div className="col-md-8">
                      <span>Duties Met</span>
                      <p class="fw-bold fs-3">{getDutiesMet(statutory)}</p>
                    </div>
                  </div>
                </div>
                <div className="col border-end">
                  <div className="row">
                    <div className="col-md-4">
                      <img src={DutiesNotMetLogo} height={"40px"} />
                    </div>
                    <div className="col-md-8">
                      <span>Duties Not Met</span>
                      <p class="fw-bold fs-3">{dutiesIdentified - dutiesMet}</p>
                    </div>
                  </div>
                </div>
                <div className="col text-center">
                  <CSVLink
                    filename={"statutory-documents.csv"}
                    className="btn btn-light bg-white text-primary"
                    data={statutory?.map((item) => {
                      // Use destructuring to exclude the 'files' field while copying the rest
                      const { files, ...rest } = item;
                      return rest;
                    })}
                  >
                    <i className="fas fa-download"></i>&nbsp;Export
                  </CSVLink>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-12 pt-4 table-responsive">
            <table className="table">
              <thead className="table-dark">
                <tr>
                  <th scope="col">Id</th>
                  <th scope="col">Requirement</th>
                  <th scope="col">Required</th>
                  <th scope="col">Responsible</th>
                  <th scope="col">Document</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              {showPdfModal && (
                <PdfViewer
                  showPdfModal={showPdfModal}
                  setShowPdfModal={setShowPdfModal}
                  selectedPdf={selectedPdf}
                />
              )}
              <tbody>
                {!isLoading && statutory.length === 0 && (
                  <tr>
                    <td colSpan={4} align="center">
                      No result found!!
                    </td>
                  </tr>
                )}
                {statutory?.map((item, index) => {
                  return (
                    <tr>
                      <th scope="col">
                        <span
                          className="text-primary cursor"
                          onClick={() => {}}
                        >
                          {item.sortOrder}
                        </span>
                      </th>
                      <th scope="col">
                        {item.subType ? `(${item.subType}) ` : ""}
                        {item.requirement}
                        <div
                          style={{
                            display:
                              String(item?.type).toLowerCase() === "link"
                                ? ""
                                : "none",
                          }}
                        >
                          {item.subType === "PAT / Microwave Testing" ? (
                            <a
                              href="/#/assets"
                              className="btn btn-primary mt-3 text-bg-primary"
                            >
                              View Evidence
                            </a>
                          ) : (
                            <a
                              href="/#/site-checks"
                              className="btn btn-primary mt-3 text-bg-primary"
                            >
                              View Evidence
                            </a>
                          )}
                        </div>
                      </th>
                      <th scope="col">
                        <input
                          type="checkbox"
                          id="chkbox"
                          checked={item.required}
                          disabled={!isManagerAdminLogin(loggedInUserData)}
                          onChange={(e) => {
                            handleCheckboxField(e, item, index);
                          }}
                        />
                      </th>
                      <th scope="col">
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <input
                            type="text"
autoComplete="off"
          readOnly
          onFocus={(e) => e.target.removeAttribute("readonly")}
                            id="chkbox"
                            style={{ width: "120px" }}
                            className="form-control"
                            value={responsibleTexts[item.id] || ""}
                            {...register(`residence-${item.id}`)}
                            disabled={!isManagerAdminLogin(loggedInUserData)}
                            onChange={(e) => handleTextChange(e, item)}
                          />
                          {showSaveIcon[item.id] && (
                            <FaSave
                              style={{
                                color: "green",
                                cursor: "pointer",
                                marginLeft: "5px",
                              }}
                              onClick={() => handleSaveClick(item)}
                            />
                          )}
                        </div>
                      </th>
                      <th scope="col">
                        <table
                          className="table"
                          style={{ border: "1px solid #5A6371" }}
                        >
                          <thead className="table-active">
                            <tr>
                              <th
                                scope="col"
                                style={{
                                  backgroundColor: "#7D8793",
                                  color: "#FFFFFF",
                                }}
                              >
                                File
                              </th>
                              <th
                                scope="col"
                                style={{
                                  backgroundColor: "#7D8793",
                                  color: "#FFFFFF",
                                }}
                              >
                                Folder
                              </th>
                              <th
                                scope="col"
                                style={{
                                  backgroundColor: "#7D8793",
                                  color: "#FFFFFF",
                                }}
                              >
                                Version
                              </th>
                              <th
                                scope="col"
                                style={{
                                  backgroundColor: "#7D8793",
                                  color: "#FFFFFF",
                                }}
                              >
                                Date
                              </th>
                              <th
                                scope="col"
                                style={{
                                  backgroundColor: "#7D8793",
                                  color: "#FFFFFF",
                                }}
                              >
                                Expiry
                              </th>
                              <th
                                scope="col"
                                style={{
                                  backgroundColor: "#7D8793",
                                  color: "#FFFFFF",
                                }}
                              >
                                Author
                              </th>
                              <th
                                scope="col"
                                style={{
                                  backgroundColor: "#7D8793",
                                  color: "#FFFFFF",
                                }}
                              >
                                Ref No.
                              </th>
                              {String(item?.type).toLowerCase() === "pdf" && (
                                <th
                                  scope="col"
                                  style={{
                                    backgroundColor: "#7D8793",
                                    color: "#FFFFFF",
                                  }}
                                >
                                  Action
                                </th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {String(item?.type).toLowerCase() === "link"
                              ? getViewEvidenceExpiryDate(item)
                              : null}
                            {item?.files?.map((itm, index) => {
                              return (
                                <tr>
                                  <th
                                    style={{
                                      backgroundColor: "#DEE3E9",
                                      color: "#5A6371",
                                    }}
                                  >
                                    <button
                                      style={{
                                        border: "none",
                                        cursor: "pointer",
                                        color: "blue",
                                      }}
                                      onClick={(e) => {
                                        e?.preventDefault();
                                        setShowPdfModal(true);
                                        setSelectedPdf(itm?.fileBlobUrl);
                                      }}
                                    >
                                      {itm.name === "undefined"
                                        ? "--"
                                        : itm.name}
                                    </button>
                                  </th>
                                  {/* <th scope="col">{itm.name}</th> */}
                                  <th
                                    scope="col"
                                    style={{
                                      backgroundColor: "#DEE3E9",
                                      color: "#5A6371",
                                      border: "1px solid #5A6371",
                                    }}
                                  >
                                    {itm.folderName}
                                  </th>
                                  <th
                                    scope="col"
                                    style={{
                                      backgroundColor: "#DEE3E9",
                                      color: "#5A6371",
                                      border: "1px solid #5A6371",
                                    }}
                                  >
                                    {itm.fileVersion}
                                  </th>
                                  <th
                                    scope="col"
                                    style={{
                                      backgroundColor: "#DEE3E9",
                                      color: "#5A6371",
                                      border: "1px solid #5A6371",
                                    }}
                                  >
                                    {itm.issueDate
                                      ? moment(itm.issueDate).format(
                                          "DD-MM-YYYY"
                                        )
                                      : "-"}
                                  </th>
                                  <th
                                    scope="col"
                                    style={{
                                      backgroundColor: "#DEE3E9",
                                      color: "#5A6371",
                                      border: "1px solid #5A6371",
                                    }}
                                  >
                                    {itm.expiryDate
                                      ? moment(itm.expiryDate).format(
                                          "DD-MM-YYYY"
                                        )
                                      : "-"}
                                  </th>
                                  <th
                                    scope="col"
                                    style={{
                                      backgroundColor: "#DEE3E9",
                                      color: "#5A6371",
                                      border: "1px solid #5A6371",
                                    }}
                                  >
                                    {itm.uploaderUserName}
                                  </th>
                                  <th
                                    scope="col"
                                    style={{
                                      backgroundColor: "#DEE3E9",
                                      color: "#5A6371",
                                      border: "1px solid #5A6371",
                                    }}
                                  >
                                    {itm.uploaderUserId}
                                  </th>
                                  {String(item?.type).toLowerCase() ===
                                    "pdf" && (
                                    <th
                                      scope="col"
                                      style={{
                                        backgroundColor: "#DEE3E9",
                                        color: "#5A6371",
                                        border: "1px solid #5A6371",
                                      }}
                                    >
                                      <button
                                        className="btn btn-sm btn-danger"
                                        onClick={() => {
                                          untagAsset(itm, item);
                                        }}
                                        style={{fontSize: '10px', display:
                                          (!isManagerAdminLogin(
                                            loggedInUserData
                                          ))
                                            ? "none"
                                            : "",}}
                                      >
                                        Untag Document
                                      </button>
                                    </th>
                                  )}
                                </tr>
                              );
                            })}

                            <tr>
                              <td colspan={2} style={{
                                  backgroundColor: "#5A6371",
                                  color: "#FFFFFF",
                                }}>
                              <label
                                    id="upload-file"
                                    class="text-decoration-underline"
                                    onClick={() => {
                                      setFolder(item);
                                      setShowTagDocumentModal(true);
                                    }}
                                    style={{
                                      display:
                                        (String(item?.type).toLowerCase() ===
                                        "link" || !isManagerAdminLogin(
                                          loggedInUserData
                                        ))
                                          ? "none"
                                          : "",
                                      color: "384bd3",
                                      cursor: "pointer",
                                    }}
                                  >
                                    Tag Documents
                                  </label>
                              </td>
                              <td
                                colspan={
                                  String(item?.type).toLowerCase() === "pdf"
                                    ? 6
                                    : 5
                                }
                                style={{
                                  backgroundColor: "#5A6371",
                                  color: "#FFFFFF",
                                }}
                                align="center"
                              >
                                <div
                                  className="upload-file"
                                  style={{
                                    display: isManagerAdminLogin(
                                      loggedInUserData
                                    )
                                      ? ""
                                      : "none",
                                  }}
                                >
                                  <label
                                    id="upload-file"
                                    class="text-decoration-underline"
                                    onClick={() => {
                                      setFolder(item);
                                      setShowModal(true);
                                    }}
                                    style={{
                                      display:
                                        String(item?.type).toLowerCase() ===
                                        "link"
                                          ? "none"
                                          : "",
                                      color: "384bd3",
                                      cursor: "pointer",
                                    }}
                                  >
                                    Select or Upload New File
                                  </label>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </th>
                      <th scope="col">
                        {item?.status ? (
                          <StatuaryStatus status={item?.status} />
                        ) : (
                          "--"
                        )}
                      </th>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {showModal && (
            <CreateFiles
              showModal={showModal}
              setShowModal={setShowModal}
              isStatutory={true}
              folderData={folder}
              setFolder={setFolder}
              uploaderUserId={loggedInUserData?.id}
              reviewerUserId={loggedInUserData?.id}
              refresh={() => {
                getStatutory(siteSelectedForGlobal?.siteId);
              }}
            />
          )}
        </div>
      </div>
    </>
  );
};

const mapStateToProps = (state) => ({
  loggedInUserData: state.site.loggedInUserData,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
  siteAssets: state.site.siteAssets,
});
export default connect(mapStateToProps, {
  getSiteAssets,
})(StatutoryRegister);
