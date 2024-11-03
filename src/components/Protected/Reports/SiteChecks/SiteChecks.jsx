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
import {
  Chip,
  CircularProgress,
  Grid,
  Autocomplete,
  Switch,
} from "@mui/material";
import { getSites } from "../../../../store/thunk/site";
import UserActionChart from "./UserActionChart";
import MonthWiseCheckChart from "./MonthWiseCheckChart";
import TotalAction from "./TotalAction";

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
  const [checked, setChecked] = useState(true);
  const goTo = (link) => {
    navigate(link);
  };

  useEffect(() => {
    getManagerList();
    gettypeoptions();
  }, []);
  const handleChange = (event) => {
    setChecked(event.target.checked);
    if (event.target.checked) {
      getSiteChecks(false);
    } else {
      getSiteChecks(true);
    }
  };
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

  const getSiteChecks = async (isAll) => {
    if (!site?.siteId) {
      toast.error("Please select site from site search to proceed....");
      return;
    }
    setIsLoading(true);
    const siteChecks = isAll
      ? await get("/api/site-check/all")
      : await get("/api/site-check/site/" + site?.siteId);
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
                    <div className="col-md-3 col-sm-4 mt-2">
                      <label>All</label>
                      <Switch
                        checked={checked}
                        onChange={handleChange}
                        inputProps={{ "aria-label": "controlled" }}
                      />
                      <label>Individual Site</label>
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
                  </div>
                  <div className="row" style={{ height: "auto" }}>
                    <div className="col-md-6 mt-2 mb-4">
                      <h5>Total Actions</h5>
                      <TotalAction
                        data={currentSiteChecks}
                        managerList={managerList}
                      />
                    </div>
                    <div className="col-md-6 mt-2 mb-4">
                      <h5>Site Checks</h5>
                      <MonthWiseCheckChart data={currentSiteChecks} />
                    </div>
                    <div className="col-md-6 mt-2 mb-4">
                      <h5>Action Log</h5>
                      <UserActionChart
                        data={currentSiteChecks}
                        managerList={managerList}
                      />
                    </div>
                  </div>
                </div>
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
