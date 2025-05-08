import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import { get, post, del } from "../../../../api";
import Cost from "./Cost";
import Reading from "./Reading";
import * as XLSX from "xlsx";

import {
  DialogContent,
  DialogTitle,
  Link,
  Dialog,
  CircularProgress,
  Switch,
} from "@mui/material";
import { getSites } from "../../../../store/thunk/site";
import CostChart from "./CostChart";
import { SiteArea } from "../../../../Constant/SiteArea";

const EnergyCost = ({ loggedInUserData, siteSelectedForGlobal, sites }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [openCost, setOpenCost] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [openBulk, setopenBulk] = useState(false);
  const [bulkUploadCost, setbulkUploadCost] = useState([]);
  const [bulkUploadReading, setbulkUploadReading] = useState([]);
  const [actionSurvey, setActionSurvey] = useState();
  const [openReading, setOpenReading] = useState(false);
  const [typeoptions, settypeoptions] = useState([]);
  const [filteredEnergyCost, setFilteredEnergyCost] = useState([]);
  const [energyCost, setEnergyCost] = useState([]);
  const [checked, setChecked] = useState(true);
  const [allSites, setAllSites] = useState([]);
  const [site2EnergyReadingData, setSite2EnergyReadingData] = useState([]);
  const [site1EnergyCostData, setSite1EnergyCostData] = useState([]);
  const [site2EnergyCostData, setSite2EnergyCostData] = useState([]);
  const [state, setState] = useState({
    selectedArea: "",
    site1: "",
    site2: "",
    siteComparisonYear: new Date().getFullYear(),
    currentYear: new Date().getFullYear(),
    previousYear: new Date().getFullYear() - 1,
    isIndividual: false,
  });
  const years = Array.from(
    { length: 16 },
    (_, i) => new Date().getFullYear() - i
  );

  useEffect(() => {
    gettypeoptions();
    getAllSites();
    getEnergyCost(true);
  }, []);

  const getAllSites = async () => {
    const res = await get("/api/site/site/all?sort=asc&sortName=siteName&withDetails=true");
    setAllSites(res);
  };

  const customColumnNamesCost = ["reference", "fromDate", "toDate", "cost"];
  const customColumnNamesReading = [
    "reference",
    "readingDate",
    "readingValue",
    "readingUnit",
  ];

  const getSiteName = (siteId) => {
    return (
      allSites?.filter((site) => site?.siteId === siteId)?.[0]?.siteName || "--"
    );
  };

  const [itemsPerPage] = useState(7);
  const [currentPage, setCurrentPage] = useState(1);
  const [bulkCategory, setBulkCategory] = useState();
  const [bulkCategoryForCompare, setBulkCategoryForCompare] = useState();
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
    settypeoptions(lovtypes?.map((l) => l.lovValue));
  };

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

  useEffect(() => {
    getEnergyCost(state.isIndividual);
  }, [siteSelectedForGlobal, state.isIndividual]);

  const getFloorArea = () => {
    if (state.isIndividual) {
      const siteInd = allSites.filter(site => site?.siteId == siteSelectedForGlobal?.siteId)?.[0] || {};
      return siteInd?.siteAreaOccupancyData?.totalBuildingArea || 100;
    } else {
      return allSites.reduce((total, site) => 
        total + (site.siteAreaOccupancyData?.totalBuildingArea || 0), 0
      );
    }
  };
  const convertGasToKWh = (volumeInM3) => {
    // Conversion factors (these can be adjusted based on your specific gas properties)
    const calorificValue = 39.5; // Typical value in MJ/m³ (may vary)
    const conversionFactor = 3.6; // MJ to kWh conversion
    return (volumeInM3 * calorificValue) / conversionFactor;
  };
  const calculateActualConsumption = (readingList) => {
    if (!readingList || readingList.length === 0) return [];
    
    // Sort readings by date
    const sortedReadings = [...readingList].sort(
      (a, b) => new Date(a.readingDate) - new Date(b.readingDate)
    );
  
    // Calculate actual consumption
    return sortedReadings.map((reading, index) => {
      if (index === 0) {
        return {
          ...reading,
          actualConsumption: null, // No previous reading to compare with
          isEstimated: false,
          convertedValue: reading.readingUnit === 'M3' 
            ? convertGasToKWh(reading.readingValue)
            : reading.readingValue
        };
      }
      
      const prevReading = sortedReadings[index - 1].readingValue;
      const currentReading = reading.readingValue;
      const consumption = currentReading - prevReading;
      
      return {
        ...reading,
        actualConsumption: reading.readingUnit === 'M3'
          ? convertGasToKWh(consumption)
          : consumption,
        isEstimated: false,
        convertedValue: reading.readingUnit === 'M3'
          ? convertGasToKWh(reading.readingValue)
          : reading.readingValue
      };
    });
  };

  const getEnergyCost = async (isIndividual) => {
    if (!siteSelectedForGlobal?.siteId && isIndividual) {
      toast.error("Please select site from site search to proceed....");
      return;
    }
    setIsLoading(true);
    
    try {
      let energyCostData;
      if (isIndividual) {
        energyCostData = await get("/api/energy/site/survey/" + siteSelectedForGlobal?.siteId);
      } else if (state.selectedArea) {
        energyCostData = await get(`/api/energy/survey/all?area=${state.selectedArea}`);
      } else {
        energyCostData = await get("/api/energy/survey/all");
      }

      // Process each energy record to calculate actual consumption
      const processedEnergyCost = energyCostData.map((energy) => {
        const processedReadings = calculateActualConsumption(energy.readingList || []);
        
        // Process cost dates
        const dates = energy.costList?.map((c) => new Date(c.fromDate)) || [];
        const minDate = dates.length > 0 ? new Date(Math.min(...dates)) : null;
        
        const dates2 = energy.costList?.map((c) => new Date(c.toDate)) || [];
        const maxDate = dates2.length > 0 ? new Date(Math.max(...dates2)) : null;

        return {
          ...energy,
          readingList: processedReadings,
          minDate,
          maxDate
        };
      });

      setEnergyCost(processedEnergyCost);
      
      // Apply filters if any
      let filteredData = processedEnergyCost;
      if (formData2?.budgetCategory?.length > 0) {
        filteredData = filteredData.filter(
          (sc) => sc.budgetCategory === formData2.budgetCategory
        );
      }

      setFilteredEnergyCost(filteredData);
    } catch (error) {
      toast.error("Failed to fetch energy data: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUploadReading = (event) => {
    setbulkUploadReading([]);
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const binaryStr = e.target.result;
      const workbook = XLSX.read(binaryStr, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);
      
      // Sort by date to ensure chronological order
      const sortedJson = json.sort((a, b) => {
        const dateA = convertToDate(Object.values(a)[1]);
        const dateB = convertToDate(Object.values(b)[1]);
        return new Date(dateA) - new Date(dateB);
      });

      const mappedData = sortedJson?.map((row, index) => {
        let rowData = {
          submittedUserId: loggedInUserData?.id,
          readingUnit: "kWh",
        };
        const rowValues = Object.values(row)?.slice(0, 4);

        if (rowValues.length > 3) {
          customColumnNamesReading.forEach((col, colIndex) => {
            if (colIndex === 0) {
              const dupIdx = energyCost.findIndex(
                (e) => e.reference === rowValues[colIndex]
              );
              if (dupIdx >= 0) {
                rowData.energyId = energyCost[dupIdx]?.energyId;
                rowData.budgetCategory = energyCost[dupIdx]?.budgetCategory;
              }
            } else if (colIndex === 1) {
              rowValues[colIndex] = convertToDate(rowValues[colIndex]);
            } else if (colIndex === 2) {
              if (isNaN(rowValues[colIndex])) {
                toast.error(
                  `Invalid reading value in row ${index + 1}: ${rowValues[colIndex]}`
                );
                return;
              }
            }
            rowData[col] = rowValues[colIndex] || null;
          });

          return rowData;
        }
        return null;
      }).filter(Boolean);

      setbulkUploadReading(mappedData);
    };

    reader.readAsBinaryString(file);
  };

  function convertToDate(dateString) {
    if (typeof dateString === "number") {
      // Excel date format
      const excelEpoch = new Date(1900, 0, 1);
      const daysOffset = dateString > 59 ? dateString - 1 : dateString;
      const jsDate = new Date(
        excelEpoch.getTime() + daysOffset * 24 * 60 * 60 * 1000
      );
      return jsDate.toISOString();
    } else if (typeof dateString === "string") {
      // Try different date string formats
      if (dateString.includes("/")) {
        const [day, month, year] = dateString.split("/").map(Number);
        const date = new Date(year, month - 1, day);
        return date.toISOString();
      } else if (dateString.includes("-")) {
        return new Date(dateString).toISOString();
      }
    }
    return dateString;
  }

  const handleFileUploadCost = (event) => {
    setbulkUploadCost([]);
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const binaryStr = e.target.result;
      const workbook = XLSX.read(binaryStr, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);
      const mappedData = json.map((row) => {
        let rowData = {
          submittedUserId: loggedInUserData?.id,
        };
        const rowValues = Object.values(row);
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
          }
          rowData[col] = rowValues[index] || null;
        });
        return rowData;
      });
      setbulkUploadCost(mappedData);
    };

    reader.readAsBinaryString(file);
  };

  const callbulkUploadCost = async () => {
    setopenBulk(false);
    try {
      for (const data of bulkUploadCost) {
        if (data) {
          data.budgetCategory = bulkCategory;
          await saveCost(data);
        }
      }
      toast.success("Bulk upload of energy costs completed successfully");
      setbulkUploadCost([]);
      getEnergyCost(state.isIndividual);
    } catch (error) {
      toast.error("Error during bulk upload: " + error.message);
    }
  };

  const callbulkUploadReading = async () => {
    setopenBulk(false);
    try {
      for (const data of bulkUploadReading) {
        if (data) {
          data.budgetCategory = bulkCategory;
          await saveReading(data);
        }
      }
      toast.success("Bulk upload of energy readings completed successfully");
      setbulkUploadReading([]);
      getEnergyCost(state.isIndividual);
    } catch (error) {
      toast.error("Error during bulk upload: " + error.message);
    }
  };

  const saveCost = async (data) => {
    try {
      data.submittedUserId = loggedInUserData?.id;
      data.siteId = siteSelectedForGlobal?.siteId;
      await post("/api/energy/cost", data);
      getEnergyCost(state.isIndividual);
      toast.success("Energy cost added successfully");
    } catch (error) {
      toast.error("Failed to save energy cost: " + error.message);
    }
  };

  const saveReading = async (data) => {
    try {
      if (data) {
        data.submittedUserId = loggedInUserData?.id;
        data.siteId = siteSelectedForGlobal?.siteId;
        await post("/api/energy/reading", data);
        getEnergyCost(state.isIndividual);
        toast.success("Energy reading added successfully");
      }
    } catch (error) {
      toast.error("Failed to save energy reading: " + error.message);
    }
  };

  const handleChange = async (event) => {
    console.log("event", event);
    setState((prevState) => ({
      ...prevState,
      isIndividual: event.target.checked,
    }));
    await getEnergyCost(event.target.checked);
  };

  const handleAreaChange = (e) => {
    const area = e.target.value;
    setState((prevState) => ({
      ...prevState,
      selectedArea: area,
    }));
    getEnergyCost(false);
  };

  const handleSite1Change = async (e) => {
    const siteId = e.target.value;
    setState((prevState) => ({
      ...prevState,
      site1: siteId,
    }));
    if (siteId) {
      const energyCost = await get("/api/energy/site/survey/" + siteId);
      const processedEnergyCost = energyCost.map((energy) => {
        const processedReadings = calculateActualConsumption(energy.readingList || []);
        const dates = energy.costList?.map((c) => new Date(c.fromDate)) || [];
        const minDate = dates.length > 0 ? new Date(Math.min(...dates)) : null;
        const dates2 = energy.costList?.map((c) => new Date(c.toDate)) || [];
        const maxDate = dates2.length > 0 ? new Date(Math.max(...dates2)) : null;
        return {
          ...energy,
          readingList: processedReadings,
          minDate,
          maxDate
        };
      });
      setSite1EnergyCostData(processedEnergyCost);
    } else {
      setSite1EnergyCostData([]);
    }
  };

  const handleSite2Change = async (e) => {
    const siteId = e.target.value;
    setState((prevState) => ({
      ...prevState,
      site2: siteId,
    }));
    if (siteId) {
      const energyCost = await get("/api/energy/site/survey/" + siteId);
      const processedEnergyCost = energyCost.map((energy) => {
        const processedReadings = calculateActualConsumption(energy.readingList || []);
        const dates = energy.costList?.map((c) => new Date(c.fromDate)) || [];
        const minDate = dates.length > 0 ? new Date(Math.min(...dates)) : null;
        const dates2 = energy.costList?.map((c) => new Date(c.toDate)) || [];
        const maxDate = dates2.length > 0 ? new Date(Math.max(...dates2)) : null;
        return {
          ...energy,
          readingList: processedReadings,
          minDate,
          maxDate
        };
      });
      setSite2EnergyCostData(processedEnergyCost);
    } else {
      setSite2EnergyCostData([]);
    }
  };

  const handleComparisonYearChange = (e) => {
    setState((prevState) => ({
      ...prevState,
      siteComparisonYear: Number(e.target.value),
    }));
  };

  const handleYearChange = (e) => {
    setState((prevState) => ({
      ...prevState,
      currentYear: Number(e.target.value),
    }));
  };

  const handlePreviousYearChange = (e) => {
    setState((prevState) => ({
      ...prevState,
      previousYear: Number(e.target.value),
    }));
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
              <>
                <div className="col">
                  <label htmlFor="budgetCategory">Select Budget Category</label>
                  <select
                    name="budgetCategory"
                    className="form-control form-select"
                    id="budgetCategory"
                    onChange={(e) => setBulkCategory(e.target.value)}
                  >
                    <option value="">Budget Category</option>
                    {typeoptions?.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </>
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
                <button
                  style={{ marginTop: "10px" }}
                  className="btn btn-primary text-white pr-2"
                  onClick={callbulkUploadCost}
                  disabled={!bulkUploadCost.length}
                >
                  Upload Energy Cost
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
                <button
                  style={{ marginTop: "10px" }}
                  className="btn btn-primary text-white pr-2"
                  onClick={callbulkUploadReading}
                  disabled={!bulkUploadReading.length}
                >
                  Upload Energy Reading
                </button>

                <br />
                <br />
              </>
            )}
          </Fragment>
        </DialogContent>
      </Dialog>
      
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

      <div>
        <div>
          <div className="d-flex bd-highlight" style={{ flexWrap: "wrap" }}>
            <div className="pt-2 bd-highlight ">
              <div className="row" style={{ height: "auto" }}>
                <div className="col">
                  <select
                    name="budgetCategory"
                    className="form-control form-select"
                    id="budgetCategory"
                    onChange={handleInputChange2}
                    value={formData2.budgetCategory || ""}
                  >
                    <option value="">All Budget Categories</option>
                    {typeoptions?.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="col">
                  <select
                    name="area"
                    className="form-control form-select"
                    id="area"
                    disabled={state.isIndividual}
                    onChange={handleAreaChange}
                    value={state.selectedArea}
                  >
                    <option value="">All Areas</option>
                    {SiteArea?.map((itm) => (
                      <option key={itm} value={itm.replace("&", "%26")}>{itm}</option>
                    ))}
                  </select>
                </div>
                <div className="col">
                  <Switch
                    checked={state.isIndividual}
                    onChange={handleChange}
                    inputProps={{ "aria-label": "controlled" }}
                  />
                  <label>Individual Site</label>
                </div>
                <div className="col">
                  <label htmlFor="year-select">Select Year:</label>
                  <select
                    id="year-select"
                    className="form-control form-select"
                    value={state.currentYear}
                    onChange={handleYearChange}
                  >
                    {years?.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          <div className="row" style={{ height: "auto" }}>
            <div className="col-md-12 mt-2 mb-4">
              <h5>Energy Cost</h5>
              {isLoading ? (
                <div className="text-center">
                  <CircularProgress />
                </div>
              ) : (
                <CostChart
                  energyData={filteredEnergyCost}
                  currentYear={state.currentYear}
                  floorArea={getFloorArea()}
                  useConvertedValues={true}
                />
              )}
            </div>
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