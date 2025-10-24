import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import { CSVLink } from "react-csv";
import moment from "moment";
import Header from "../../../common/Header/Header";
import BreadCrumHeader from "../../../common/BreadCrumHeader/BreadCrumHeader";
import Pagination from "../../../common/Pagination/Pagination";
import SidebarNew from "../../../common/Sidebar/SidebarNew";
import Tooltip from "@mui/material/Tooltip";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { get, post, del, put } from "../../../../api";
import Cost from "./Cost";
import Reading from "./Reading";
import * as XLSX from "xlsx";

import {
  DialogContent,
  DialogTitle,
  Link,
  Dialog,
  CircularProgress,
  Typography,
  Button,
} from "@mui/material";
import { getSites } from "../../../../store/thunk/site";
import { isManagerAdminLogin } from "../../../../utils/isManagerAdminLogin";
import { formatToCurrency } from "../../../../utils/formatToCurrency";

const EnergyCost = ({ loggedInUserData, siteSelectedForGlobal }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [openCost, setOpenCost] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [openBulk, setopenBulk] = useState(false);
  const [bulkUploadCost, setbulkUploadCost] = useState([]);
  const [bulkUploadReading, setbulkUploadReading] = useState([]);
  const [actionSurvey, setActionSurvey] = useState();
  const [openReading, setOpenReading] = useState(false);
  const [typeoptions, settypeoptions] = useState([]);
  // Add state for failed records and download functionality
  const [failedReadingRecords, setFailedReadingRecords] = useState([]);
  const [showFailedDownload, setShowFailedDownload] = useState(false);
  const [failedCostRecords, setFailedCostRecords] = useState([]);
  const [showFailedCostDownload, setShowFailedCostDownload] = useState(false);

  const [filteredEnergyCost, setFilteredEnergyCost] = useState([]);
  const [energyCost, setEnergyCost] = useState([]);
  const navigate = useNavigate();
  const goTo = (link) => {
    navigate(link);
  };

  useEffect(() => {
    gettypeoptions();
  }, []);

  const customColumnNamesCost = ["reference", "fromDate", "toDate", "cost"];
  const customColumnNamesReading = [
    "reference",
    "readingDate",
    "readingValue",
    "readingUnit",
  ];

  // Add CSV headers for failed records download
  const failedReadingHeaders = [
    { label: "Reference", key: "reference" },
    { label: "Reading Date", key: "readingDate" },
    { label: "Reading Value", key: "readingValue" },
    { label: "Reading Unit", key: "readingUnit" },
    { label: "Error Reason", key: "errorReason" }
  ];

  const failedCostHeaders = [
    { label: "Reference", key: "reference" },
    { label: "From Date", key: "fromDate" },
    { label: "To Date", key: "toDate" },
    { label: "Cost", key: "cost" },
    { label: "Error Reason", key: "errorReason" }
  ];

  const [itemsPerPage] = useState(7);
  const [currentPage, setCurrentPage] = useState(1);
  const [bulkCategory, setBulkCategory] = useState();
  const indexOfLastPreAction = currentPage * itemsPerPage;
  const indexOfFirstPreAction = indexOfLastPreAction - itemsPerPage;
  const currentEnergyCost = filteredEnergyCost?.slice(
    indexOfFirstPreAction,
    indexOfLastPreAction
  );
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const gettypeoptions = async () => {
    const lovtypes = await get("/api/lov/ENERGY_COST_BUDGET_CATEGORY");
    settypeoptions(lovtypes.map((l) => l.lovValue));
  };

  useEffect(() => { }, []);
  const [formData, setFormData] = useState({
    searchField: "",
  });
  const [formData2, setFormData2] = useState({
    searchField: "",
    type: "",
    subType: "",
    category: "",
    status: "",
  });
  const isDateOlderThanToday = (dateString) => {
    const dateToCheck = moment(dateString, "YYYY-MM-DD");
    const today = moment().startOf("day");
    return dateToCheck.isBefore(today);
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleInputChange2 = (e) => {
    const { name, value } = e.target;
    setFormData2({
      ...formData2,
      [name]: value,
    });
  };

  useEffect(() => {
    searchEnergyCost();
  }, [formData2]);

  const deleteEnergyCost = async (id) => {
    await del("/api/energy/cost/" + id);
    getEnergyCost();
    setOpenCost();
  };

  const deleteEnergyReading = async (id) => {
    await del("/api/energy/reading/" + id);
    setOpenReading();
    getEnergyCost();
  };

  const searchEnergyCost = () => {
    let filteredEnergyCost2 = energyCost;
    if (formData2?.budgetCategory?.length > 0) {
      filteredEnergyCost2 = filteredEnergyCost2.filter(
        (sc) => sc.budgetCategory === formData2.budgetCategory
      );
    }

    if (formData2?.searchField?.length > 0 && filteredEnergyCost2?.length > 0) {
      filteredEnergyCost2 = filteredEnergyCost2.filter(
        (sc) =>
          sc?.reference
            ?.toLowerCase()
            .includes(String(formData2?.searchField).toLowerCase()) ||
          sc?.budgetCategory
            ?.toLowerCase()
            .includes(String(formData2?.searchField).toLowerCase())
      );
    }
    setFilteredEnergyCost(filteredEnergyCost2);
  };

  const deleteEnergyCostCall = (action) => {
    Swal.fire({
      title: `Do you want to delete ${action?.reference} ?`,
      showDenyButton: false,
      showCancelButton: true,
      confirmButtonText: "Delete",
    }).then(async (result) => {
      if (result.isConfirmed) {
        setIsLoading(true);
        await del("/api/energy/survey/" + action.energyId);
        getEnergyCost();
      } else if (result.isDenied) {
        toast.info(`delete action has been denied.`);
      }
    });
  };

  useEffect(() => {
    getEnergyCost();
  }, [siteSelectedForGlobal]);

    const handleFileUploadReading = (event) => {
        setbulkUploadReading([]);
        setFailedReadingRecords([]);
        setShowFailedDownload(false);

        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onload = (e) => {
            const binaryStr = e.target.result;
            const workbook = XLSX.read(binaryStr, { type: "binary" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Convert the entire sheet to JSON to see the structure - use raw to get exact values
            const allData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });

            console.log('=== RAW EXCEL DATA ===');
            console.log('All data from Excel:', allData);
            console.log('Number of rows:', allData.length);

            // Log each row with its index
            allData.forEach((row, index) => {
                console.log(`Row ${index}:`, row);
            });

            const mappedData = [];
            const failedRecords = [];

            // Process each row starting from row 1 (index 1) where the actual data begins
            allData.forEach((row, index) => {
                // Skip header row (row 0) and empty rows
                if (index < 1 || !row || row.length === 0) {
                    console.log(`Skipping row ${index} - header or empty`);
                    return;
                }

                console.log(`Processing row ${index}:`, row);

                // Check if this is a valid data row - should have ELEC-1001 or similar pattern
                const hasValidReference = row[0] && row[0].toString().trim() !== '';

                if (!hasValidReference) {
                    console.log(`Skipping row ${index} - no valid reference:`, row[0]);
                    return;
                }

                let rowData = {
                    submittedUserId: loggedInUserData?.id,
                };

                let isValid = true;
                let errorReasons = [];

                try {
                    // Process reference (column A)
                    if (row[0] && row[0].toString().trim() !== '') {
                        const dupIdx = energyCost.findIndex(
                            (e) => e.reference === row[0]
                        );
                        if (dupIdx >= 0) {
                            rowData.energyId = energyCost[dupIdx]?.energyId;
                            rowData.budgetCategory = energyCost[dupIdx]?.budgetCategory;
                        }
                        rowData.reference = row[0].toString().trim();
                        console.log(`Row ${index} - Reference:`, rowData.reference);
                    } else {
                        isValid = false;
                        errorReasons.push("Missing meter reference");
                    }

                    // Process reading date (column B)
                    if (row[1] && row[1].toString().trim() !== '') {
                        try {
                            rowData.readingDate = convertToDate(row[1]);
                            console.log(`Row ${index} - Reading Date:`, rowData.readingDate, 'from:', row[1]);
                        } catch (dateError) {
                            isValid = false;
                            errorReasons.push(`Invalid date format: ${row[1]}`);
                        }
                    } else {
                        isValid = false;
                        errorReasons.push("Missing reading date");
                    }

                    // Process reading value (column C)
                    if (row[2] !== undefined && row[2] !== null && row[2] !== "" && row[2].toString().trim() !== '') {
                        // Remove any trailing tabs or special characters
                        const cleanValue = row[2].toString().replace(/\t/g, '').trim();
                        const readingValue = parseFloat(cleanValue);
                        if (isNaN(readingValue)) {
                            isValid = false;
                            errorReasons.push("Invalid reading value - must be numeric");
                        } else {
                            rowData.readingValue = readingValue;
                            console.log(`Row ${index} - Reading Value:`, rowData.readingValue);
                        }
                    } else {
                        isValid = false;
                        errorReasons.push("Missing reading value");
                    }

                    // Process reading unit (column D) - IGNORE columns E, F, G, H
                    console.log(`Row ${index} - Column D raw value:`, row[3], 'type:', typeof row[3]);

                    // Check if column D exists and has a valid value (ignore columns E-H)
                    if (row[3] !== undefined && row[3] !== null && row[3] !== "") {
                        const unitValue = row[3].toString().trim();
                        console.log(`Row ${index} - Unit value after trim:`, `"${unitValue}"`, 'length:', unitValue.length);

                        if (unitValue && unitValue.length > 0) {
                            rowData.readingUnit = unitValue;
                            console.log(`Row ${index} - Reading Unit:`, rowData.readingUnit);
                        } else {
                            isValid = false;
                            errorReasons.push("Missing reading unit");
                            console.log(`Row ${index} - Unit validation failed: empty after trim`);
                        }
                    } else {
                        // Column D is undefined, null, or empty string
                        isValid = false;
                        errorReasons.push("Missing reading unit");
                        console.log(`Row ${index} - Unit validation failed: undefined, null or empty`);
                    }

                    // Log column H for debugging but ignore it
                    if (row[7]) {
                        console.log(`Row ${index} - Column H (ignored):`, row[7]);
                    }

                } catch (error) {
                    isValid = false;
                    errorReasons.push(`Processing error: ${error.message}`);
                    console.log(`Row ${index} - Processing error:`, error);
                }

                if (isValid) {
                    mappedData.push(rowData);
                    console.log(`✅ Row ${index} - VALID:`, rowData);
                } else {
                    failedRecords.push({
                        reference: row[0] || "",
                        readingDate: row[1] || "",
                        readingValue: row[2] || "",
                        readingUnit: row[3] || "",
                        errorReason: errorReasons.join(", "),
                        originalRow: index + 1 // Excel rows are 1-based
                    });
                    console.log(`❌ Row ${index} - FAILED:`, errorReasons);
                }
            });

            setbulkUploadReading(mappedData);
            setFailedReadingRecords(failedRecords);

            if (failedRecords.length > 0) {
                setShowFailedDownload(true);
                toast.warning(`${failedRecords.length} records failed validation. ${mappedData.length} records are valid. You can download the failed records to fix them.`);
            } else if (mappedData.length > 0) {
                toast.success(`All ${mappedData.length} records passed validation!`);
            } else {
                toast.error("No valid records found in the file.");
            }

            // Debug information
            console.log('=== FINAL UPLOAD RESULTS ===');
            console.log('Total valid records:', mappedData.length);
            console.log('Total failed records:', failedRecords.length);
            console.log('Valid records:', mappedData);
            console.log('Failed records:', failedRecords);
        };

        reader.readAsBinaryString(file);
    };

    function convertToDate(dateString) {
        if (!dateString) {
            throw new Error("Empty date string");
        }

        if (typeof dateString === "number") {
            // Excel serial date
            const excelEpoch = new Date(1900, 0, 1);
            const daysOffset = dateString > 59 ? dateString - 1 : dateString;
            const jsDate = new Date(excelEpoch.getTime() + daysOffset * 24 * 60 * 60 * 1000);
            jsDate.setUTCHours(0, 0, 0, 0);
            return jsDate.toISOString();
        } else if (typeof dateString === "string") {
            // Try DD/MM/YYYY format
            if (dateString.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
                const [day, month, year] = dateString.split("/").map(Number);
                const date = new Date(Date.UTC(year, month - 1, day));
                date.setUTCHours(0, 0, 0, 0);
                return date.toISOString();
            }
            // Try other date formats if needed
            const parsedDate = new Date(dateString);
            if (!isNaN(parsedDate.getTime())) {
                parsedDate.setUTCHours(0, 0, 0, 0);
                return parsedDate.toISOString();
            }
        }

        throw new Error(`Invalid date format: ${dateString}`);
    }

  const handleFileUploadCost = (event) => {
    setbulkUploadCost([]);
    setFailedCostRecords([]);
    setShowFailedCostDownload(false);

    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const binaryStr = e.target.result;
      const workbook = XLSX.read(binaryStr, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);
      const mappedData = [];
      const failedRecords = [];

      json?.forEach((row, index) => {
        let rowData = {
          submittedUserId: loggedInUserData?.id,
        };
        const rowValues = Object.values(row);
        let isValid = true;
        let errorReason = "";

        customColumnNamesCost.forEach((col, index) => {
          if (index === 0) {
            const dupIdx = energyCost.findIndex(
              (e) => e.reference === rowValues[index]
            );
            if (dupIdx >= 0) {
              rowData.energyId = energyCost[dupIdx]?.energyId;
              rowData.budgetCategory = energyCost[dupIdx]?.budgetCategory;
            }
          } else if (index === 1 || index === 2) {
            rowValues[index] = convertToDate(rowValues[index]);
            console.log(rowValues[index])
          } else if (index === 3) {
            // Validate cost is numeric
            if (isNaN(rowValues[index])) {
              isValid = false;
              errorReason = "Invalid cost value - must be numeric";
            }
          }
          rowData[col] = rowValues[index] || null;
        });

        if (isValid) {
          mappedData.push(rowData);
        } else {
          failedRecords.push({
            ...rowData,
            errorReason: errorReason || "Unknown error",
            originalRow: index + 2
          });
        }
      });

      setbulkUploadCost(mappedData);
      setFailedCostRecords(failedRecords);

      if (failedRecords.length > 0) {
        setShowFailedCostDownload(true);
        toast.warning(`${failedRecords.length} cost records failed validation. You can download the failed records to fix them.`);
      } else {
        toast.success("All cost records passed validation!");
      }
    };

    reader.readAsBinaryString(file);
  };

  const callbulkUploadCost = async () => {
    setopenBulk(false);
    for (const data of bulkUploadCost) {
      if (data) {
        data.budgetCategory = bulkCategory;
        await saveCost(data);
      }
    }
    setbulkUploadCost([]);
    getEnergyCost();
  };

  const callbulkUploadReading = async () => {
    setopenBulk(false);
    for (const data of bulkUploadReading) {
      if (data) {
        data.budgetCategory = bulkCategory;
        await saveReading(data);
      }
    }
    setbulkUploadReading([]);
    getEnergyCost();
  };

  const addEnergyCost = async (event) => {
    event.preventDefault();
    const form = event.target;
    if (!form.checkValidity()) {
      form.reportValidity();
    }
    const body = formData;
    body.siteId = siteSelectedForGlobal?.siteId;
    const dupIdx = energyCost.findIndex((e) => e.reference === body.reference);
    if (dupIdx >= 0) {
      toast.error("Meter Reference already exist");
      return;
    }

    await post("/api/energy/survey", body);
    setFormData({});
    await getEnergyCost();
  };

  const getEnergyCost = async () => {
    if (!siteSelectedForGlobal?.siteId) {
      toast.error("Please select site from site search to proceed....");
      return;
    }
    setIsLoading(true);
    const energyCost = await get("/api/energy/site/survey/" + siteSelectedForGlobal?.siteId);
    energyCost.forEach((energy) => {
      const dates = energy.costList.map((c) => new Date(c.fromDate));
      energy.readingList = energy.readingList?.sort((a, b) => new Date(b.readingDate) - new Date(a.readingDate));

      const minDate =
        Math.min(...dates) !== Infinity ? new Date(Math.min(...dates)) : null;
      const dates2 = energy.costList.map((c) => new Date(c.toDate));
      const maxDate =
        Math.max(...dates2) !== -Infinity
          ? new Date(Math.max(...dates2))
          : null;
      energy.minDate = minDate;
      energy.maxDate = maxDate;
    });

    setFilteredEnergyCost(energyCost);
    setEnergyCost(energyCost);
    setIsLoading(false);
  };

  const saveCost = async (data) => {
    data.submittedUserId = loggedInUserData?.id;
    data.siteId = siteSelectedForGlobal?.siteId;
    await post("/api/energy/cost", data);
    getEnergyCost();
  };

  const saveReading = async (data) => {
    if (data) {
      data.submittedUserId = loggedInUserData?.id;
      data.siteId = siteSelectedForGlobal?.siteId;
      await post("/api/energy/reading", data);
      getEnergyCost();
    }
  };

  return (
    <Fragment>
      <Dialog
        open={openBulk}
        onClose={() => {
          setopenBulk(false);
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Bulk Upload</DialogTitle>
        <DialogContent dividers>
          <Fragment>
            {!bulkCategory && (
              <div className="col">
                <label for="budgetCategory">Select Budget Category</label>
                <select
                  name="budgetCategory"
                  className="form-control form-select"
                  id="budgetCategory"
                  onChange={(e) => setBulkCategory(e.target.value)}
                >
                  <option value="">Budget Category</option>
                  {typeoptions?.map((t) => (
                    <option value={t}>{t}</option>
                  ))}
                </select>
              </div>
            )}
            {bulkCategory && (
              <>
                <h5>Bulk Upload Energy Cost</h5>
                <p style={{ color: "red" }}>
                  Download the template{" "}
                  <Link href="cost-template.xlsx" download="cost-template.xlsx">
                    here
                  </Link>{" "}
                  and populate the values before you upload using the file
                  selection below
                </p>
                <input
                  type="file"
                  name="file"
                  className="form-control"
                  onChange={handleFileUploadCost}
                />

                {/* Failed Cost Records Download */}
                {showFailedCostDownload && (
                  <div style={{ marginTop: "10px", padding: "10px", backgroundColor: "#fff3cd", border: "1px solid #ffeaa7", borderRadius: "4px" }}>
                    <p style={{ color: "#856404", margin: "0 0 10px 0" }}>
                      {failedCostRecords.length} cost records failed validation.
                      Download the file to see the errors and fix them:
                    </p>
                    <CSVLink
                      data={failedCostRecords}
                      headers={failedCostHeaders}
                      filename={`failed_cost_records_${moment().format('YYYY-MM-DD_HH-mm')}.csv`}
                      className="btn btn-warning btn-sm"
                    >
                      <i className="fas fa-download" /> Download Failed Cost Records
                    </CSVLink>
                  </div>
                )}

                <button
                  style={{ marginTop: "10px" }}
                  className="btn btn-primary text-white pr-2"
                  onClick={(e) => callbulkUploadCost()}
                  disabled={bulkUploadCost.length === 0}
                >
                  Upload Energy Cost ({bulkUploadCost.length} valid records)
                </button>

                <br />
                <br />
                <hr />
                <br />
                <br />

                <h5>Bulk Upload Energy Reading</h5>
                <p style={{ color: "red" }}>
                  Download the template{" "}
                  <Link
                    href="reading-template.xlsx"
                    download="reading-template.xlsx"
                  >
                    here
                  </Link>{" "}
                  and populate the values before you upload using the file
                  selection below
                </p>
                <input
                  type="file"
                  name="file"
                  className="form-control"
                  onChange={handleFileUploadReading}
                />

                {/* Failed Reading Records Download */}
                {showFailedDownload && (
                  <div style={{ marginTop: "10px", padding: "10px", backgroundColor: "#fff3cd", border: "1px solid #ffeaa7", borderRadius: "4px" }}>
                    <p style={{ color: "#856404", margin: "0 0 10px 0" }}>
                      {failedReadingRecords.length} reading records failed validation.
                      Download the file to see the errors and fix them:
                    </p>
                    <CSVLink
                      data={failedReadingRecords}
                      headers={failedReadingHeaders}
                      filename={`failed_reading_records_${moment().format('YYYY-MM-DD_HH-mm')}.csv`}
                      className="btn btn-warning btn-sm"
                    >
                      <i className="fas fa-download" /> Download Failed Reading Records
                    </CSVLink>
                  </div>
                )}

                <button
                  style={{ marginTop: "10px" }}
                  className="btn btn-primary text-white pr-2"
                  onClick={(e) => callbulkUploadReading()}
                  disabled={bulkUploadReading.length === 0}
                >
                  Upload Energy Reading ({bulkUploadReading.length} valid records)
                </button>

                <br />
                <br />
              </>
            )}
          </Fragment>
        </DialogContent>
      </Dialog>
      {/* Rest of your component remains the same */}
      <Cost
        open={openCost}
        setOpen={setOpenCost}
        typeoptions={typeoptions}
        survey={actionSurvey}
        saveData={saveCost}
        deleteEnergyCost={deleteEnergyCost}
        isViewMode={isViewMode}
      />
      <Reading
        open={openReading}
        setOpen={setOpenReading}
        typeoptions={typeoptions}
        survey={actionSurvey}
        saveData={saveReading}
        deleteEnergyReading={deleteEnergyReading}
        isViewMode={isViewMode}
      />

      <SidebarNew />

      <div className="content">
        <Header />
        <div className="container-fluid">
          <BreadCrumHeader
            header={"Site Energy Readings & Cost"}
            page={"Energy"}
          />

          <div className="d-flex bd-highlight" style={{ flexWrap: 'wrap' }}>
            <div className="pt-2 bd-highlight ">
              <div className="row" style={{ height: "auto" }}>
                <div className="col">
                  <div style={{ position: "relative" }}>
                    <i
                      style={{
                        position: "absolute",
                        padding: "10px",
                        color: "lightgrey",
                        paddingLeft: "1.5rem",
                      }}
                      className="fas fa-search"
                    ></i>
                    <input
                      type="text"
                      autoComplete="off"
                      readOnly
                      onFocus={(e) => e.target.removeAttribute("readonly")}
                      placeholder="Search"
                      name="searchField"
                      style={{ textAlign: "center", width: "250px" }}
                      className="form-control"
                      onChange={handleInputChange2}
                    />
                  </div>
                </div>
                <div className="col">
                  <select
                    name="budgetCategory"
                    className="form-control form-select"
                    id="budgetCategory"
                    onChange={handleInputChange2}
                  >
                    <option value="">Budget Category</option>
                    {typeoptions?.map((t) => (
                      <option value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            {isManagerAdminLogin(loggedInUserData) && (
              <>
                <div
                  className="ms-auto p-2 bd-highlight"
                  style={{ backgroundColor: "#384BD3", borderRadius: "15px" }}
                >
                  <form onSubmit={addEnergyCost}>
                    <div className="row" style={{ height: "auto" }}>
                      <div className="col"></div>
                      <div className="col">
                        <Typography
                          color="white"
                          style={{ marginBottom: "8px" }}
                        >
                          {" "}
                          CREATE NEW{" "}
                        </Typography>
                      </div>
                      <div className="col"></div>
                    </div>
                    <div className="row" style={{ height: "auto" }}>
                      <div className="col">
                        <input
                          type="reference"
                          value={formData?.reference}
                          name="reference"
                          className="form-control"
                          required
                          onChange={handleInputChange}
                          placeholder="Energy Meter Reference"
                        />
                      </div>
                      <div className="col">
                        <select
                          name="budgetCategory"
                          className="form-control form-select"
                          id="budgetCategory"
                          value={formData?.budgetCategory}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Budget Category</option>
                          {typeoptions?.map((t) => (
                            <option value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col">
                        <button
                          style={{ width: "150px" }}
                          className="btn btn-primary btn-light"
                          type="submit"
                        >
                          Create
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
                <div className="ms-auto p-2 bd-highlight">
                  <div className="row" style={{ height: "auto" }}>
                    <div className="col">
                      <button
                        style={{ width: "150px" }}
                        className="btn btn-primary btn-light"
                        onClick={() => {
                          setBulkCategory();
                          setopenBulk(true);
                        }}
                      >
                        <i className="fas fa-upload" /> &nbsp; Bulk Upload
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="row p-2"></div>
          <div className="col-md-12 table-responsive">
            <table className="table">
              <thead className="table-dark">
                <tr>
                  <th scope="col">Meter Reference</th>
                  {/* <th scope="col">Submitted By</th> */}
                  <th scope="col">Budget Category</th>
                  <th scope="col">From Date</th>
                  <th scope="col">To Date</th>
                  <th scope="col">Reading</th>
                  <th scope="col">Cost (GBP)</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!isLoading && filteredEnergyCost?.length === 0 && (
                  <tr>
                    <td>No result found!!</td>
                  </tr>
                )}
                {isLoading && (
                  <tr>
                    <td colSpan={8} align="center">
                      <CircularProgress />
                    </td>
                  </tr>
                )}

                {!isLoading &&
                  filteredEnergyCost?.map((action) => {
                    return (
                      <tr key={action?.id}>
                        <th scope="col">{action?.reference}</th>
                        <th scope="col">{action?.budgetCategory}</th>
                        <th scope="col" style={{ width: "150px" }}>
                          {action?.minDate
                            ? moment(action?.minDate).format("DD/MM/YYYY")
                            : "-"}
                        </th>
                        <th scope="col" style={{ width: "150px" }}>
                          {action?.maxDate
                            ? moment(action?.maxDate).format("DD/MM/YYYY")
                            : "-"}
                        </th>
                        <th scope="col">
                          {action?.readingList?.[0]?.readingValue?.toFixed(2) ?? "-"}{" "}
                          {
                            action?.readingList?.[0]?.readingUnit
                          }
                        </th>
                        <th scope="col">

                          {formatToCurrency(action?.costList
                            ?.map((c) => c.cost)
                            .reduce((a, b) => {
                              return a + b;
                            }, 0)?.toFixed(2))}
                        </th>

                        <th scope="col" style={{ width: "250px" }}>
                          <Tooltip title={`View/Edit Energy Cost`} arrow>
                            <button
                              className="btn btn-sm btn-light"
                              onClick={() => {
                                setActionSurvey(action);
                                setOpenCost(true);
                                if (!isManagerAdminLogin(loggedInUserData)) {
                                  setIsViewMode(true);
                                } else {
                                  setIsViewMode(false);
                                }
                              }}
                            >
                              <i className="fas fa-dollar-sign"></i>
                            </button>{" "}
                          </Tooltip>
                          <Tooltip title={`View /Edit Energy Reading`} arrow>
                            <button
                              className="btn btn-sm btn-light"
                              onClick={() => {
                                setActionSurvey(action);
                                setOpenReading(true);
                                if (!isManagerAdminLogin(loggedInUserData)) {
                                  setIsViewMode(true);
                                } else {
                                  setIsViewMode(false);
                                }
                              }}
                            >
                              <i class="fas fa-solid fa-chart-line"></i>{" "}
                            </button>{" "}
                          </Tooltip>

                          <Tooltip title={`Delete`} arrow>
                            <button
                              className="btn btn-sm btn-light text-dark"
                              onClick={() => deleteEnergyCostCall(action)}
                              disabled={!isManagerAdminLogin(loggedInUserData)}
                            >
                              <i className="fas fa-trash"></i>
                            </button>{" "}
                          </Tooltip>
                        </th>
                      </tr>
                    );
                  })}
              </tbody>
            </table>

            <Pagination
              totalPages={Math.ceil(filteredEnergyCost.length / itemsPerPage)}
              currentPage={currentPage}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>
    </Fragment>
  );
};

const mapStateToProps = (state) => ({
  sites: state.site.sites,
  loggedInUserData: state.site.loggedInUserData,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
});
export default connect(mapStateToProps, { getSites })(EnergyCost);