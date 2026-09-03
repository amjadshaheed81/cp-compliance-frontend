import React, { Fragment, useEffect, useRef, useState } from "react";
import { connect } from "react-redux";
import { CSVLink } from "react-csv";
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
import { getSites, getSiteCheckUserOptions } from "../../../../store/thunk/site";
import { getSiteCheckDueDate } from "../../../../utils/getSiteCheckDueDate";
import { calculateSiteCheckDueDateTime, calculateSiteCheckDueDate } from "../../../../utils/siteCheckRecurrence";

const SiteChecks = ({
  siteSelectedForGlobal,
  loggedInUserData,
  siteCheckUserOptions,
  getSiteCheckUserOptions,
}) => {
  const datePickerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [create, setCreate] = useState(false);
  const [typeoptions, settypeoptions] = useState([]);
  const [subtypeoptions, setsubtypeoptions] = useState([]);
  const [subtypeoptions2, setsubtypeoptions2] = useState([]);
  const [catoptions, setcatoptions] = useState([]);
  const [filterCatOptions, setFilterCatOptions] = useState([]);
  const [siteCheckLovOptions, setSiteCheckLovOptions] = useState({
    subTypes: [],
    categories: [],
  });
  const [filteredSiteChecks, setFilteredSiteChecks] = useState([]);
  const [siteChecks, setSiteChecks] = useState([]);
  const [assetIdMap, setAssetIdMap] = useState({});

  const navigate = useNavigate();
  const goTo = (link) => {
    navigate(link);
  };

  useEffect(() => {
    gettypeoptions();
  }, []);

  useEffect(() => {
    const siteId = siteSelectedForGlobal?.siteId;
    if (!siteId) return undefined;

    getSiteCheckUserOptions(siteId);

    const refreshTimer = window.setInterval(() => {
      getSiteCheckUserOptions(siteId, true);
    }, 60 * 60 * 1000);

    return () => window.clearInterval(refreshTimer);
  }, [siteSelectedForGlobal?.siteId, getSiteCheckUserOptions]);

  const managerList =
    Number(siteCheckUserOptions?.siteId) ===
    Number(siteSelectedForGlobal?.siteId)
      ? siteCheckUserOptions?.siteUsers || []
      : [];

  const [itemsPerPage] = useState(7);
  const [currentPage, setCurrentPage] = useState(1);
  const indexOfLastPreAction = currentPage * itemsPerPage;
  const indexOfFirstPreAction = indexOfLastPreAction - itemsPerPage;
  const currentSiteChecks = filteredSiteChecks?.slice(
    indexOfFirstPreAction,
    indexOfLastPreAction
  );
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const sortLovValues = (lovs = []) =>
    lovs
      .map((l) => l.lovValue)
      .sort((a, b) => {
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
      });

  const gettypeoptions = async () => {
    const lookups = await get("/api/lov/site-check-options");
    settypeoptions(lookups?.types?.map((l) => l.lovValue) || []);
    setSiteCheckLovOptions({
      subTypes: lookups?.subTypes || [],
      categories: lookups?.categories || [],
    });
  };

  const getsubtypeoptions = () => {
    const lovtypes = siteCheckLovOptions.subTypes.filter(
      (l) => l.attribite1 === formData2.type
    );
    setsubtypeoptions(sortLovValues(lovtypes));
  };

  const getcatoptions = () => {
    const lovtypes = siteCheckLovOptions.categories.filter(
      (l) => l.attribite1 === formData.subType
    );
    const filteredCategories =
      formData.subType === "Emergency Lighting to meet BS5266"
        ? lovtypes.filter(
            (l) =>
              l.lovValue !==
              "Emergency Lighting (systems less than 3 years old) 6 monthly 1 hour discharge testing"
          )
        : lovtypes;
    setcatoptions(sortLovValues(filteredCategories));
  };

  const getFilterCatOptions = () => {
    const lovtypes = siteCheckLovOptions.categories.filter(
      (l) => l.attribite1 === formData2.subType
    );
    const filteredCategories =
      formData2.subType === "Emergency Lighting to meet BS5266"
        ? lovtypes.filter(
            (l) =>
              l.lovValue !==
              "Emergency Lighting (systems less than 3 years old) 6 monthly 1 hour discharge testing"
          )
        : lovtypes;
    setFilterCatOptions(sortLovValues(filteredCategories));
  };

  const getsubtypeoptions2 = () => {
    const lovtypes = siteCheckLovOptions.subTypes.filter(
      (l) => l.attribite1 === formData.type
    );
    setsubtypeoptions2(sortLovValues(lovtypes));
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
      // Start New provides an estimate from the planned Start Date. The final
      // submitted inspection will replace this with a due date calculated from
      // the actual Inspection Date entered in the form.
      dueDateValue = formData?.startDate
        ? calculateSiteCheckDueDateTime(formData.startDate, value)
        : "";

      setFormData({
        ...formData,
        [name]: value,
        dueDate: dueDateValue || "",
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
      setFilterCatOptions([]);
      setcatoptions([]);
      setsubtypeoptions([]);
      setFormData2({
        ...formData2,
        subType: "",
        category: "",
      });
    }
  }, [
    formData2.type,
    formData2.searchField,
    formData2.subType,
    formData2.status,
    formData2.category,
  ]);

  useEffect(() => {
    searchSiteCheck();
    if (formData2.subType?.length > 0) {
      getFilterCatOptions();
    } else {
      setFilterCatOptions([]);
      setFormData2({
        ...formData2,
        category: "",
      });
    }
  }, [formData2.subType]);

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
    if (formData2?.category?.length > 0) {
      filteredSiteChecks2 = filteredSiteChecks2.filter(
        (sc) => sc.category === formData2.category
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

    if (!formData.startDate) {
      toast.error("Start Date is required!");
      setIsLoading(false);
      return;
    }
    if (!form.checkValidity()) {
      setIsLoading(false);
      form.reportValidity();
    }
    const body = formData;
    if (body?.type === "Assessment") {
      body.category = body.subType;
    }
    if (!siteSelectedForGlobal?.siteId) {
      toast.error("Please select site from site search to proceed....");
      setIsLoading(false);
      return;
    }
    body.siteId = siteSelectedForGlobal.siteId;
    body.dueDate = body?.dueDate ? new Date(body.dueDate) : "";
    body.startDate = body?.startDate ? new Date(body.startDate) : "";
    const sitecheckres = await post("/api/site-check/", body);
    body.checkId = sitecheckres?.data?.checkId;
    if (body.startDate) {
      setCalenderEvents(body);
    }
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
    const nextDate = calculateSiteCheckDueDate(date, repeatFrequency);
    return nextDate ? moment(nextDate, "YYYY-MM-DD") : moment(date);
  };

  const getSiteChecks = async () => {
    if (!siteSelectedForGlobal?.siteId) {
      toast.error("Please select site from site search to proceed....");
      return;
    }
    setIsLoading(true);

    try {
      // The grid endpoint returns the existing Site Check row shape plus a
      // separate Asset ID map, removing the previous per-row inspection calls.
      const gridData = await get(
        "/api/site-check/site/" + siteSelectedForGlobal.siteId + "/grid"
      );

      const siteChecks = gridData?.siteChecks || [];
      const newAssetIdMap = gridData?.assetIdMap || {};

      setAssetIdMap(newAssetIdMap);

      // Preserve the existing grid ordering:
      // 1. Checks with asset IDs (numeric ascending)
      // 2. Checks without asset IDs (subType -> category alphabetically)
      const safeSubType = (v) => (v || "").toString();
      const safeCategory = (v) => (v || "").toString();
      const sortedSiteChecks = [...siteChecks].sort((a, b) => {
        const aAssetId = newAssetIdMap[a.checkId];
        const bAssetId = newAssetIdMap[b.checkId];

        if (aAssetId && bAssetId) {
          return parseInt(aAssetId) - parseInt(bAssetId);
        }

        if (aAssetId) return -1;
        if (bAssetId) return 1;

        const subTypeCompare = safeSubType(a.subType).localeCompare(
          safeSubType(b.subType)
        );
        if (subTypeCompare !== 0) return subTypeCompare;

        return safeCategory(a.category).localeCompare(safeCategory(b.category));
      });

      setFilteredSiteChecks(sortedSiteChecks);
      setSiteChecks(sortedSiteChecks);
    } catch (error) {
      console.error("Error fetching site checks:", error);
      toast.error("Failed to load site checks");
    } finally {
      setIsLoading(false);
    }
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
                          autoComplete="off"
                          readOnly
                          onFocus={(e) => e.target.removeAttribute("readonly")}
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
                        {typeoptions?.map((t) => (
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
                        {subtypeoptions?.map((t) => (
                          <option value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-2 col-sm-4 mt-2">
                      <select
                        name="category"
                        className="form-control form-select"
                        id="category"
                        disabled={formData2?.subType?.length === 0}
                        onChange={handleInputChange2}
                        value={formData2?.category}
                      >
                        <option value="">Category</option>
                        {filterCatOptions?.map((t) => (
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
                      <th scope="col">Assets Id</th>
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
                            <th scope="col">
                              {assetIdMap[action.checkId]
                                ? parseInt(assetIdMap[action.checkId]) // Display as number to show proper ordering
                                : '-'}
                            </th>
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
                            <th scope="col" style={{ width: "170px" }}>
                              <Tooltip
                                title={`Frequency: ${action?.repeatFrequency || "Not set"}`}
                                arrow
                              >
                                <span className="d-inline-flex align-items-center gap-2">
                                  <span
                                    className={`badge ${
                                      action?.status === "Open"
                                        ? "bg-warning text-dark"
                                        : "bg-light text-primary border border-primary"
                                    }`}
                                  >
                                    {action?.status === "Open" ? "Start" : "Due"}
                                  </span>
                                  <span>
                                    {action?.status === "Open"
                                      ? action?.startDate
                                        ? moment(action?.startDate).format("DD-MM-YYYY")
                                        : "-"
                                      : action?.dueDate
                                      ? moment(action?.dueDate).format("DD-MM-YYYY")
                                      : getSiteCheckDueDate(action)}
                                  </span>
                                </span>
                              </Tooltip>
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
                                  <i className="fas fa-eye" />|
                                  <i className="fas fa-pen" />
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
                        {typeoptions?.map((t) => (
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
                        {subtypeoptions2?.map((t) => (
                          <option value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </Grid>
                  {formData?.type !== "Assessment" &&
                    formData?.type !== "Audit" && (
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
                            {catoptions?.map((t) => (
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
                          // Handle null/undefined date (when cleared)
                          if (!date) {
                            setFormData({
                              ...formData,
                              startDate: null,
                              dueDate: null,
                            });
                            return;
                          }

                          let dueDateValue = formData?.dueDate;
                          const repeatFrequency = formData?.repeatFrequency;

                          if (repeatFrequency) {
                            dueDateValue =
                              calculateSiteCheckDueDateTime(date, repeatFrequency) || "";
                          }

                          setFormData({
                            ...formData,
                            dueDate: dueDateValue, // Set the calculated dueDate
                            startDate: date
                              ? new Date(
                                  date.getTime() -
                                    date.getTimezoneOffset() * 60000
                                ).toISOString()
                              : "",
                          });
                        }}
                      />
                    </div>
                  </Grid>
                  <Grid sm={4}>
                    {/* <div style={{ margin: "10px" }}>
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
                    </div> */}
                  </Grid>
                  {formData?.category !== "Air Conditioning F-Gas Report" && (
                    <>
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
                                  autoComplete="off"
                                  readOnly
                                  onFocus={(e) =>
                                    e.target.removeAttribute("readonly")
                                  }
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
                            options={managerList?.map((option) => {
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
                                  autoComplete="off"
                                  readOnly
                                  onFocus={(e) =>
                                    e.target.removeAttribute("readonly")
                                  }
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
                    </>
                  )}

                  <Grid sm={4}>
                    {(formData.type === "Audit" ||
                      (formData.type === "Survey" &&
                        formData.subType === "Water") ||
                      formData.type === "Inspection") && (
                      <div style={{ margin: "10px" }}>
                        <label htmlFor="folder" name="folder">
                          Repeats
                        </label>
                        <select
                          name="repeatFrequency"
                          className="form-control form-select"
                          id="repeatFrequency"
                          onChange={handleInputChange}
                          disabled={!formData?.startDate}
                          value={formData?.repeatFrequency}
                        >
                          <option value="None">None</option>
                          <option value="Daily">Daily</option>
                          <option value="Weekly">Weekly</option>
                          <option value="Monthly">Monthly</option>
                          <option value="6-Monthly">6 Monthly</option>
                          <option value="Yearly">Yearly</option>
                        </select>
                      </div>
                    )}
                  </Grid>
                  <Grid sm={4}>
                    {formData?.startDate &&
                      formData?.repeatFrequency &&
                      formData.repeatFrequency !== "None" &&
                      formData?.dueDate && (
                        <div style={{ margin: "10px" }}>
                          <label htmlFor="estimatedNextDue">
                            Estimated Next Due
                          </label>
                          <input
                            id="estimatedNextDue"
                            type="text"
                            className="form-control"
                            value={moment(formData.dueDate).format("DD/MM/YYYY")}
                            readOnly
                          />
                        </div>
                      )}
                  </Grid>
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
  siteCheckUserOptions: state.site.siteCheckUserOptions,
});
export default connect(mapStateToProps, {
  getSites,
  getSiteCheckUserOptions,
})(SiteChecks);
