import React, { Fragment, useEffect, useState } from "react";
import { Button, Box, Tooltip, Autocomplete } from "@mui/material";
import { connect } from "react-redux";
import { useForm } from "react-hook-form";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import CircularProgress from "@mui/material/CircularProgress";
import DialogTitle from "@mui/material/DialogTitle";
import { InputError } from "../../../common/InputError";
import { toast } from "react-toastify";
import { Validation } from "../../../../Constant/Validation";
import ThumbDown from "@mui/icons-material/ThumbDown";
import ThumbUp from "@mui/icons-material/ThumbUp";
import Delete from "@mui/icons-material/Delete";

import {
  getDocumentsRootFolder,
  getSiteAssets,
  setLoader,
} from "../../../../store/thunk/site";
import { getManagerList } from "../../../../store/thunk/user";
import AddAssets from "./AddAssets";
import { get, put } from "../../../../api";
import ChipComponent from "../../../common/Chips/Chips";
import BusinessIcon from "@mui/icons-material/Business";
import moment from "moment";
import {
  deleteScheduleVisit,
  terminateContractCall,
  updateScheduleVisit,
} from "../../../../store/thunk/projects";
import Swal from "sweetalert2";
import PdfViewer from "../Documents/PdfViewer";
import ListStatusBadge from "../../../common/Alert/Status/ListStatusBadge";

