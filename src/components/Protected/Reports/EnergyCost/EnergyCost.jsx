import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import moment from "moment";
import Pagination from "../../../common/Pagination/Pagination";
import Tooltip from "@mui/material/Tooltip";
import { toast } from "react-toastify";
import { get, post, del } from "../../../../api";
import Cost from "./Cost";
import Reading from "./Reading";
import * as XLSX from "xlsx";
import { CSVLink } from "react-csv";

import {
  DialogContent,
  DialogTitle,
  Link,
  Dialog,
  CircularProgress,
  Switch,
} from "@mui/material";
import { getSites } from "../../../../store/thunk/site";
import { isManagerAdminLogin } from "../../../../utils/isManagerAdminLogin";
import CostChart from "./CostChart";
import EnergyChart from "./EnergyChart";
import { SiteArea } from "../../../../Constant/SiteArea";
import SitesEnergyChart from "./SitesEnergyChart";
import SitesCostChart from "./SitesCostChart";

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
  const site = JSON.parse(localStorage.getItem("site"));
  const [filteredEnergyCost, setFilteredEnergyCost] = useState([]);
  const [energyCost, setEnergyCost] = useState([]);
  const [checked, setChecked] = useState(true);
  const [site1EnergyReadingData, setSite1EnergyReadingData] = useState([]);
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
  });
  const years = Array.from(
    { length: 16 },
    (_, i) => new Date().getFullYear() - i
  );

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

  const [itemsPerPage] = useState(7);
  const [currentPage, setCurrentPage] = useState(1);
  const [bulkCategory, setBulkCategory] = useState();
  const [bulkCategoryForCompare, setBulkCategoryForCompare] = useState();
  const indexOfLastPreAction = currentPage * itemsPerPage;
  const indexOfFirstPreAction = indexOfLastPreAction - itemsPerPage;
  const currentEnergyCost = filteredEnergyCost.slice(
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

  useEffect(() => {}, []);
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
    getEnergyCost(false);
  }, [siteSelectedForGlobal]);

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
      const mappedData = json.map((row) => {
        let rowData = {
          submittedUserId: loggedInUserData?.id,
          readingUnit: "kWh",
        };
        const rowValues = Object.values(row).slice(0, 4);

        if (rowValues.length > 3) {
          customColumnNamesReading.forEach((col, index) => {
            if (index === 0) {
              const dupIdx = energyCost.findIndex(
                (e) => e.reference === rowValues[index]
              );
              if (dupIdx >= 0) {
                rowData.energyId = energyCost[dupIdx]?.energyId;
                rowData.budgetCategory = energyCost[dupIdx]?.budgetCategory;
              }
            } else if (index === 1) {
              rowValues[index] = convertToDate(rowValues[index]);
            } else if (index === 2) {
              if (isNaN(rowValues[index])) {
                toast(
                  "Invalid reading present in attached file at row no " + index
                );
                return;
              }
            } else {
            }
            rowData[col] = rowValues[index] || null;
          });

          return rowData;
        }
      });
      setbulkUploadReading(mappedData);
    };

    reader.readAsBinaryString(file);
  };

  function convertToDate(dateString) {
    const [day, month, year] = dateString.split("/").map(Number);
    const date = new Date(year, month - 1, day);
    return new Date(
      date.getTime() - date.getTimezoneOffset() * 60000
    ).toISOString();
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

  const formatToCurrency = (value) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const addEnergyCost = async (event) => {
    event.preventDefault();
    const form = event.target;
    if (!form.checkValidity()) {
      form.reportValidity();
    }
    const body = formData;
    body.siteId = site.siteId;
    const dupIdx = energyCost.findIndex((e) => e.reference === body.reference);
    if (dupIdx >= 0) {
      toast.error("Meter Reference already exist");
      return;
    }

    await post("/api/energy/survey", body);
    setFormData({});
    await getEnergyCost();
  };

  const getEnergyCost = async (isAll) => {
    if (!site?.siteId) {
      toast.error("Please select site from site search to proceed....");
      return;
    }
    setIsLoading(true);
    const energyCost = isAll
      ? await get("/api/energy/survey/all")
      : await get("/api/energy/site/survey/" + site?.siteId);
    energyCost.forEach((energy) => {
      const dates = energy.costList.map((c) => new Date(c.fromDate));
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
    data.siteId = site.siteId;
    await post("/api/energy/cost", data);
    getEnergyCost();
  };

  const saveReading = async (data) => {
    if (data) {
      data.submittedUserId = loggedInUserData?.id;
      data.siteId = site.siteId;
      await post("/api/energy/reading", data);
      getEnergyCost();
    }
  };
  const handleChange = (event) => {
    setChecked(event.target.checked);
    if (event.target.checked) {
      getEnergyCost(false);
    } else {
      getEnergyCost(true);
    }
  };
  const handleAreaChange = (e) => {
    setState((prevState) => ({
      ...prevState,
      selectedArea: e.target.value,
    }));
    getActionsByArea(e.target.value);
  };
  const handleSite1Change = async (e) => {
    setState((prevState) => ({
      ...prevState,
      site1: e.target.value,
    }));
    const energyCost = await get("/api/energy/site/survey/" + e.target.value);
    energyCost.forEach((energy) => {
      const dates = energy.costList.map((c) => new Date(c.fromDate));
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
    setSite1EnergyCostData(energyCost);
  };
  const handleSite2Change = async (e) => {
    setState((prevState) => ({
      ...prevState,
      site2: e.target.value,
    }));
    const energyCost = await get("/api/energy/site/survey/" + e.target.value);
    energyCost.forEach((energy) => {
      const dates = energy.costList.map((c) => new Date(c.fromDate));
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
    setSite2EnergyCostData(energyCost);
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

  const getActionsByArea = async (area) => {
    if (area) {
      const energyCost = await get(`/api/energy/survey/all?area=${area}`);
      energyCost.forEach((energy) => {
        const dates = energy.costList.map((c) => new Date(c.fromDate));
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
    } else {
      getEnergyCost(checked);
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
              <>
                <div className="col">
                  <label for="budgetCategory">Select Budget Category</label>
                  <select
                    name="budgetCategory"
                    className="form-control form-select"
                    id="budgetCategory"
                    onChange={(e) => setBulkCategory(e.target.value)}
                  >
                    <option value="">Budget Category</option>
                    {typeoptions.map((t) => (
                      <option value={t}>{t}</option>
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
                  onClick={(e) => callbulkUploadCost()}
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
                  onClick={(e) => callbulkUploadReading()}
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
                  >
                    <option value="">Budget Category</option>
                    {typeoptions.map((t) => (
                      <option value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="col">
                  <select
                    name="area"
                    className="form-control form-select"
                    id="area"
                    onChange={handleAreaChange}
                    value={state.selectedArea}
                  >
                    <option value="">Area</option>
                    {SiteArea?.map((itm) => (
                      <option value={itm}>{itm}</option>
                    ))}
                  </select>
                </div>
                <div className="col">
                  <label>All</label>
                  <Switch
                    checked={checked}
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
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col">
                  <label htmlFor="year-select">Select previous year:</label>
                  <select
                    id="year-select"
                    value={state.previousYear}
                    className="form-control form-select"
                    onChange={handlePreviousYearChange}
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            {/* {isManagerAdminLogin(loggedInUserData) && (
              <>
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
                    <div className="col">
                      <CSVLink
                        filename={"site-energy-costs.csv"}
                        className="btn btn-light bg-white text-primary"
                        data={filteredEnergyCost || []}
                      >
                        <Tooltip title={`Export`} arrow>
                          <i className="fas fa-download"></i>
                        </Tooltip>
                      </CSVLink>
                    </div>
                  </div>
                </div>
              </>
            )} */}
          </div>
          <div className="row" style={{ height: "auto" }}>
            <div className="col-md-6 mt-2 mb-4">
              <h5>Energy Cost</h5>
              <CostChart
                energyData={filteredEnergyCost}
                currentYear={state.currentYear}
                previousYear={state.previousYear}
              />
            </div>
            <div className="col-md-6 mt-2 mb-4">
              <h5>Energy Reading</h5>
              <EnergyChart
                energyData={filteredEnergyCost}
                currentYear={state.currentYear}
                previousYear={state.previousYear}
              />
            </div>
          </div>

          <div className="row p-2 mb-2" style={{ height: "auto" }}>
            <div>
              <h3>Compare 2 Sites</h3>
            </div>
            <div className="col-md-3">
              <label htmlFor="site1">Site 1:</label>
              <select
                name="site1"
                className="form-control form-select"
                id="site1"
                onChange={handleSite1Change}
                value={state.site1}
              >
                <option value="">Select Site 1</option>
                {sites
                  ?.filter(
                    (itm) => String(itm?.status).toLowerCase() === "open"
                  )
                  ?.map((itm) => (
                    <option key={itm?.siteId} value={itm?.siteId}>
                      {itm?.siteName}
                    </option>
                  ))}
              </select>
            </div>
            <div className="col-md-3">
              <label htmlFor="site1">Site 2:</label>

              <select
                name="site2"
                className="form-control form-select"
                id="site2"
                onChange={handleSite2Change}
                value={state.site2}
              >
                <option value="">Select Site 2</option>
                {sites?.filter(
                    (itm) => String(itm?.status).toLowerCase() === "open"
                  )?.map((itm) => (
                  <option key={itm?.siteId} value={itm?.siteId}>
                    {itm?.siteName}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label htmlFor="year-select">Select Year:</label>
              <select
                id="year-select"
                className="form-control form-select"
                value={state.siteComparisonYear}
                onChange={handleComparisonYearChange}
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
            <label for="budgetCategoryCompare">Select Budget Category</label>
                  <select
                    name="budgetCategoryCompare"
                    className="form-control form-select"
                    id="budgetCategoryCompare"
                    onChange={(e) => setBulkCategoryForCompare(e.target.value)}
                  >
                    <option value="">Budget Category</option>
                    {typeoptions.map((t) => (
                      <option value={t}>{t}</option>
                    ))}
                  </select>
            </div>
          </div>
          <div className="row" style={{ height: "auto" }}>
            <div className="col-md-6 mt-2 mb-4">
              <h5>Energy Cost</h5>
              <SitesCostChart
                site1energyData={site1EnergyCostData}
                site2energyData={site2EnergyCostData}
                currentYear={state.siteComparisonYear}
                budgetCategoryForompare={bulkCategoryForCompare}
              />
            </div>
            <div className="col-md-6 mt-2 mb-4">
              <h5>Energy Reading</h5>
              <SitesEnergyChart
                site1energyData={site1EnergyCostData}
                site2energyData={site2EnergyCostData}
                currentYear={state.siteComparisonYear}
                budgetCategoryForompare={bulkCategoryForCompare}
              />
            </div>
          </div>
          <div className="col-md-12 table-responsive">
            <table className="table">
              <thead className="table-dark">
                <tr>
                  <th scope="col">Meter Reference</th>
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
                          {action?.readingList?.[
                            action?.readingList?.length - 1
                          ]?.readingValue?.toFixed(2) ?? "-"}{" "}
                          {
                            action?.readingList?.[
                              action?.readingList?.length - 1
                            ]?.readingUnit
                          }
                        </th>
                        <th scope="col">
                          {formatToCurrency(
                            action?.costList
                              ?.map((c) => c.cost)
                              .reduce((a, b) => {
                                return a + b;
                              }, 0)
                              ?.toFixed(2)
                          )}
                        </th>

                        <th scope="col" style={{ width: "250px" }}>
                          <Tooltip title={`View Energy Cost`} arrow>
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
                          <Tooltip title={`View Energy Reading`} arrow>
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
