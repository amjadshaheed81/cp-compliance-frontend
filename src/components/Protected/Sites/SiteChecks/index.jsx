import React, { Fragment, useEffect, useRef, useState } from "react";
import { connect } from "react-redux";
import { CSVLink } from "react-csv";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import moment from "moment";
import { ROLE } from "../../../../Constant/Role";
import Header from "../../../common/Header/Header";
import BreadCrumHeader from "../../../common/BreadCrumHeader/BreadCrumHeader";
import Pagination from "../../../common/Pagination/Pagination";
import SidebarNew from "../../../common/Sidebar/SidebarNew";
import Tooltip from "@mui/material/Tooltip";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { get, post, del, put } from "../../../../api";
import DatePicker from "../../../common/DatePicker";

import {
  Button,
  Modal,
  Chip,
  CircularProgress,
  Box,
  Grid,
  InputAdornment,
  Autocomplete,
  TextField,
} from "@mui/material";
import { getSites } from "../../../../store/thunk/site";

const SiteChecks = ({ siteSelectedForGlobal, loggedInUserData }) => {
  const datePickerRef = useRef(null);
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
    setManagerList(data?.users?.sort((a, b) => {
      if (a.name < b.name) {
          return -1; // a comes before b
      }
      if (a.name > b.name) {
          return 1;  // b comes before a
      }
      return 0; // names are equal
  }) || []);
  };

  const [itemsPerPage] = useState(7);
  const [currentPage, setCurrentPage] = useState(1);
  const indexOfLastPreAction = currentPage * itemsPerPage;
  const indexOfFirstPreAction = indexOfLastPreAction - itemsPerPage;
  const currentSiteChecks = filteredSiteChecks.slice(
    indexOfFirstPreAction,
    indexOfLastPreAction
  );
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
    setsubtypeoptions(
      lovtypes
        .map((l) => l.lovValue)
        ?.sort((a, b) => {
          if (a < b) {
            return -1; // a comes before b
          }
          if (a > b) {
            return 1; // b comes before a
          }
          return 0; // type are equal
        })
    );
  };

  const getcatoptions = async () => {
    const lovtypes = await get(
      "/api/lov/SITE_CHECK_CATEGORY?filter1=" + formData.subType
    );
    setcatoptions(
      lovtypes
        .map((l) => l.lovValue)
        ?.sort((a, b) => {
          if (a < b) {
            return -1; // a comes before b
          }
          if (a > b) {
            return 1; // b comes before a
          }
          return 0; // type are equal
        })
    );
  };

  const getsubtypeoptions2 = async () => {
    const lovtypes = await get(
      "/api/lov/SITE_CHECK_SUB_TYPE?filter1=" + formData.type
    );
    setsubtypeoptions2(
      lovtypes
        .map((l) => l.lovValue)
        ?.sort((a, b) => {
          if (a < b) {
            return -1; // a comes before b
          }
          if (a > b) {
            return 1; // b comes before a
          }
          return 0; // type are equal
        })
    );
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
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "dueDate" && isDateOlderThanToday(value)) {
      toast.error("Date cannot be older than today");
      return;
    }
    let dueDateValue = formData?.dueDate;
    if (name === "repeatFrequency") {
      // If repeatFrequency is set and dueDate is not provided
      const startDate = new Date(formData?.startDate);

      switch (value) {
        case "Daily":
          dueDateValue = new Date(startDate.setDate(startDate.getDate() + 1));
          break;
        case "Weekly":
          dueDateValue = new Date(startDate.setDate(startDate.getDate() + 7));
          break;
        case "Monthly":
          dueDateValue = new Date(startDate.setMonth(startDate.getMonth() + 1));
          break;
        case "Yearly":
          dueDateValue = new Date(
            startDate.setFullYear(startDate.getFullYear() + 1)
          );
          break;
        default:
          dueDateValue = new Date(startDate);
          break;
      }

      dueDateValue = dueDateValue.toISOString(); // Convert to ISO string
      setFormData({
        ...formData,
        [name]: value,
        dueDate: dueDateValue,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
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
    //const searchField = formData?.searchField;
    //const status = formData?.status;
    //if (searchField || status) {
    //   const list = users?.filter(
    //     (x) =>
    //       String(x?.name)
    //         .toLowerCase()
    //         .includes(String(searchField).toLowerCase()) &&
    //       String(x?.role).toLowerCase().includes(String(role).toLowerCase()) &&
    //       String(x?.defaultSiteName)
    //         .toLowerCase()
    //         .includes(String(site).toLowerCase()) &&
    //       String(x?.status).toLowerCase().includes(String(status).toLowerCase())
    //   );
    //   setFilteredUser(list);
    //} else {
    //   setFilteredUser(users);
    //}
  };
  const copyData = (action) => {
    setFormData({
      type: action.type,
      subType: action.subType,
      category: action.category,
      dueDate: action.dueDate,
      startDate: action.startDate,
      leadUserID: action.leadUserID,
      assistantUserID: action.assistantUserID,
      repeatFrequency: action.repeatFrequency,
    });
    setCreate(true);
  };

  const deleteSiteCheckCall = (action) => {
    Swal.fire({
      title: `Do you want to delete ${action?.type} site check?`,
      showDenyButton: false,
      showCancelButton: true,
      confirmButtonText: "Delete",
    }).then(async (result) => {
      if (result.isConfirmed) {
        setIsLoading(true);
        await del("/api/site-check/check-id/" + action.checkId);
        getSiteChecks();
        // if (res === "Success") {
        //   toast.success(`${user?.name} user has been deleted successully`);
        //   getUsers();
        // } else {
        //   toast.error(
        //     `Something went wrong while deleting user. Please try again.`
        //   );
        // }
      } else if (result.isDenied) {
        toast.info(`delete action has been denied.`);
      }
    });
  };

  const markAsDone = (action) => {
    Swal.fire({
      title: `Do you want to close ${action?.type}?`,
      showDenyButton: false,
      showCancelButton: true,
      confirmButtonText: "Confirm",
    }).then(async (result) => {
      if (result.isConfirmed) {
        setIsLoading(true);
        action.status = "Done";
        await put("/api/site-check/" + action.checkId, action);
        getSiteChecks();
        // if (res === "Success") {
        //   toast.success(`${user?.name} user has been deleted successully`);
        //   getUsers();
        // } else {
        //   toast.error(
        //     `Something went wrong while deleting user. Please try again.`
        //   );
        // }
      } else if (result.isDenied) {
        toast.info(`delete action has been denied.`);
      }
    });
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
    if(body?.type === "Assessment") {
      body.category = body.subType;
    }
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
      section: `/site-checks/${body.checkId}/update`
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
      <SidebarNew />

      <div className="content">
        <Header />
        <div className="container-fluid">
          {!create && (
            <>
              <BreadCrumHeader header={"Site Check"} page={"Site Inspection"} />

              <div className="">
                <div className="">
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
                    <div className="col-md-2 col-sm-4 mt-2">
                      {(loggedInUserData?.role === ROLE.MANAGER ||
                        loggedInUserData?.role === ROLE.ADMIN) && (
                        <button
                          style={{ width: "150px" }}
                          className="btn btn-primary text-white pr-2"
                          onClick={() => {
                            setCreate(true);
                            setFormData({
                              searchField: "",
                              type: "",
                              subType: "",
                              category: "",
                              status: "Open",
                            });
                          }}
                        >
                          Start New
                        </button>
                      )}
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
                              <Tooltip title={`${action?.type} Copy As`} arrow>
                                <button
                                  className="btn btn-sm btn-light"
                                  onClick={() => {
                                    copyData(action);
                                  }}
                                >
                                  <i class="fas fa-regular fa-copy cursor"></i>{" "}
                                </button>{" "}
                              </Tooltip>
                              <Tooltip
                                title={`${action?.type} mark as closed`}
                                arrow
                              >
                                <button
                                  className="btn btn-sm btn-light"
                                  onClick={() => markAsDone(action)}
                                  disabled={action.status === "Done"}
                                >
                                  <i class="fas fa-regular fa-thumbs-up cursor"></i>{" "}
                                </button>{" "}
                              </Tooltip>
                              <Tooltip title={`Delete ${action?.type}`} arrow>
                                <button
                                  className="btn btn-sm btn-light text-dark"
                                  onClick={() => deleteSiteCheckCall(action)}
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
                {/* <nav aria-label="pagination">
                <ul className="pagination justify-content-center">
                  <li className={`page-item`} style={{ marginRight: '20px' }}>
                    <button className="page-link" onClick={() => handlePageChange(1)}>
                      <i className="fas fa-arrow-left" />
                    </button>
                  </li>
                  {Array.from({ length: Math.ceil(filteredSiteChecks.length / itemsPerPage) }, (_, index) => (
                    <li key={index} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                   
                      <button className="page-link" onClick={() => handlePageChange(1)}>
                        {index + 1}
                      </button>
                    </li>
                    
                  ))}
                  <li className={`page-item `} style={{marginLeft: '20px'}}>
                    <button className="page-link" onClick={() => handlePageChange(1)}>
                      <i className="fas fa-arrow-right" />
                    </button>
                  </li>
                </ul>
                </nav> */}
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
          {create && (
            <div>
              <form onSubmit={addSiteCheck}>
                <BreadCrumHeader header={"Site Check - New"} page={"New"} />
                <Grid container>
                  <Grid sm={4}>
                    <div style={{ margin: "10px" }}>
                      <label htmlFor="folder" name="folder">
                        Type
                      </label>
                      <select
                        required
                        name="type"
                        value={formData?.type}
                        className="form-control form-select"
                        id="type"
                        onChange={handleInputChange}
                      >
                        <option value="">Select Type</option>
                        {typeoptions.map((t) => (
                          <option value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </Grid>
                  <Grid sm={4}>
                    <div style={{ margin: "10px" }}>
                      <label htmlFor="folder" name="folder">
                        Sub Type
                      </label>
                      <select
                        required
                        name="subType"
                        value={formData?.subType}
                        className="form-control form-select"
                        disabled={formData?.type?.length === 0}
                        id="subType"
                        onChange={handleInputChange}
                      >
                        <option value="">Select Sub Type</option>
                        {subtypeoptions2.map((t) => (
                          <option value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </Grid>
                  {formData?.type !== "Assessment" && (
                    <Grid sm={4}>
                      <div style={{ margin: "10px" }}>
                        <label htmlFor="category" name="category">
                          Category
                        </label>
                        <select
                          required
                          name="category"
                          value={formData?.category}
                          disabled={formData?.subType?.length === 0}
                          className="form-control form-select"
                          id="category"
                          onChange={handleInputChange}
                        >
                          <option value="">Select Category</option>
                          {catoptions.map((t) => (
                            <option value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </Grid>
                  )}
                  <Grid sm={4}>
                    <div style={{ margin: "10px" }}>
                      <DatePicker
                        label="Start Date"
                        value={formData?.startDate}
                        onChange={(date) => {
                          let dueDateValue = formData?.dueDate;
                          const repeatFrequency = formData?.repeatFrequency;

                          // If repeatFrequency is set and dueDate is not provided
                          if (repeatFrequency) {
                            const startDate = new Date(date);

                            switch (repeatFrequency) {
                              case "Daily":
                                dueDateValue = new Date(
                                  startDate.setDate(startDate.getDate() + 1)
                                );
                                break;
                              case "Weekly":
                                dueDateValue = new Date(
                                  startDate.setDate(startDate.getDate() + 7)
                                );
                                break;
                              case "Monthly":
                                dueDateValue = new Date(
                                  startDate.setMonth(startDate.getMonth() + 1)
                                );
                                break;
                              case "Yearly":
                                dueDateValue = new Date(
                                  startDate.setFullYear(
                                    startDate.getFullYear() + 1
                                  )
                                );
                                break;
                              default:
                                break;
                            }

                            dueDateValue = dueDateValue.toISOString(); // Convert to ISO string
                          }

                          setFormData({
                            ...formData,
                            dueDate: dueDateValue, // Set the calculated dueDate
                            startDate: new Date(
                              date.getTime() - date.getTimezoneOffset() * 60000
                            ).toISOString(),
                          });
                        }}
                      />
                    </div>
                  </Grid>
                  <Grid sm={4}>
                    <div style={{ margin: "10px" }}>
                      <DatePicker
                        label="Due Date"
                        value={formData?.dueDate}
                        onChange={(date) => {
                          setFormData({
                            ...formData,
                            dueDate: new Date(
                              date.getTime() - date.getTimezoneOffset() * 60000
                            ).toISOString(),
                          });
                        }}
                      />
                    </div>
                  </Grid>
                  <Grid sm={4}>
                    <div style={{ margin: "10px" }}>
                      <label htmlFor="lead">Lead</label>
                      <Autocomplete
                        id="leadUserID"
                        onChange={(event, item) => {
                          const uformData = { ...formData };
                          uformData.leadUserID = item?.key;
                          setFormData(uformData);
                        }}
                        value={
                          managerList
                            .filter(
                              (o) =>
                                String(o.id) === String(formData?.leadUserID)
                            )
                            .map((option) => {
                              return {
                                key: option.id,
                                label:
                                  option.role +
                                  " - " +
                                  option.name +
                                  " (" +
                                  option.email +
                                  ")" +
                                  (option.companyName
                                    ? " - " + option.companyName
                                    : ""),
                              };
                            })[0]
                        }
                        options={managerList.map((option) => {
                          return {
                            key: option.id,
                            label:
                              option.role +
                              " - " +
                              option.name +
                              " (" +
                              option.email +
                              ")" +
                              (option.companyName
                                ? " - " + option.companyName
                                : ""),
                          };
                        })}
                        getOptionLabel={(option) => option.label}
                        renderInput={(params) => (
                          <div ref={params.InputProps.ref}>
                            <input
                              type="text"
                              {...params.inputProps}
                              required
                              className="form-control"
                              placeholder="Select Lead"
                            />
                          </div>
                        )}
                      />
                    </div>
                  </Grid>
                  <Grid sm={4}>
                    <div style={{ margin: "10px" }}>
                      <label htmlFor="assistantUserID">Assistant</label>
                      <Autocomplete
                        id="assistantUserID"
                        value={
                          managerList
                            .filter(
                              (o) =>
                                String(o.id) ===
                                String(formData?.assistantUserID)
                            )
                            .map((option) => {
                              return {
                                key: option.id,
                                label:
                                  option.role +
                                  " - " +
                                  option.name +
                                  " (" +
                                  option.email +
                                  ")" +
                                  (option.companyName
                                    ? " - " + option.companyName
                                    : ""),
                              };
                            })[0]
                        }
                        onChange={(event, item) => {
                          const uformData = { ...formData };
                          uformData.assistantUserID = item?.key;
                          setFormData(uformData);
                        }}
                        options={managerList.map((option) => {
                          return {
                            key: option.id,
                            label:
                              option.role +
                              " - " +
                              option.name +
                              " (" +
                              option.email +
                              ")" +
                              (option.companyName
                                ? " - " + option.companyName
                                : ""),
                          };
                        })}
                        getOptionLabel={(option) => option.label}
                        renderInput={(params) => (
                          <div ref={params.InputProps.ref}>
                            <input
                              type="text"
                              {...params.inputProps}
                              required
                              className="form-control"
                              placeholder="Select Assistant"
                            />
                          </div>
                        )}
                      />
                    </div>
                  </Grid>

                  <Grid sm={4}>
                    {(formData.type === "Audit" ||
                      (formData.type === "Survey" &&
                        formData.subType === "Water")) && (
                      <div style={{ margin: "10px" }}>
                        <label htmlFor="folder" name="folder">
                          Repeats
                        </label>
                        <select
                          name="repeatFrequency"
                          className="form-control form-select"
                          id="repeatFrequency"
                          onChange={handleInputChange}
                          value={formData?.repeatFrequency}
                        >
                          <option value="None">None</option>
                          <option value="Daily">Daily</option>
                          <option value="Weekly">Weekly</option>
                          <option value="Monthly">Monthly</option>
                          <option value="Yearly">Yearly</option>
                        </select>
                      </div>
                    )}
                  </Grid>
                  <Grid sm={4}></Grid>
                  <Grid sm={4}></Grid>
                  <hr />
                  <Grid sm={4}></Grid>
                  <Grid sm={4}></Grid>
                  <Grid sm={12}>
                    {isLoading && <CircularProgress />}
                    {!isLoading && (
                      <>
                        <button
                          style={{
                            width: "150px",
                            marginBottom: "20px",
                            margin: "10px",
                            float: "right",
                          }}
                          className="btn btn-primary text-white pr-2"
                          //onClick={() => { addSiteCheck() }}
                          type="submit"
                        >
                          Save & Continue
                        </button>
                        <button
                          style={{
                            width: "150px",
                            marginBottom: "20px",
                            margin: "10px",
                            float: "right",
                          }}
                          className="btn btn-primary btn-light"
                          onClick={() => {
                            setCreate(false);
                          }}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </Grid>
                </Grid>
              </form>
            </div>
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
