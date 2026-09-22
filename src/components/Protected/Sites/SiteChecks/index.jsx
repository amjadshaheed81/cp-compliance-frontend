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
import { useLocation, useNavigate } from "react-router-dom";
import {
  get,
  post,
  del,
  put,
  SITE_CHECK_DATA_CHANGED_EVENT,
} from "../../../../api";
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
import SiteCheckTestLauncher from "./SiteCheckTestLauncher";
import SiteCheckWorkspace from "./SiteCheckWorkspace";
import {
  SITE_CHECK_DEFAULT_PAGE_SIZE,
  SITE_CHECK_PAGE_SIZE_OPTIONS,
  SITE_CHECK_WORKSPACE_ENABLED,
} from "./siteCheckUiConfig";

// Developer-only Site Check test launcher. Keep hidden for every other account.
const SITE_CHECK_TEST_LAUNCHER_EMAIL = "amjad.shaheed81@gmail.com";

const SITE_CHECK_GRID_STATE_KEY_PREFIX = "cafm.siteChecks.gridState";
const SITE_CHECK_PAGE_SIZE_KEY = "cafm.siteChecks.pageSize";

const getSiteCheckGridStateKey = (siteId) =>
  `${SITE_CHECK_GRID_STATE_KEY_PREFIX}.${siteId}`;

const readStoredPageSize = () => {
  try {
    const value = window.localStorage.getItem(SITE_CHECK_PAGE_SIZE_KEY);
    if (value === "all") return "all";
    const parsed = Number(value);
    return SITE_CHECK_PAGE_SIZE_OPTIONS.includes(parsed)
      ? parsed
      : SITE_CHECK_DEFAULT_PAGE_SIZE;
  } catch {
    return SITE_CHECK_DEFAULT_PAGE_SIZE;
  }
};

