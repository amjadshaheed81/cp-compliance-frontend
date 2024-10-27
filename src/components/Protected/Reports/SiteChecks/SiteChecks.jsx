import React, { Fragment, useEffect, useRef, useState } from "react";
import { connect } from "react-redux";
import { CSVLink } from "react-csv";
import moment from "moment";
import BreadCrumHeader from "../../../common/BreadCrumHeader/BreadCrumHeader";
import Pagination from "../../../common/Pagination/Pagination";
import Tooltip from "@mui/material/Tooltip";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { get, post, del, put } from "../../../../api";
import DatePicker from "../../../common/DatePicker";
import { Chip, CircularProgress, Grid, Autocomplete } from "@mui/material";
import { getSites } from "../../../../store/thunk/site";
import UserActionChart from "./UserActionChart";
import MonthWiseCheckChart from "./MonthWiseCheckChart";

const SiteChecks = ({ siteSelectedForGlobal, loggedInUserData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [create, setCreate] = useState(false);
  const [typeoptions, settypeoptions] = useState([]);
  const [subtypeoptions, setsubtypeoptions] = useState([]);
  const [subtypeoptions2, setsubtypeoptions2] = useState([]);
  const [catoptions, setcatoptions] = useState([]);
  const site = JSON.parse(localStorage.getItem("site"));
  const [filteredSiteChecks, setFilteredSiteChecks] = useState([]);
  const [siteChecks, setSiteChecks] = useState([]);
  const [managerList, setManagerList] = useState([]);
  const navigate = useNavigate();
  const goTo = (link) => {
    navigate(link);
  };

  useEffect(() => {
    getManagerList();
    gettypeoptions();
  }, []);

  const getManagerList = async () => {
    const data = await get(
      `/api/user/all?siteId=${siteSelectedForGlobal?.siteId}`
    );
    setManagerList(
      data?.users?.sort((a, b) => {
        if (a.name < b.name) {
          return -1; // a comes before b
        }
        if (a.name > b.name) {
          return 1; // b comes before a
        }
        return 0; // names are equal
      }) || []
    );
  };

  const [itemsPerPage] = useState(7);
  const [currentPage, setCurrentPage] = useState(1);
  const indexOfLastPreAction = currentPage * itemsPerPage;
  const indexOfFirstPreAction = indexOfLastPreAction - itemsPerPage;
  const currentSiteChecks = filteredSiteChecks.slice(
    indexOfFirstPreAction,
    indexOfLastPreAction
  );
  console.log("currentSiteChecks", currentSiteChecks);
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const gettypeoptions = async () => {
    const lovtypes = await get("/api/lov/SITE_CHECK_TYPE");
    settypeoptions(lovtypes.map((l) => l.lovValue));
  };
  const getsubtypeoptions = async () => {
    const lovtypes = await get(
      "/api/lov/SITE_CHECK_SUB_TYPE?filter1=" + formData2.type
    );
    setsubtypeoptions(lovtypes.map((l) => l.lovValue));
  };

  const getcatoptions = async () => {
    const lovtypes = await get(
      "/api/lov/SITE_CHECK_CATEGORY?filter1=" + formData.subType
    );
    setcatoptions(lovtypes.map((l) => l.lovValue));
  };

  const getsubtypeoptions2 = async () => {
    const lovtypes = await get(
      "/api/lov/SITE_CHECK_SUB_TYPE?filter1=" + formData.type
    );
    setsubtypeoptions2(lovtypes.map((l) => l.lovValue));
  };
  useEffect(() => {}, []);
  const [formData, setFormData] = useState({
    searchField: "",
    type: "",
    subType: "",
    category: "",
    status: "Open",
    startDate: "",
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
  const handleInputChange2 = (e) => {
    const { name, value } = e.target;
    setFormData2({
      ...formData2,
      [name]: value,
    });
  };

  useEffect(() => {
    searchSiteCheck();
    if (formData2.type?.length > 0) {
      getsubtypeoptions();
    } else {
      setcatoptions([]);
      setsubtypeoptions([]);
      setFormData2({
        ...formData2,
        subType: "",
      });
    }
  }, [
    formData2.type,
    formData2.searchField,
    formData2.subType,
    formData2.status,
  ]);

  useEffect(() => {
    searchSiteCheck();
    if (formData2.type?.length > 0) {
      getsubtypeoptions();
    } else {
      setcatoptions([]);
      setsubtypeoptions([]);
    }
    setFormData2({
      ...formData2,
      subType: "",
    });
  }, [formData2.type]);

  useEffect(() => {
    searchSiteCheck();
    if (formData.type?.length > 0) {
      setcatoptions([]);
      setsubtypeoptions([]);
      setsubtypeoptions2([]);
      getsubtypeoptions2();
    } else {
      setsubtypeoptions2([]);
      setsubtypeoptions([]);
      setFormData({
        ...formData,
        subType: "",
      });
    }
  }, [formData.type]);

  useEffect(() => {
    searchSiteCheck();
    if (formData.subType?.length > 0) {
      getcatoptions();
    }
  }, [formData.subType]);

  const searchSiteCheck = () => {
    let filteredSiteChecks2 = siteChecks;
    if (formData2?.type?.length > 0) {
      filteredSiteChecks2 = filteredSiteChecks2.filter(
        (sc) => sc.type === formData2.type
      );
    }
    if (formData2?.subType?.length > 0) {
      filteredSiteChecks2 = filteredSiteChecks2.filter(
        (sc) => sc.subType === formData2.subType
      );
    }
    if (formData2?.status?.length > 0) {
      filteredSiteChecks2 = filteredSiteChecks2.filter(
        (sc) => sc.status === formData2.status
      );
    }
    if (formData2?.searchField?.length > 0 && filteredSiteChecks2?.length > 0) {
      filteredSiteChecks2.forEach((s) => {
        const lead = managerList.filter((u) => u.id == s.leadUserID);
        if (lead.length > 0) {
          s.leadName =
            lead[0].role +
            " - " +
            lead[0].name +
            " (" +
            lead[0].email +
            ")" +
            (lead.companyName ? " - " + lead.companyName : "");
        }
      });
      filteredSiteChecks2 = filteredSiteChecks2.filter(
        (sc) =>
          sc?.type
            ?.toLowerCase()
            .includes(String(formData2?.searchField).toLowerCase()) ||
          sc?.subType
            ?.toLowerCase()
            .includes(String(formData2?.searchField).toLowerCase()) ||
          sc?.category
            ?.toLowerCase()
            .includes(String(formData2?.searchField).toLowerCase()) ||
          sc?.leadName
            ?.toLowerCase()
            .includes(String(formData2?.searchField).toLowerCase())
      );
    }
    setFilteredSiteChecks(filteredSiteChecks2);
  };
  useEffect(() => {
    getSiteChecks();
  }, [siteSelectedForGlobal]);

  const addSiteCheck = async (event) => {
    setIsLoading(true);
    event.preventDefault();
    const form = event.target;
    if (!form.checkValidity()) {
      setIsLoading(false);
      form.reportValidity();
    }
    const body = formData;
    body.siteId = site.siteId;
    body.dueDate = new Date(body.dueDate);
    body.startDate = new Date(body.startDate);
    const sitecheckres = await post("/api/site-check/", body);
    body.checkId = sitecheckres.checkId;
    setCalenderEvents(body);

    await getSiteChecks();
    setCreate(false);
    setIsLoading(false);
  };

  const setCalenderEvents = (body) => {
    const calenderBody = {
      siteId: siteSelectedForGlobal?.siteId,
      startDate: moment(body.startDate),
      endDate: moment(body.dueDate),
      shortText: `${body.type} ${body.subType} - ${body.category}`,
      eventType: `${body.type} ${body.subType}`,
      userId: loggedInUserData?.id,
      includeCompanyUsers: false,
      section: `/site-checks/${body.checkId}/update`,
    };
    put("/api/user/calendar", calenderBody);
    calenderBody.userId = body.assistantUserID;
    put("/api/user/calendar", calenderBody);
    calenderBody.userId = body.leadUserID;
    put("/api/user/calendar", calenderBody);
    if (
      body.repeatFrequency !== null &&
      body.repeatFrequency !== undefined &&
      body.repeatFrequency !== "" &&
      body.repeatFrequency !== "None"
    ) {
      const expiryDate = dateFormatFromFrequency(
        body.repeatFrequency,
        body.dueDate
      );
      calenderBody.userId = loggedInUserData?.id;
      calenderBody.startDate = expiryDate;
      calenderBody.endDate = expiryDate;
      calenderBody.eventType = "Expiring : " + calenderBody.eventType;
      calenderBody.shortText = "Expiring : " + calenderBody.shortText;
      put("/api/user/calendar", calenderBody);
      calenderBody.userId = body.assistantUserID;
      put("/api/user/calendar", calenderBody);
      calenderBody.userId = body.leadUserID;
      put("/api/user/calendar", calenderBody);
    }
  };

  const dateFormatFromFrequency = (repeatFrequency, date) => {
    let daysToAdd = 0;
    if (repeatFrequency === "Daily") {
      daysToAdd = 1;
    } else if (repeatFrequency === "Weekly") {
      daysToAdd = 7;
    } else if (repeatFrequency === "Monthly") {
      daysToAdd = 30;
    } else if (repeatFrequency === "Yearly") {
      daysToAdd = 365;
    }
    return moment(date, "YYYY-MM-DD").add("days", daysToAdd);
  };

  const getSiteChecks = async () => {
    if (!site?.siteId) {
      toast.error("Please select site from site search to proceed....");
      return;
    }
    setIsLoading(true);
    const siteChecks = await get("/api/site-check/site/" + site?.siteId);
    setFilteredSiteChecks(siteChecks);
    setSiteChecks(siteChecks);
    setIsLoading(false);
  };

  return (
    <Fragment>
      <div>
        <div>
          {!create && (
            <>
              <div className="">
                <div className="">
                  <div className="row" style={{ height: "auto" }}>
                    <div className="col-md-4 mt-2 mb-4">
                      <h5>Risk Scoreboard</h5>
                    </div>
                    <div className="col-md-4 mt-2 mb-4">
                      <h5>Site Checks</h5>
                      <MonthWiseCheckChart data={currentSiteChecks} />
                    </div>
                    <div className="col-md-4 mt-2 mb-4">
                      <h5>Action Log</h5>
                      <UserActionChart data={currentSiteChecks} managerList={managerList} />
                    </div>
                  </div>
                  <div className="row" style={{ height: "auto" }}>
                    <div className="col-md-3 col-sm-4 mt-2">
                      <div>
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
                          style={{ paddingLeft: "20%" }}
                          className="form-control"
                          onChange={handleInputChange2}
                        />
                      </div>
                    </div>
                    <div className="col-md-2 col-sm-4 mt-2">
                      <select
                        name="type"
                        className="form-control form-select"
                        id="type"
                        onChange={handleInputChange2}
                      >
                        <option value="">Type</option>
                        {typeoptions.map((t) => (
                          <option value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-2 col-sm-4 mt-2">
                      <select
                        name="subType"
                        className="form-control form-select"
                        id="subType"
                        disabled={formData2?.type?.length === 0}
                        onChange={handleInputChange2}
                        value={formData2?.subType}
                      >
                        <option value="">Sub Type</option>
                        {subtypeoptions.map((t) => (
                          <option value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-2 col-sm-4 mt-2">
                      <select
                        name="status"
                        className="form-control form-select"
                        id="status"
                        onChange={handleInputChange2}
                      >
                        <option value="">Status</option>
                        <option value="Open">Open</option>
                        <option value="Done">Done</option>
                      </select>
                    </div>
                    <div className="col-md-1 col-sm-4 mt-2">
                      <CSVLink
                        filename={
                          "site-checks-list_" +
                          moment(new Date()).format("DD-MM-YYYY") +
                          ".csv"
                        }
                        className="btn btn-light bg-white text-primary"
                        data={filteredSiteChecks}
                      >
                        <Tooltip title={`Export`} arrow>
                          <i className="fas fa-download"></i>
                        </Tooltip>
                      </CSVLink>
                    </div>
                  </div>
                </div>
              </div>

              <div className="row p-2"></div>
              <div className="col-md-12 table-responsive">
                <table className="table">
                  <thead className="table-dark">
                    <tr>
                      <th scope="col">Type</th>
                      <th scope="col">Sub-Type</th>
                      <th scope="col">Summary</th>
                      <th scope="col">Lead</th>
                      <th scope="col">Risk Score</th>
                      <th scope="col">Date</th>
                      <th scope="col">Status</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!isLoading && filteredSiteChecks?.length === 0 && (
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
                      currentSiteChecks?.map((action) => {
                        let leanName = "-";
                        const lead = managerList.filter(
                          (u) => u.id == action.leadUserID
                        );
                        if (lead.length > 0) {
                          leanName =
                            lead[0].role +
                            " - " +
                            lead[0].name +
                            " (" +
                            lead[0].email +
                            ")" +
                            (lead.companyName ? " - " + lead.companyName : "");
                        }
                        return (
                          <tr key={action?.id}>
                            <th scope="col">{action?.type}</th>
                            <th scope="col">{action?.subType}</th>
                            <th scope="col">{action?.category}</th>
                            <th scope="col" style={{ width: "250px" }}>
                              {leanName}
                            </th>
                            <th scope="col" style={{ width: "200px" }}>
                              <span className="badge bg-danger p-2 m-1 risk-span">
                                {action?.riskScoreRed ?? 0}
                              </span>
                              <span className="badge bg-warning p-2 m-1 risk-span">
                                {action?.riskScoreAmber ?? 0}
                              </span>
                              <span className="badge bg-info p-2 m-1 risk-span">
                                {action?.riskScoreYellow ?? 0}
                              </span>
                              <span className="badge bg-success p-2 m-1 risk-span">
                                {action?.riskScoreGreen ?? 0}
                              </span>
                            </th>
                            <th scope="col" style={{ width: "150px" }}>
                              {moment(action?.dueDate).format("DD-MM-YYYY")}
                            </th>
                            <th scope="col">
                              <Chip
                                color={
                                  action?.status === "Done"
                                    ? "success"
                                    : "warning"
                                }
                                label={action?.status}
                              />
                            </th>
                            <th scope="col" style={{ width: "250px" }}>
                              <Tooltip title={`View ${action?.type}`} arrow>
                                <button
                                  className="btn btn-sm btn-light"
                                  onClick={() => {
                                    navigate(
                                      `/site-checks/${action?.checkId}/update`
                                    );
                                  }}
                                >
                                  <i className="fas fa-eye"></i>
                                </button>{" "}
                              </Tooltip>
                            </th>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
                <Pagination
                  totalPages={Math.ceil(
                    filteredSiteChecks.length / itemsPerPage
                  )}
                  currentPage={currentPage}
                  onPageChange={handlePageChange}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </Fragment>
  );
};

const mapStateToProps = (state) => ({
  sites: state.site.sites,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
  loggedInUserData: state.site.loggedInUserData,
});
export default connect(mapStateToProps, { getSites })(SiteChecks);