const ManagerContractView = ({
  showAddModal,
  setShowAddModal,
  refresh,
  loggedInUserData,
  siteSelectedForGlobal,
  rootFolder,
  getDocumentsRootFolder,
  getManagerList,
  ManagerList,
  getSiteAssets,
  siteAssets,
  category,
  subCategory,
  selectedContract,
  deleteScheduleVisit,
  terminateContractCall,
  updateScheduleVisit,
}) => {
  console.log("selectedContract ===>", selectedContract);
  const handleOpen = () => setShowAddModal(true);
  const handleClose = () => setShowAddModal(false);
  const [showMandatoryModal, setShowMandatoryModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMandatoryFolder, setSelectedMandatoryFolder] = useState([]);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [currentContract, setCurrentContract] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [subCategoryList, setSubCategoryList] = useState([]);
  const [subCategoryListData, setSubCategoryListData] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState("");
  const [assetData, setAssetData] = useState([
    {
      assets: [],
      assetRef: " ",
      location: " ",
      category: "New",
    },
  ]);
  const {
    register,
    reset,
    watch,
    formState: { errors },
    handleSubmit,
    setValue,
    getValues,
  } = useForm({});
  const scheduleDateForm = useForm({});
  const values = watch();
  useEffect(() => {
    if (siteSelectedForGlobal?.siteId) {
      getManagerList();
      getCompanies();
      getDocumentsRootFolder(siteSelectedForGlobal?.siteId);
      getSiteAssets(siteSelectedForGlobal?.siteId);
    } else {
      toast.error("Please select site from site search.");
    }
    setSubCategoryListData(subCategory);
  }, []);
  useEffect(() => {
    getContractDetail();
  }, [selectedContract]);
  const getContractDetail = async () => {
    const data = await get(
      `/api/project/${selectedContract?.projectContractId}/details`
    );
    reset({
      ...data,
      manager: data?.projectManagerUserId,
      company: data?.contractorCompanyId
        ? Number(data?.contractorCompanyId)
        : "",
      startDate: data?.startDate?.split("T")?.[0],
      endDate: data?.endDate?.split("T")?.[0],
    });
    setAssetData(data?.projectContractAssets);
    setCurrentContract(data);
  };
  const getCompanies = async () => {
    const companiesData = await get(`/api/companies/all`);
    setCompanies(companiesData);
  };
  useEffect(() => {
    if (category) {
      setCategoryList(category);
    }
    if (subCategory) {
      setSubCategoryList(subCategory);
    }
  }, [category, subCategory]);
  const categoryChange = (e) => {
    const val = e.target.value;
    setValue("category", val, { shouldValidate: true });
    const subCategoryData = subCategoryList?.filter(
      (itm) => itm?.attribite1 === val
    );
    setSubCategoryListData(subCategoryData);
  };
  const submitAddContract = async (data) => {
    console.log("data", data);
    // let form_data = new FormData();
    if (!siteSelectedForGlobal?.siteId) {
      toast.error("Please select site from site search to proceed.");
      return;
    }
    if (loggedInUserData?.id) {
      console.log("data", data);
      const formData = {
        projectContractId: currentContract?.projectContractId,
        summary: data?.summary,
        siteId: siteSelectedForGlobal?.siteId,
        category: data?.category || "",
        subCategory: data?.subCategory || "",
        contractorCompanyId: data?.company || "",
        status: currentContract?.status,
        budget: data?.cost,
        cost: data?.cost,
        startDate: `${data?.startDate} 10:00:00`,
        endDate: `${data?.endDate} 10:00:00`,
        projectManagerUserId: data?.manager ? Number(data?.manager) : null,
        description: data?.description,
        contractorQuotes: data?.contractorQuotes,
        frequency: data?.frequency,
      };
      const url = "api/project/manage";
      const res = await put(url, formData);
      if (res?.status === 200) {
        if (data?.category !== "Building Project") {
          let assets = assetData
            ?.map((itm) => {
              if (!itm?.isSaved) {
                return itm.assetId;
              }
            })
            .filter(function (el) {
              return el != null;
            });
          if (assets?.length > 0) {
            const assetData = {
              addAssets: assets,
              removeAssets: [],
            };
            const assetUpdateAPI = await put(
              `api/project/${res?.data?.projectContractId}/assets`,
              assetData
            );
          }
        }
        toast.success("Successully added contract.");
        handleClose();
        refresh();
      } else {
        toast.error(
          "Something went wrong while adding contract. Please try again!!"
        );
      }
      setIsLoading(false);
    } else {
      toast.error("Please login with valid user details to proceed.");
    }
  };
  const deleteAsset = (asset) => {
    console.log("asset", asset);
  };
  const addVisit = async () => {
    const visitDate = scheduleDateForm.getValues("scheduleDate");
    if (visitDate) {
      const visit = {
        scheduleId: null,
        projectContractId: selectedContract?.projectContractId,
        visitPurpose: "Inspection",
        status: "Scheduled",
        visitDate: `${visitDate} 10:00:00`,
        rescheduleDate: "",
      };
      try {
        const res = await updateScheduleVisit(visit);
        if (res == "Success") {
          getContractDetail();
          toast.success("Visit has been successfully scheduled.");
          scheduleDateForm.reset({ scheduleDate: "" });
        } else {
          toast.error("Something went wrong while visit schedule.");
        }
      } catch (e) {
        toast.error("Something went wrong while visit schedule.");
      }
    } else {
      toast.warning("Please select date to schedule visit.");
    }
  };
  const deleteVisit = (itm) => {
    Swal.fire({
      target: document.getElementById("Modal-container"),
      title: `Do you want to delete ${
        itm?.rescheduleDate
          ? moment(itm?.rescheduleDate).format("DD-MM-YYYY")
          : moment(itm?.visitDate).format("DD-MM-YYYY")
      } visit`,
      showDenyButton: false,
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#da292e",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const res = await deleteScheduleVisit(itm?.scheduleId);
        if (res === "Success") {
          toast.success(
            `${
              itm?.rescheduleDate
                ? moment(itm?.rescheduleDate).format("DD-MM-YYYY")
                : moment(itm?.visitDate).format("DD-MM-YYYY")
            } visit has been deleted successully`
          );
          getContractDetail();
        } else {
          toast.error(
            "Something went wrong while deleting scheduled visit. Please try again!"
          );
        }
      } else if (result.isDenied) {
        // Swal.fire("Changes are not saved", "", "info");
      }
    });
  };
  const markAsAccepted = (itm) => {
    const data = {
      ...itm,
      status: "Scheduled",
      projectContractId: selectedContract?.projectContractId,
      visitDate: `${itm?.rescheduleDate?.split("T")?.[0]} 10:00:00`,
      rescheduleDate: "",
    };
    Swal.fire({
      target: document.getElementById("Modal-container"),
      title: `Do you want to schedule visit to ${moment(
        itm?.rescheduleDate
      ).format("DD-MM-YYYY")} visit as requested?`,
      showDenyButton: false,
      showCancelButton: true,
      confirmButtonText: "Mark Schedule",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const res = await updateScheduleVisit(data);
        if (res == "Success") {
          getContractDetail();
          toast.success("Visit has been successfully re scheduled.");
        } else {
          toast.error("Something went wrong while visit re schedule.");
        }
      } else if (result.isDenied) {
        // Swal.fire("Changes are not saved", "", "info");
      }
    });
  };
  const terminateContract = () => {
    Swal.fire({
      target: document.getElementById("Modal-container"),
      title: `Do you want to terminate ${selectedContract?.summary} contract?`,
      showDenyButton: false,
      showCancelButton: true,
      confirmButtonText: "Terminate",
      confirmButtonColor: "#da292e",
    }).then(async (result) => {
      if (result.isConfirmed) {
        setIsLoading(true);
        const res = await terminateContractCall(
          selectedContract?.projectContractId
        );
        if (res === "Success") {
          toast.success(
            `${selectedContract?.summary} Contract has been successfully terminated`
          );
          handleClose();
          refresh();
        } else {
          toast.error(
            `Something went wrong while terminating ${selectedContract?.summary} contract. Please try again!`
          );
        }
        setIsLoading(false);
      } else if (result.isDenied) {
        // Swal.fire("Changes are not saved", "", "info");
      }
    });
  };
  const getSelectedValue = () => {
    const selectedValue =
      companies.find((itm) => itm.companyId === getValues("company")) || null;
    if (selectedValue) {
      return {
        key: selectedValue?.companyId,
        label: selectedValue?.companyName,
      };
    }
    return null;
  };
  const markStatusQuotation = async (row, status) => {
    // let form_data = new FormData();
    setIsLoading(true)
    if (!siteSelectedForGlobal?.siteId) {
      toast.error("Please select site from site search to proceed.");
      return;
    }
    if (loggedInUserData?.id) {
      const contractorQuotesList = [];
      for (let itm of currentContract?.contractorQuotes) {
        if (itm?.quoteId === row?.quoteId) {
          contractorQuotesList.push({ ...itm, status: status });
        } else {
          contractorQuotesList.push(itm);
        }
      }
      const formData = {
        projectContractId: currentContract?.projectContractId,
        summary: currentContract?.summary,
        siteId: currentContract?.siteId,
        category: currentContract?.category || "",
        subCategory: currentContract?.subCategory || "",
        contractorCompanyId: currentContract?.contractorCompanyId
          ? Number(currentContract?.contractorCompanyId)
          : "",
        status: currentContract?.status,
        budget: currentContract?.cost,
        cost: currentContract?.cost,
        startDate: `${
          currentContract?.startDate
            ? currentContract?.startDate?.split("T")?.[0]
            : moment(new Date()).format("YYYY-MM-DD")
        } 00:00:00`,
        endDate: `${
          currentContract?.endDate
            ? currentContract?.endDate?.split("T")?.[0]
            : moment(new Date()).format("YYYY-MM-DD")
        } 00:00:00`,
        projectManagerUserId: currentContract?.projectManagerUserId
          ? Number(currentContract?.projectManagerUserId)
          : null,
        description: currentContract?.description,
        contractorQuotes: contractorQuotesList,
        frequency: currentContract?.frequency,
      };
      const url = "api/project/manage";
      const res = await put(url, formData);
      if (res?.status === 200) {
        if (currentContract?.category !== "Building Project") {
          let assets = assetData
            ?.map((itm) => {
              if (!itm?.isSaved) {
                return itm.assetId;
              }
            })
            .filter(function (el) {
              return el != null;
            });
          if (assets?.length > 0) {
            const assetData = {
              addAssets: assets,
              removeAssets: [],
            };
            const assetUpdateAPI = await put(
              `api/project/${res?.data?.projectContractId}/assets`,
              assetData
            );
          }
        }
        toast.success("Successully updated contract.");
        getContractDetail();
      } else {
        toast.error(
          "Something went wrong while adding contract. Please try again!!"
        );
      }
      setIsLoading(false);
    } else {
      toast.error("Please login with valid user details to proceed.");
    }
    setIsLoading(false)
  };
  const deleteQuation = async (row) => {
    // let form_data = new FormData();
    if (!siteSelectedForGlobal?.siteId) {
      toast.error("Please select site from site search to proceed.");
      return;
    }
    if (loggedInUserData?.id) {
      const contractorQuotesList = [];
      for (let itm of currentContract?.contractorQuotes) {
        if (itm?.quoteId === row?.quoteId) {
          // skip to update the delete row
        } else {
          contractorQuotesList.push(itm);
        }
      }
      const formData = {
        projectContractId: currentContract?.projectContractId,
        summary: currentContract?.summary,
        siteId: currentContract?.siteId,
        category: currentContract?.category || "",
        subCategory: currentContract?.subCategory || "",
        contractorCompanyId: currentContract?.contractorCompanyId
          ? Number(currentContract?.contractorCompanyId)
          : "",
        status: currentContract?.status,
        budget: currentContract?.cost,
        cost: currentContract?.cost,
        startDate: `${
          currentContract?.startDate
            ? currentContract?.startDate?.split("T")?.[0]
            : moment(new Date()).format("YYYY-MM-DD")
        } 00:00:00`,
        endDate: `${
          currentContract?.endDate
            ? currentContract?.endDate?.split("T")?.[0]
            : moment(new Date()).format("YYYY-MM-DD")
        } 00:00:00`,
        projectManagerUserId: currentContract?.projectManagerUserId
          ? Number(currentContract?.projectManagerUserId)
          : null,
        description: currentContract?.description,
        contractorQuotes: contractorQuotesList,
        frequency: currentContract?.frequency,
      };
      const url = "api/project/manage";
      const res = await put(url, formData);
      if (res?.status === 200) {
        if (currentContract?.category !== "Building Project") {
          let assets = assetData
            ?.map((itm) => {
              if (!itm?.isSaved) {
                return itm.assetId;
              }
            })
            .filter(function (el) {
              return el != null;
            });
          if (assets?.length > 0) {
            const assetData = {
              addAssets: assets,
              removeAssets: [],
            };
            const assetUpdateAPI = await put(
              `api/project/${res?.data?.projectContractId}/assets`,
              assetData
            );
          }
        }
        toast.success("Successully updated contract.");
        getContractDetail();
      } else {
        toast.error(
          "Something went wrong while adding contract. Please try again!!"
        );
      }
      setIsLoading(false);
    } else {
      toast.error("Please login with valid user details to proceed.");
    }
  };
  return (
    <React.Fragment>
      {showPdfModal && (
        <PdfViewer
          showPdfModal={showPdfModal}
          setShowPdfModal={setShowPdfModal}
          selectedPdf={selectedPdf}
        />
      )}
      <Dialog
        open={showAddModal}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        id="Modal-container"
      >
        <form onSubmit={handleSubmit(submitAddContract)}>
          <DialogTitle>
            View Contract ({currentContract?.category} &gt;{" "}
            {currentContract?.subCategory})
          </DialogTitle>
          <DialogContent dividers>
            {isLoading && (
              <Box sx={{ display: "flex" }}>
                <CircularProgress />
              </Box>
            )}

            {!isLoading && (
              <Fragment>
                <div className="row">
                  <div className="col-md-1">
                    <ChipComponent status={currentContract?.status} />
                  </div>
                  <div className="col-md-11 pt-1">
                    <BusinessIcon />
                    &nbsp;
                    <span>{currentContract?.siteName}</span>
                  </div>
                  <div className="col-md-12">
                    <div className="row">
                      <div className="col-md-3 mt-2">
                        <div className="form-group">
                          <label for="summary">Summary</label>
                          <input
                            type="text"
                            className="form-control"
                            id="summary"
                            {...register("summary", {
                              required: {
                                value: true,
                                message: `${Validation.REQUIRED} summary`,
                              },
                            })}
                          />
                          {errors?.summary && (
                            <InputError
                              message={errors?.summary?.message}
                              key={errors?.summary?.message}
                            />
                          )}
                        </div>
                      </div>
                      <div className="col-md-3 mt-2">
                        <label for="category">Category</label>
                        <select
                          name="category"
                          className="form-control form-select"
                          id="category"
                          {...register("category", {
                            required: {
                              value: true,
                              message: `Please select category`,
                            },
                          })}
                          onChange={categoryChange}
                        >
                          <option value="" selected disabled>
                            Select category
                          </option>
                          {categoryList?.map((itm) => (
                            <option value={itm?.lovValue}>
                              {itm?.lovValue}
                            </option>
                          ))}
                        </select>
                        {errors?.category && (
                          <InputError
                            message={errors?.category?.message}
                            key={errors?.category?.message}
                          />
                        )}
                      </div>
                      <div className="col-md-3 mt-2">
                        <label for="subCategory">Sub Category</label>
                        <select
                          name="subCategory"
                          className="form-control form-select"
                          id="subCategory"
                          {...register("subCategory", {
                            required: {
                              value: true,
                              message: `Please select sub category`,
                            },
                          })}
                        >
                          <option value="" selected disabled>
                            Select sub category
                          </option>
                          {subCategoryListData?.map((itm) => (
                            <option value={itm?.lovValue}>
                              {itm?.lovValue}
                            </option>
                          ))}
                        </select>
                        {errors?.subCategory && (
                          <InputError
                            message={errors?.subCategory?.message}
                            key={errors?.subCategory?.message}
                          />
                        )}
                      </div>
                      <div className="col-md-3 mt-2">
                        <label for="company">Company</label>
                        <Autocomplete
                          id="leadUserID"
                          {...register("company", {
                            required: {
                              value: true,
                              message: `${Validation.REQUIRED} company`,
                            },
                          })}
                          onChange={(event, item) => {
                            setValue("company", item?.key, {
                              shouldValidate: true,
                            });
                          }}
                          value={getSelectedValue()}
                          options={companies.map((option) => {
                            return {
                              key: option.companyId,
                              label: option.companyName,
                            };
                          })}
                          getOptionLabel={(option) => option.label}
                          renderInput={(params) => (
                            <div ref={params.InputProps.ref}>
                              <input
                                type="text"
                                {...params.inputProps}
                                className="form-control form-select"
                                placeholder="Select Company"
                              />
                            </div>
                          )}
                        />
                        {errors?.company && (
                          <InputError
                            message={errors?.company?.message}
                            key={errors?.company?.message}
                          />
                        )}
                      </div>
                      <div className="col-md-3 mt-2">
                        <div className="form-group">
                          <label for="budget">Budget (GBP)</label>
                          <input
                            type="number"
                            className="form-control"
                            id="budget"
                            disabled={true}
                            {...register("budget", {
                              required: {
                                value: true,
                                message: `${Validation.REQUIRED} budget`,
                              },
                            })}
                          />
                          {errors?.budget && (
                            <InputError
                              message={errors?.budget?.message}
                              key={errors?.budget?.message}
                            />
                          )}
                        </div>
                      </div>
                      <div className="col-md-3 mt-2">
                        <div className="form-group">
                          <label for="cost">Cost</label>
                          <input
                            type="number"
                            className="form-control"
                            id="cost"
                            disabled={true}
                            {...register("cost", {
                              required: {
                                value: true,
                                message: `${Validation.REQUIRED} cost`,
                              },
                            })}
                          />
                          {errors?.cost && (
                            <InputError
                              message={errors?.cost?.message}
                              key={errors?.cost?.message}
                            />
                          )}
                        </div>
                      </div>
                      <div className="col-md-3 mt-2">
                        <div className="form-group">
                          <label for="startDate">Start Date</label>
                          <input
                            type="date"
                            className="form-control date-input"
                            id="startDate"
                            disabled={true}
                            {...register("startDate", {
                              required: {
                                value: true,
                                message: `${Validation.REQUIRED} start date`,
                              },
                            })}
                          />
                          {errors?.startDate && (
                            <InputError
                              message={errors?.startDate?.message}
                              key={errors?.startDate?.message}
                            />
                          )}
                        </div>
                      </div>
                      <div className="col-md-3 mt-2">
                        <div className="form-group">
                          <label for="endDate">End Date</label>
                          <input
                            type="date"
                            className="form-control date-input"
                            id="endDate"
                            disabled={true}
                            {...register("endDate", {
                              required: {
                                value: true,
                                message: `${Validation.REQUIRED} end date`,
                              },
                            })}
                          />
                          {errors?.endDate && (
                            <InputError
                              message={errors?.endDate?.message}
                              key={errors?.endDate?.message}
                            />
                          )}
                        </div>
                      </div>
                      <div className="col-md-6 mt-2">
                        <div className="form-group mt-2">
                          <textarea
                            {...register("description")}
                            disabled={true}
                            className="form-control form-text"
                            placeholder="Enter Notes..."
                          ></textarea>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <label for="manager">Manager</label>
                        <select
                          name="manager"
                          className="form-control form-select"
                          id="manager"
                          disabled={true}
                          {...register("manager")}
                        >
                          <option value="" selected disabled>
                            Select manager
                          </option>
                          {ManagerList?.map((itm) => (
                            <option value={itm?.id}>{itm?.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-3 mt-2">
                        <label for="manager">Frequency</label>
                        <select
                          className="form-control form-select"
                          name="frequency"
                          {...register("frequency")}
                          disabled={true}
                        >
                          <option value={null}>Select Frequency</option>
                          <option value={"Daily"}>Daily</option>
                          <option value={"Weekly"}>Weekly</option>
                          <option value={"Quarterly"}>Quarterly</option>
                          <option value={"Yearly"}>Yearly</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Mandatory folder upload */}
                <div className="table-responsive mt-2">
                  <table className="table">
                    <thead className="table-dark">
                      <tr>
                        <td>Mandatory Folders</td>
                        <td>File Version Uploaded</td>
                      </tr>
                    </thead>
                    <tbody>
                      {!currentContract?.projectContractFolders && (
                        <tr>
                          <td>No Folders are available to view</td>
                        </tr>
                      )}
                      {currentContract?.projectContractFolders?.map((itm) => (
                        <tr key={itm?.id}>
                          <td>{itm?.name}</td>
                          <td>
                            {itm?.files?.length === 0
                              ? "No files are uploaded yet."
                              : itm?.files?.map((file, index) => (
                                  <>
                                    <button
                                      style={{
                                        border: "none",
                                        cursor: "pointer",
                                        color: "blue",
                                        marginTop: "2px",
                                      }}
                                      onClick={(e) => {
                                        e?.preventDefault();
                                        setShowPdfModal(true);
                                        setSelectedPdf(file?.url);
                                      }}
                                    >
                                      {file.name}
                                    </button>
                                    &nbsp;
                                  </>
                                ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Assets start */}
                {values?.category !== "Building Project" &&
                  values?.category !== "" && (
                    <Fragment>
                      <div className="d-flex bd-highlight">
                        <div className="pt-2 bd-highlight">
                          <div className="row">
                            <div className="col h6">Add Assets</div>
                          </div>
                        </div>
                        <div className="ms-auto p-2 bd-highlight">
                          <div className="row" style={{ height: "auto" }}>
                            <div className="col">
                              <div className="col">
                                <Tooltip title={`Add New row`} arrow>
                                  <button
                                    type="button"
                                    className="btn btn-light text-primary pr-2"
                                    onClick={(e) => {
                                      e?.preventDefault();
                                      let d = [];
                                      if (assetData) {
                                        d = [...assetData];
                                      }
                                      d.push({
                                        assets: [],
                                        assetRef: " ",
                                        location: " ",
                                        category: "New",
                                      });
                                      setAssetData(d);
                                    }}
                                  >
                                    <i className="fas fa-plus"></i>&nbsp; Add
                                    More
                                  </button>
                                </Tooltip>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-md-12">
                          <AddAssets
                            setAssetData={setAssetData}
                            assetData={assetData}
                            siteAssets={siteAssets}
                            setSelectedAssets={setSelectedAssets}
                          />
                        </div>
                      </div>
                      {/** Add Assets end */}
                    </Fragment>
                  )}
                {/* Schedule Visit start */}
                {values?.category !== "Building Project" &&
                  values?.category !== "" && (
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label for="scheduleDate">Schedule Visit</label>
                          <input
                            type="date"
                            className="form-control date-input"
                            id="scheduleDate"
                            {...scheduleDateForm.register("scheduleDate")}
                          />
                        </div>
                        {currentContract?.status !== "TERMINATED" && (
                          <div>
                            <Tooltip title={`Add New Visit`} arrow>
                              <button
                                type="button"
                                className="mt-2 btn btn-sm btn-light text-primary"
                                onClick={() => addVisit()}
                              >
                                <i className="fas fa-plus"></i>&nbsp;Add New
                                Visit
                              </button>
                            </Tooltip>
                          </div>
                        )}
                      </div>
                      <div className="col-md-6">
                        <div className="table-responsive mt-2">
                          <table className="table">
                            <thead className="table-dark">
                              <tr>
                                <td>Visit Date</td>
                                <td>Status</td>
                                <td>Action</td>
                              </tr>
                            </thead>
                            <tbody>
                              {!currentContract?.projectContractScheduleVisits && (
                                <tr>
                                  <td>No Visits are available</td>
                                </tr>
                              )}
                              {currentContract?.projectContractScheduleVisits?.map(
                                (itm) => (
                                  <tr key={itm?.scheduleId}>
                                    <td>
                                      {itm?.rescheduleDate ? (
                                        <>
                                          <del className="text-danger">
                                            {moment(itm?.visitDate).format(
                                              "DD-MM-YYYY"
                                            )}
                                          </del>
                                          <br />
                                          <span>
                                            {moment(itm?.rescheduleDate).format(
                                              "DD-MM-YYYY"
                                            )}
                                          </span>
                                        </>
                                      ) : (
                                        moment(itm?.visitDate).format(
                                          "DD-MM-YYYY"
                                        )
                                      )}
                                    </td>
                                    <td>{itm?.status}</td>
                                    <td>
                                      {currentContract?.status !==
                                        "TERMINATED" && (
                                        <Tooltip title={`Delete Visit`} arrow>
                                          <button
                                            type="button"
                                            className="btn btn-sm btn-light text-danger"
                                            onClick={() => deleteVisit(itm)}
                                          >
                                            <i className="fas fa-trash"></i>
                                          </button>
                                        </Tooltip>
                                      )}
                                      &nbsp;
                                      {itm?.status ===
                                        "Reschedule Requested" && (
                                        <Tooltip
                                          title={`Mark visit to schedule as requested`}
                                          arrow
                                        >
                                          <button
                                            type="button"
                                            className="btn btn-sm btn-light text-primary"
                                            onClick={() => markAsAccepted(itm)}
                                          >
                                            <i className="fas fa-check"></i>
                                          </button>
                                        </Tooltip>
                                      )}
                                    </td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                <div className="row">
                  <div className="col-md-12">
                    <div className="table-responsive mt-2">
                      <table className="table">
                        <thead className="table-dark">
                          <tr>
                            <td>Contractor</td>
                            <td>Company</td>
                            <td>Quote</td>
                            <td>Quote Date</td>
                            <td>Status</td>
                            <td>Action</td>
                          </tr>
                        </thead>
                        <tbody>
                          {currentContract?.contractorQuotes?.length === 0 && (
                            <tr>
                              <td colSpan={6}>No Contractor Quotation are available</td>
                            </tr>
                          )}
                          {currentContract?.contractorQuotes?.map((itm) => (
                            <tr key={itm?.quote}>
                              <td>
                                {itm?.contractor ? itm?.contractor : "--"}
                              </td>
                              <td>{itm?.company ? itm?.company : "--"}</td>
                              <td>{itm?.quote ? itm?.quote : "--"}</td>
                              <td>{itm?.quoteDate ? moment(itm?.quoteDate).format(
                                              "DD-MM-YYYY"
                                            ) : "--"}</td>
                              <td>
                                <ListStatusBadge status={itm?.status} />
                              </td>
                              <td>
                                <span
                                  className={
                                    itm?.status === "Awarded"
                                      ? "text-success cursor"
                                      : "cursor"
                                  }
                                  onClick={() => {
                                    markStatusQuotation(itm, "Awarded");
                                  }}
                                >
                                  <ThumbUp />
                                </span>
                                &nbsp;
                                <span
                                  className={
                                    itm?.status === "Rejected"
                                      ? "text-danger cursor"
                                      : "cursor"
                                  }
                                  onClick={() => {
                                    markStatusQuotation(itm, "Rejected");
                                  }}
                                >
                                  <ThumbDown />
                                </span>
                                &nbsp;
                                <span
                                  className="cursor text-danger"
                                  onClick={() => {
                                    deleteQuation(itm);
                                  }}
                                >
                                  <Delete />
                                </span>
                                &nbsp;
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                {/** END schedule visit */}
              </Fragment>
            )}
          </DialogContent>
          {!isLoading && (
            <DialogActions>
              <Button onClick={handleClose} className="bg-light text-primary">
                Close
              </Button>
              {currentContract?.status !== "TERMINATED" && (
                <>
                  <Button
                    type="button"
                    onClick={terminateContract}
                    className="bg-danger text-white"
                  >
                    Terminate Contract
                  </Button>
                  <Button type="submit" className="bg-primary text-white">
                    Save
                  </Button>
                </>
              )}
            </DialogActions>
          )}
        </form>
      </Dialog>
    </React.Fragment>
  );
};

const mapStateToProps = (state) => ({
  loggedInUserData: state.site.loggedInUserData,
  rootFolder: state.site.rootFolder,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
  ManagerList: state.userReducer.ManagerList,
  siteAssets: state.site.siteAssets,
});
export default connect(mapStateToProps, {
  getDocumentsRootFolder,
  getManagerList,
  getSiteAssets,
  deleteScheduleVisit,
  terminateContractCall,
  updateScheduleVisit,
})(ManagerContractView);