const readStoredGridState = (siteId) => {
  if (!siteId) return null;
  try {
    const value = window.sessionStorage.getItem(getSiteCheckGridStateKey(siteId));
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const writeStoredGridState = (siteId, state) => {
  if (!siteId) return;
  try {
    window.sessionStorage.setItem(
      getSiteCheckGridStateKey(siteId),
      JSON.stringify(state)
    );
  } catch {
    // Grid state persistence is a usability enhancement only.
  }
};

const getSiteCheckScrollPosition = () => {
  const root = document.getElementById("root");
  if (root && root.scrollHeight > root.clientHeight) {
    return root.scrollTop || 0;
  }
  return window.scrollY || document.documentElement?.scrollTop || 0;
};

const restoreSiteCheckScrollPosition = (top) => {
  const safeTop = Math.max(0, Number(top) || 0);
  const root = document.getElementById("root");

  if (root && root.scrollHeight > root.clientHeight) {
    root.scrollTo({ top: safeTop, behavior: "auto" });
    return;
  }

  window.scrollTo({ top: safeTop, behavior: "auto" });
};

const SiteChecks = ({
  siteSelectedForGlobal,
  loggedInUserData,
  siteCheckUserOptions,
  getSiteCheckUserOptions,
}) => {
  const datePickerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [create, setCreate] = useState(false);
  const [copyMode, setCopyMode] = useState(false);
  const [copyQuantity, setCopyQuantity] = useState(1);
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
  const location = useLocation();
  const inspectionCheckId = SITE_CHECK_WORKSPACE_ENABLED
    ? new URLSearchParams(location.search).get("inspection")
    : null;
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
  const managerListRef = useRef(managerList);
  managerListRef.current = managerList;

  const canUseSiteCheckTestLauncher =
    String(loggedInUserData?.email || "").trim().toLowerCase() ===
    SITE_CHECK_TEST_LAUNCHER_EMAIL;

  const [pageSize, setPageSize] = useState(readStoredPageSize);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastSelectedCheckId, setLastSelectedCheckId] = useState(null);
  const [workspaceDisplayMode, setWorkspaceDisplayMode] = useState("full");
  const [gridStateReadySiteId, setGridStateReadySiteId] = useState(null);
  const lastKnownScrollYRef = useRef(0);
  const pendingRestoreScrollRef = useRef(null);
  const pendingRowScrollRef = useRef(null);
  const latestGridStateRef = useRef(null);
  const previousInspectionCheckIdRef = useRef(null);
  const previousGridSiteIdRef = useRef(null);
  const siteCheckMutationRefreshTimerRef = useRef(null);
  const filteredOutNotifiedCheckIdRef = useRef(null);
  const workspaceDirtyCheckIdRef = useRef(null);

  const showAllRows = pageSize === "all";
  const numericPageSize = showAllRows
    ? Math.max(filteredSiteChecks.length, 1)
    : Number(pageSize) || SITE_CHECK_DEFAULT_PAGE_SIZE;
  const indexOfLastPreAction = currentPage * numericPageSize;
  const indexOfFirstPreAction = indexOfLastPreAction - numericPageSize;
  const currentSiteChecks = showAllRows
    ? filteredSiteChecks
    : filteredSiteChecks?.slice(indexOfFirstPreAction, indexOfLastPreAction);
  const totalPages = showAllRows
    ? filteredSiteChecks.length > 0
      ? 1
      : 0
    : Math.ceil(filteredSiteChecks.length / numericPageSize);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handlePageSizeChange = (event) => {
    const rawValue = event.target.value;
    const nextPageSize = rawValue === "all" ? "all" : Number(rawValue);
    const anchorCheckId = showAllRows
      ? lastSelectedCheckId || currentSiteChecks?.[0]?.checkId || null
      : currentSiteChecks?.[0]?.checkId || lastSelectedCheckId || null;
    const anchorIndex = anchorCheckId
      ? filteredSiteChecks.findIndex(
          (check) => String(check.checkId) === String(anchorCheckId)
        )
      : -1;
    const oldFirstRecordIndex = showAllRows
      ? Math.max(anchorIndex, 0)
      : (currentPage - 1) * numericPageSize;

    setPageSize(nextPageSize);
    try {
      window.localStorage.setItem(
        SITE_CHECK_PAGE_SIZE_KEY,
        String(nextPageSize)
      );
    } catch {
      // Page-size persistence is optional.
    }

    pendingRowScrollRef.current = anchorCheckId;
    if (nextPageSize === "all") {
      setCurrentPage(1);
      return;
    }

    setCurrentPage(Math.floor(oldFirstRecordIndex / nextPageSize) + 1);
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
  const formData2Ref = useRef(formData2);
  formData2Ref.current = formData2;
  const selectedSiteId = siteSelectedForGlobal?.siteId;

  useEffect(() => {
    const previousSiteId = previousGridSiteIdRef.current;
    const previousState = latestGridStateRef.current;
    if (
      previousSiteId &&
      previousState?.siteId &&
      String(previousState.siteId) === String(previousSiteId)
    ) {
      writeStoredGridState(previousSiteId, {
        ...previousState,
        scrollY: getSiteCheckScrollPosition() || lastKnownScrollYRef.current || 0,
      });
    }

    previousGridSiteIdRef.current = selectedSiteId || null;

    if (!selectedSiteId) {
      setGridStateReadySiteId(null);
      return;
    }

    setGridStateReadySiteId(null);
    const storedState = readStoredGridState(selectedSiteId);

    setCurrentPage(Math.max(1, Number(storedState?.currentPage) || 1));
    setLastSelectedCheckId(storedState?.lastSelectedCheckId || null);
    const restoredFilters = {
      ...formData2Ref.current,
      ...(storedState?.filters || {}),
    };
    formData2Ref.current = restoredFilters;
    setFormData2(restoredFilters);
    pendingRestoreScrollRef.current = Number(storedState?.scrollY) || 0;
    setGridStateReadySiteId(String(selectedSiteId));
  }, [selectedSiteId]);

  useEffect(() => {
    const root = document.getElementById("root");
    const handleScroll = () => {
      lastKnownScrollYRef.current = getSiteCheckScrollPosition();
    };

    lastKnownScrollYRef.current = getSiteCheckScrollPosition();
    window.addEventListener("scroll", handleScroll, { passive: true });
    root?.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      root?.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (
      !selectedSiteId ||
      gridStateReadySiteId !== String(selectedSiteId)
    ) {
      return;
    }

    const state = {
      siteId: selectedSiteId,
      currentPage,
      pageSize,
      filters: formData2,
      lastSelectedCheckId,
      scrollY: lastKnownScrollYRef.current,
    };

    latestGridStateRef.current = state;
    writeStoredGridState(selectedSiteId, state);
  }, [
    selectedSiteId,
    gridStateReadySiteId,
    currentPage,
    pageSize,
    formData2,
    lastSelectedCheckId,
  ]);

  useEffect(() => {
    return () => {
      const state = latestGridStateRef.current;
      if (!state?.siteId) return;
      writeStoredGridState(state.siteId, {
        ...state,
        scrollY: getSiteCheckScrollPosition() || lastKnownScrollYRef.current || 0,
      });
    };
  }, []);
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
    setCurrentPage(1);
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

  const filterSiteChecks = (source = [], filters = formData2) => {
    let result = [...source];

    if (filters?.type?.length > 0) {
      result = result.filter((sc) => sc.type === filters.type);
    }
    if (filters?.subType?.length > 0) {
      result = result.filter((sc) => sc.subType === filters.subType);
    }
    if (filters?.category?.length > 0) {
      result = result.filter((sc) => sc.category === filters.category);
    }
    if (filters?.status?.length > 0) {
      result = result.filter((sc) => sc.status === filters.status);
    }

    if (filters?.searchField?.length > 0 && result.length > 0) {
      const searchValue = String(filters.searchField).toLowerCase();
      result = result.filter((sc) => {
        const lead = managerListRef.current.find((u) => u.id == sc.leadUserID);
        const leadName = lead
          ? `${lead.role} - ${lead.name} (${lead.email})${
              lead.companyName ? ` - ${lead.companyName}` : ""
            }`
          : "";

        return (
          sc?.type?.toLowerCase().includes(searchValue) ||
          sc?.subType?.toLowerCase().includes(searchValue) ||
          sc?.category?.toLowerCase().includes(searchValue) ||
          leadName.toLowerCase().includes(searchValue)
        );
      });
    }

    return result;
  };

  const searchSiteCheck = () => {
    setFilteredSiteChecks(filterSiteChecks(siteChecks, formData2));
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
    setCopyQuantity(1);
    setCopyMode(true);
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
        getSiteChecks({ highlightCheckId: action.checkId });
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
    getSiteChecks({ showLoading: true });
    // Site Check data only needs a full reload when the selected site changes.
    // Depending on the whole Redux object can retrigger the load on unrelated store updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSiteId]);

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
    if (!siteSelectedForGlobal?.siteId) {
      toast.error("Please select site from site search to proceed....");
      setIsLoading(false);
      return;
    }

    const quantity = Number(copyQuantity);
    if (copyMode && (!Number.isInteger(quantity) || quantity < 1)) {
      toast.error("Number of Copies must be a whole number of at least 1.");
      setIsLoading(false);
      return;
    }

    const body = { ...formData };
    if (body?.type === "Assessment") {
      body.category = body.subType;
    }
    body.siteId = siteSelectedForGlobal.siteId;
    body.dueDate = body?.dueDate ? new Date(body.dueDate) : "";
    body.startDate = body?.startDate ? new Date(body.startDate) : "";

    try {
      if (copyMode) {
        const copyResponse = await post("/api/site-check/copies", {
          quantity,
          siteId: body.siteId,
          type: body.type,
          subType: body.subType,
          category: body.category,
          dueDate: body.dueDate || null,
          startDate: body.startDate || null,
          leadUserID: body.leadUserID,
          assistantUserID: body.assistantUserID,
          repeatFrequency: body.repeatFrequency,
        });

        const createdCopies = Array.isArray(copyResponse?.data)
          ? copyResponse.data
          : [];

        createdCopies.forEach((createdCopy) => {
          if (body.startDate && createdCopy?.checkId) {
            setCalenderEvents({ ...body, checkId: createdCopy.checkId });
          }
        });

        toast.success(
          `${createdCopies.length || quantity} Site Check${
            quantity === 1 ? "" : "s"
          } created successfully.`
        );
      } else {
        const sitecheckres = await post("/api/site-check/", body);
        const createdBody = {
          ...body,
          checkId: sitecheckres?.data?.checkId,
        };
        if (createdBody.startDate) {
          setCalenderEvents(createdBody);
        }
      }

      await getSiteChecks();
      setCreate(false);
      setCopyMode(false);
      setCopyQuantity(1);
    } catch (error) {
      const responseMessage = error?.response?.data;
      const message =
        typeof responseMessage === "string"
          ? responseMessage
          : responseMessage?.message ||
            `Unable to ${copyMode ? "create Site Check copies" : "create Site Check"}. Please try again.`;
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
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

  const getSiteChecks = async ({
    highlightCheckId = null,
    notifyWhenFilteredOut = false,
    showLoading = true,
  } = {}) => {
    if (!siteSelectedForGlobal?.siteId) {
      if (showLoading) {
        toast.error("Please select site from site search to proceed....");
      }
      return false;
    }

    if (showLoading) {
      setIsLoading(true);
    }

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

      const filteredResults = filterSiteChecks(
        sortedSiteChecks,
        formData2Ref.current
      );
      setFilteredSiteChecks(filteredResults);
      setSiteChecks(sortedSiteChecks);

      if (highlightCheckId) {
        setLastSelectedCheckId(String(highlightCheckId));
        const recordStillExists = sortedSiteChecks.some(
          (check) => String(check.checkId) === String(highlightCheckId)
        );
        const recordStillVisible = filteredResults.some(
          (check) => String(check.checkId) === String(highlightCheckId)
        );

        if (recordStillVisible) {
          filteredOutNotifiedCheckIdRef.current = null;
        } else if (
          notifyWhenFilteredOut &&
          recordStillExists &&
          String(filteredOutNotifiedCheckIdRef.current) !== String(highlightCheckId)
        ) {
          filteredOutNotifiedCheckIdRef.current = String(highlightCheckId);
          toast.info(
            `Site Check ${highlightCheckId} was updated and no longer matches the current filter.`
          );
        }
      }

      return true;
    } catch (error) {
      console.error("Error fetching site checks:", error);
      toast.error("Failed to load site checks");
      return false;
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };


  const openInspectionWorkspace = (action) => {
    const checkId = action?.checkId;
    if (!checkId) return;

    if (
      SITE_CHECK_WORKSPACE_ENABLED &&
      inspectionCheckId &&
      String(inspectionCheckId) === String(checkId)
    ) {
      return;
    }

    const scrollY = getSiteCheckScrollPosition();
    setLastSelectedCheckId(String(checkId));
    filteredOutNotifiedCheckIdRef.current = null;
    lastKnownScrollYRef.current = scrollY;

    if (selectedSiteId) {
      const state = {
        siteId: selectedSiteId,
        currentPage,
        pageSize,
        filters: formData2,
        lastSelectedCheckId: String(checkId),
        scrollY,
      };
      latestGridStateRef.current = state;
      writeStoredGridState(selectedSiteId, state);
    }

    if (!SITE_CHECK_WORKSPACE_ENABLED) {
      navigate(`/site-checks/${checkId}/update`);
      return;
    }

    const searchParams = new URLSearchParams(location.search);
    searchParams.set("inspection", String(checkId));
    const workspaceAlreadyOpen = Boolean(inspectionCheckId);

    if (!workspaceAlreadyOpen) {
      setWorkspaceDisplayMode("full");
    }

    navigate(
      {
        pathname: location.pathname,
        search: `?${searchParams.toString()}`,
      },
      {
        replace: workspaceAlreadyOpen,
        state: {
          ...(location.state || {}),
          siteCheckWorkspaceFromGrid: true,
        },
      }
    );
  };

  const closeInspectionWorkspace = () => {
    if (inspectionCheckId) {
      setLastSelectedCheckId(String(inspectionCheckId));
    }

    if (location.state?.siteCheckWorkspaceFromGrid) {
      navigate(-1);
      return;
    }

    const searchParams = new URLSearchParams(location.search);
    searchParams.delete("inspection");
    navigate(
      {
        pathname: location.pathname,
        search: searchParams.toString() ? `?${searchParams.toString()}` : "",
      },
      { replace: true }
    );
  };

  useEffect(() => {
    if (isLoading) return;

    if (showAllRows) {
      if (currentPage !== 1) setCurrentPage(1);
      return;
    }

    const nearestValidPage = Math.max(1, totalPages);
    if (currentPage > nearestValidPage) {
      setCurrentPage(nearestValidPage);
    }
  }, [showAllRows, totalPages, currentPage, isLoading]);

  useEffect(() => {
    const rowCheckId = pendingRowScrollRef.current;
    if (!rowCheckId) return;

    const rowIsRendered = currentSiteChecks?.some(
      (check) => String(check.checkId) === String(rowCheckId)
    );
    if (!rowIsRendered) return;

    pendingRowScrollRef.current = null;
    window.requestAnimationFrame(() => {
      document
        .querySelector(`[data-site-check-id="${rowCheckId}"]`)
        ?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  }, [currentSiteChecks, pageSize]);

  useEffect(() => {
    if (
      inspectionCheckId ||
      isLoading ||
      gridStateReadySiteId !== String(selectedSiteId) ||
      pendingRestoreScrollRef.current === null
    ) {
      return;
    }

    const scrollY = pendingRestoreScrollRef.current;
    pendingRestoreScrollRef.current = null;
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        restoreSiteCheckScrollPosition(scrollY);
      });
    });
  }, [
    inspectionCheckId,
    isLoading,
    siteChecks.length,
    currentPage,
    gridStateReadySiteId,
    selectedSiteId,
  ]);

  useEffect(() => {
    const previousInspectionCheckId = previousInspectionCheckIdRef.current;

    if (inspectionCheckId) {
      setLastSelectedCheckId(String(inspectionCheckId));
    } else if (previousInspectionCheckId) {
      setLastSelectedCheckId(String(previousInspectionCheckId));

      // Browser Back / an inspection's existing navigate(-1) can close the
      // workspace without calling closeInspectionWorkspace. Refresh only when
      // that inspection really changed, and never replace the grid with a spinner.
      if (
        String(workspaceDirtyCheckIdRef.current) ===
        String(previousInspectionCheckId)
      ) {
        getSiteChecks({
          highlightCheckId: previousInspectionCheckId,
          notifyWhenFilteredOut: true,
          showLoading: false,
        }).then((loaded) => {
          if (
            loaded &&
            String(workspaceDirtyCheckIdRef.current) ===
              String(previousInspectionCheckId)
          ) {
            workspaceDirtyCheckIdRef.current = null;
          }
        });
      }
    }

    previousInspectionCheckIdRef.current = inspectionCheckId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inspectionCheckId]);

  useEffect(() => {
    if (!inspectionCheckId || workspaceDisplayMode !== "half") return;
    if (
      String(workspaceDirtyCheckIdRef.current) !== String(inspectionCheckId)
    ) {
      return;
    }

    getSiteChecks({
      highlightCheckId: inspectionCheckId,
      notifyWhenFilteredOut: true,
      showLoading: false,
    }).then((loaded) => {
      if (
        loaded &&
        String(workspaceDirtyCheckIdRef.current) === String(inspectionCheckId)
      ) {
        workspaceDirtyCheckIdRef.current = null;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceDisplayMode, inspectionCheckId]);

  useEffect(() => {
    const handleSiteCheckMutation = () => {
      if (!inspectionCheckId) return;

      workspaceDirtyCheckIdRef.current = String(inspectionCheckId);

      // In full screen the grid is hidden, so defer refresh until Half Screen
      // or Close. In half screen refresh in the background without hiding rows.
      if (workspaceDisplayMode !== "half") return;

      if (siteCheckMutationRefreshTimerRef.current) {
        window.clearTimeout(siteCheckMutationRefreshTimerRef.current);
      }

      siteCheckMutationRefreshTimerRef.current = window.setTimeout(() => {
        getSiteChecks({
          highlightCheckId: inspectionCheckId,
          notifyWhenFilteredOut: true,
          showLoading: false,
        }).then((loaded) => {
          if (
            loaded &&
            String(workspaceDirtyCheckIdRef.current) ===
              String(inspectionCheckId)
          ) {
            workspaceDirtyCheckIdRef.current = null;
          }
        });
      }, 500);
    };

    window.addEventListener(
      SITE_CHECK_DATA_CHANGED_EVENT,
      handleSiteCheckMutation
    );

    return () => {
      window.removeEventListener(
        SITE_CHECK_DATA_CHANGED_EVENT,
        handleSiteCheckMutation
      );
      if (siteCheckMutationRefreshTimerRef.current) {
        window.clearTimeout(siteCheckMutationRefreshTimerRef.current);
        siteCheckMutationRefreshTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inspectionCheckId, workspaceDisplayMode]);

  const activeSiteCheckSummary = siteChecks.find(
    (check) => String(check.checkId) === String(inspectionCheckId)
  );

  const visibleRecordStart =
    filteredSiteChecks.length === 0
      ? 0
      : showAllRows
      ? 1
      : indexOfFirstPreAction + 1;
  const visibleRecordEnd = showAllRows
    ? filteredSiteChecks.length
    : Math.min(indexOfLastPreAction, filteredSiteChecks.length);


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
                          value={formData2?.searchField || ""}
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
                        value={formData2?.type || ""}
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
                        value={formData2?.status || ""}
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
                            setCopyMode(false);
                            setCopyQuantity(1);
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
                    {loggedInUserData?.role === ROLE.ADMIN && (
                      <div className="col-md-2 col-sm-4 mt-2">
                        <button
                          style={{ width: "150px" }}
                          className="btn btn-outline-info"
                          onClick={() => goTo("/site-check-scheduler-logs")}
                          title="View Site Check scheduler execution and change logs"
                        >
                          Scheduler Logs
                        </button>
                      </div>
                    )}
                    {canUseSiteCheckTestLauncher && (
                      <SiteCheckTestLauncher
                        siteSelectedForGlobal={siteSelectedForGlobal}
                        siteUsers={managerList}
                        onCreated={(checkId) =>
                          goTo(`/site-checks/${checkId}/update`)
                        }
                      />
                    )}
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
                        <td colSpan={9} align="center">
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
                          <tr
                            key={action?.checkId || action?.id}
                            data-site-check-id={action?.checkId}
                            className={`site-check-row--clickable ${
                              String(action?.checkId) === String(inspectionCheckId)
                                ? "site-check-row--active"
                                : String(action?.checkId) === String(lastSelectedCheckId)
                                ? "site-check-row--last"
                                : ""
                            }`.trim()}
                            onClick={() => openInspectionWorkspace(action)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                openInspectionWorkspace(action);
                              }
                            }}
                            tabIndex={0}
                            role="button"
                            aria-label={`Open ${action?.type || "site check"} inspection ${action?.checkId}`}
                          >
                            <th scope="col" className="site-check-row__cell--actionable">{action?.type}</th>
                            <th scope="col" className="site-check-row__cell--actionable">{action?.subType}</th>
                            <th scope="col">
                              {assetIdMap[action.checkId]
                                ? parseInt(assetIdMap[action.checkId]) // Display as number to show proper ordering
                                : '-'}
                            </th>
                            <th scope="col" className="site-check-row__cell--actionable">{action?.category}</th>
                            <th scope="col" style={{ width: "250px" }} className="site-check-row__cell--actionable">
                              {leanName}
                            </th>
                            <th scope="col" style={{ width: "200px" }} className="site-check-row__cell--actionable">
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
                            <th scope="col" style={{ width: "170px" }} className="site-check-row__cell--actionable">
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
                            <th scope="col" className="site-check-row__cell--actionable">
                              <Chip
                                color={
                                  action?.status === "Done"
                                    ? "success"
                                    : "warning"
                                }
                                label={action?.status}
                              />
                            </th>
                            <th
                              scope="col"
                              style={{ width: "250px" }}
                              className="site-check-row__actions"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <Tooltip title={`View ${action?.type}`} arrow>
                                <button
                                  className="btn btn-sm btn-light"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openInspectionWorkspace(action);
                                  }}
                                >
                                  <i className="fas fa-eye" />|
                                  <i className="fas fa-pen" />
                                </button>{" "}
                              </Tooltip>
                              <Tooltip title={`${action?.type} Copy As`} arrow>
                                <button
                                  className="btn btn-sm btn-light"
                                  onClick={(event) => {
                                    event.stopPropagation();
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
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    markAsDone(action);
                                  }}
                                  disabled={action.status === "Done"}
                                >
                                  <i class="fas fa-regular fa-thumbs-up cursor"></i>{" "}
                                </button>{" "}
                              </Tooltip>
                              <Tooltip title={`Delete ${action?.type}`} arrow>
                                <button
                                  className="btn btn-sm btn-light text-dark"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    deleteSiteCheckCall(action);
                                  }}
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
                <div className="site-check-grid-footer">
                  <div className="site-check-page-size">
                    <label htmlFor="siteCheckPageSize" className="mb-0">
                      Rows per page
                    </label>
                    <select
                      id="siteCheckPageSize"
                      className="form-control form-select form-select-sm"
                      value={pageSize}
                      onChange={handlePageSizeChange}
                    >
                      {SITE_CHECK_PAGE_SIZE_OPTIONS.map((option) => (
                        <option key={String(option)} value={option}>
                          {option === "all" ? "All" : option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="site-check-grid-count">
                    {showAllRows
                      ? `Showing all ${filteredSiteChecks.length} records`
                      : `Showing ${visibleRecordStart}-${visibleRecordEnd} of ${filteredSiteChecks.length} records`}
                  </div>

                  {!showAllRows && (
                    <Pagination
                      totalPages={totalPages}
                      currentPage={currentPage}
                      onPageChange={handlePageChange}
                    />
                  )}
                </div>
              </div>
            </>
          )}
          {create && (
            <div>
              <form onSubmit={addSiteCheck}>
                <BreadCrumHeader
                  header={copyMode ? "Site Check - Copy" : "Site Check - New"}
                  page={copyMode ? "Copy" : "New"}
                />
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
                  {copyMode && (
                    <>
                      <Grid sm={12}>
                        <div
                          className="alert alert-info"
                          style={{ margin: "10px" }}
                        >
                          Creates new Site Checks from these details. Previous
                          inspection data, PDFs and History are not copied.
                        </div>
                      </Grid>
                      <Grid sm={4}>
                        <div style={{ margin: "10px" }}>
                          <label htmlFor="copyQuantity">Number of Copies</label>
                          <input
                            id="copyQuantity"
                            name="copyQuantity"
                            type="number"
                            min="1"
                            step="1"
                            required
                            className="form-control"
                            value={copyQuantity}
                            onChange={(event) =>
                              setCopyQuantity(event.target.value)
                            }
                          />
                        </div>
                      </Grid>
                    </>
                  )}
                  <Grid sm={copyMode ? 8 : 4}></Grid>
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
                          {copyMode
                            ? Number(copyQuantity) === 1
                              ? "Create Copy"
                              : `Create ${copyQuantity || 0} Copies`
                            : "Save & Continue"}
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
                            setCopyMode(false);
                            setCopyQuantity(1);
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

      {SITE_CHECK_WORKSPACE_ENABLED && inspectionCheckId && (
        <SiteCheckWorkspace
          key={`site-check-workspace-${inspectionCheckId}`}
          checkId={inspectionCheckId}
          siteCheckSummary={activeSiteCheckSummary}
          displayMode={workspaceDisplayMode}
          onModeChange={setWorkspaceDisplayMode}
          onClose={closeInspectionWorkspace}
        />
      )}
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
