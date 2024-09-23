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
  Box,
  Grid,
  Divider,
  Autocomplete,
  TextField,
  Typography,
} from "@mui/material";
import { getSites } from "../../../../store/thunk/site";
import { isManagerAdminLogin } from "../../../../utils/isManagerAdminLogin";

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
  const site = JSON.parse(localStorage.getItem("site"));
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

  const [itemsPerPage] = useState(7);
  const [currentPage, setCurrentPage] = useState(1);
  const [bulkCategory, setBulkCategory] = useState();
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

  const getEnergyCost = async () => {
    if (!site?.siteId) {
      toast.error("Please select site from site search to proceed....");
      return;
    }
    setIsLoading(true);
    const energyCost = await get("/api/energy/site/survey/" + site?.siteId);
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
                  {typeoptions.map((t) => (
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

      <SidebarNew />

      <div className="content">
        <Header />
        <div className="container-fluid">
          <BreadCrumHeader
            header={"Site Energy Readings & Cost"}
            page={"Energy"}
          />

          <div className="d-flex bd-highlight" style={{flexWrap: 'wrap'}}>
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
                    {typeoptions.map((t) => (
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
                          {typeoptions.map((t) => (
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
                          {action?.readingList?.[
                            action?.readingList?.length - 1
                          ]?.readingValue ?? "-"}{" "}
                          {
                            action?.readingList?.[
                              action?.readingList?.length - 1
                            ]?.readingUnit
                          }
                        </th>
                        <th scope="col">
                          £
                          {action?.costList
                            ?.map((c) => c.cost)
                            .reduce((a, b) => {
                              return a + b;
                            }, 0)}
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
