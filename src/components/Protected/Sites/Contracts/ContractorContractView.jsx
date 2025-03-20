import React, { Fragment, useEffect, useState } from "react";
import { Button, Box, Tooltip, IconButton } from "@mui/material";
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
import {
  getDocumentsRootFolder,
  getSiteAssets,
} from "../../../../store/thunk/site";
import { getManagerList } from "../../../../store/thunk/user";
import { get, put, uploadPhoto } from "../../../../api";
import ChipComponent from "../../../common/Chips/Chips";
import BusinessIcon from "@mui/icons-material/Business";
import moment from "moment";
import { updateScheduleVisit } from "../../../../store/thunk/projects";
import Swal from "sweetalert2";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import PdfViewer from "../Documents/PdfViewer";
import ListStatusBadge from "../../../common/Alert/Status/ListStatusBadge";

const ContractorContractView = ({
  showAddModal,
  setShowAddModal,
  loggedInUserData,
  siteSelectedForGlobal,
  getDocumentsRootFolder,
  getManagerList,
  ManagerList,
  getSiteAssets,
  category,
  subCategory,
  selectedContract,
  updateScheduleVisit,
}) => {
  const handleClose = () => setShowAddModal(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentContract, setCurrentContract] = useState([]);
  const [contratorContracts, setContratorContracts] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [subCategoryList, setSubCategoryList] = useState([]);
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
    formState: { errors },
    handleSubmit,
  } = useForm({});
  useEffect(() => {
    if (siteSelectedForGlobal?.siteId) {
      getManagerList();
      getCompanies();
      getDocumentsRootFolder(siteSelectedForGlobal?.siteId);
      getSiteAssets(siteSelectedForGlobal?.siteId);
      getContractDetail();
    } else {
      toast.error("Please select site from site search.");
    }
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
      company: Number(data?.contractorCompanyId),
      startDate: data?.startDate?.split("T")?.[0],
      endDate: data?.endDate?.split("T")?.[0],
    });
    setCurrentContract(data);
    setContratorContracts(data?.contractorQuotes?.filter(itm => itm?.contractor === loggedInUserData?.name));
    setAssetData(data?.projectContractAssets);
  };
  const getCompanies = async () => {
    const license = JSON.parse(localStorage.getItem('license'));
    const companiesData = await get("/api/companies/all?licenseId="+license?.licenseId);
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
  const fileSelect = (e, folderData) => {
    const data = {
      folderId: folderData.id,
      files: [
        {
          ...e?.target?.files[0],
          fileVersion: 1,
          siteId: currentContract?.siteId,
        },
      ],
    };
    data.files[0].name = e?.target?.files[0]?.name;
    data.files[0].originalFileName = e?.target?.files[0]?.name;
    submitFile(data, e?.target?.files[0]);
  };
  const submitFile = async (data, fileUpload) => {
    const reqData = {
      files: fileUpload,
      documentRequestString: {
        ...data,
      },
    };

    delete reqData.documentRequestString.files[0].fileUpload;

    reqData.documentRequestString.files[0].reviewerUserId =
      loggedInUserData?.id;
    reqData.documentRequestString.files[0].uploadDate =
      moment(new Date()).format("YYYY-MM-DD") + " 00:00:00";
    reqData.documentRequestString.files[0].issueDate =
      moment(new Date()).format("YYYY-MM-DD") + " 00:00:00";
    reqData.documentRequestString.files[0].expiryDate =
      moment(new Date()).add(1, "years").format("YYYY-MM-DD") + " 00:00:00";
    const url = `/api/document/files/upload`;
    const formData = new FormData();
    formData.append("files", reqData?.files);
    formData.append(
      "documentRequestString",
      JSON.stringify(reqData?.documentRequestString)
    );
    try{
      await uploadPhoto(url, formData);
      getContractDetail();
      setIsLoading(false);
      toast.success("File uploaded successfully");
    } catch(e) {
      setIsLoading(false);
      toast.error("File is now uploaded. Please try again");
    }
  };
  const submitUpdateContract = async (data) => {
    setIsLoading(true);
    const quotation = {
      quoteId: null,
      contractor: loggedInUserData?.name,
      company: loggedInUserData?.companyName,
      quote: Number(data?.quote || 0),
      notes: data?.quoteNote,
      quoteDate: moment(new Date()).format("YYYY-MM-DD") + "T10:00:00",
      status: 'Recieved',
      projectContractId: selectedContract?.projectContractId,
    }
    // let form_data = new FormData();
    if (!siteSelectedForGlobal?.siteId) {
      toast.error("Please select site from site search to proceed.");
      return;
    }
    if (loggedInUserData?.id) {
      const formData = {
        projectContractId: currentContract?.projectContractId,
        summary: data?.summary,
        siteId: siteSelectedForGlobal?.siteId,
        category: data?.category || "",
        subCategory: data?.subCategory || "",
        contractorCompanyId: data?.company || "",
        status: currentContract?.status,
        budget: data?.budget,
        startDate: `${data?.startDate} 10:00:00`,
        endDate: `${data?.endDate} 10:00:00`,
        projectManagerUserId: data?.manager ? Number(data?.manager) : null,
        description: data?.description,
        contractorQuotes: [...data?.contractorQuotes, {...quotation}],
        frequency: data?.frequency,
      };
      const url = "api/project/manage";
      const res = await put(url, formData);
      if (res?.status === 200) {
        if (data?.category !== "Building Project") {
          let assets = assetData?.map((itm) => {
            if (!itm?.isSaved) {
              return itm.assetId;
            }
          }).filter(function (el) {
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
        toast.success("Successully updated quatation.");
        getContractDetail();
        reset({
          quote: '',
          quoteNote: '',
        })
      } else {
        toast.error(
          "Something went wrong while adding contract. Please try again!!"
        );
      }
      setIsLoading(false);
    } else {
      toast.error("Please login with valid user details to proceed.");
    }
    setIsLoading(false);
  };
  const requestReschedule = async (itm, newDate) => {
    const data = {
      ...itm,
      status: "Reschedule Requested",
      visitDate: `${itm?.visitDate?.split("T")?.[0]} 10:00:00`,
      rescheduleDate: `${newDate} 10:00:00`,
      projectContractId: selectedContract?.projectContractId,
    };
    Swal.fire({
      target: document.getElementById("Modal-container"),
      title: `Do you want to reschedule your visit to ${newDate}?`,
      showDenyButton: false,
      showCancelButton: true,
      confirmButtonText: "Reschedule Visit",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const res = await updateScheduleVisit(data);
        if (res == "Success") {
          getContractDetail();
          toast.success(
            `Visit has been successfully rescheduled to ${newDate}.`
          );
        } else {
          toast.error("Something went wrong while visit schedule update.");
        }
      } else if (result.isDenied) {
        // Swal.fire("Changes are not saved", "", "info");
      }
    });
  };
  const markCompletedVisit = async (itm) => {
    const data = {
      ...itm,
      status: "Completed",
      projectContractId: selectedContract?.projectContractId,
      visitDate: `${itm?.visitDate?.split("T")?.[0]} 10:00:00`,
    };
    Swal.fire({
      target: document.getElementById("Modal-container"),
      title: `Do you want to mark complete ${
        itm?.rescheduleDate
          ? moment(itm?.rescheduleDate).format("DD-MM-YYYY")
          : moment(itm?.visitDate).format("DD-MM-YYYY")
      } visit ?`,
      showDenyButton: false,
      showCancelButton: true,
      confirmButtonText: "Mark Visit Complete",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const res = await updateScheduleVisit(data);
        if (res == "Success") {
          getContractDetail();
          toast.success("Visit has been successfully marked completed.");
        } else {
          toast.error("Something went wrong while visit schedule update.");
        }
      } else if (result.isDenied) {
        // Swal.fire("Changes are not saved", "", "info");
      }
    });
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
        <form onSubmit={handleSubmit(submitUpdateContract)}>
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
autoComplete="off"
          readOnly
          onFocus={(e) => e.target.removeAttribute("readonly")}
                            className="form-control"
                            id="summary"
                            disabled
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
                          disabled
                          {...register("category", {
                            required: {
                              value: true,
                              message: `Please select category`,
                            },
                          })}
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
                          disabled
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
                          {subCategoryList?.map((itm) => (
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
                        <input
                          type="text"
autoComplete="off"
          readOnly
          onFocus={(e) => e.target.removeAttribute("readonly")}
                          className="form-control"
                          id="contractorCompanyName"
                          disabled
                          {...register("contractorCompanyName")}
                        />
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
                      {/* <div className="col-md-3 mt-2">
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
                      </div> */}
                      <div className="col-md-3 mt-2">
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
                    </div>
                  </div>
                </div>
                {/* Mandatory folder upload */}
                <div className="table-responsive mt-2">
                  <table className="table">
                    <thead className="table-dark">
                      <tr>
                        <td>Mandatory Folders</td>
                        <td>File (PDF &lt; 1 MB)</td>
                        <td>Uploaded Version</td>
                      </tr>
                    </thead>
                    <tbody>
                      {currentContract?.projectContractFolders == null && (
                        <tr>
                          <td>No Folders are available to upload file</td>
                        </tr>
                      )}
                      {currentContract?.projectContractFolders?.map((itm) => (
                        <tr key={itm?.id}>
                          <td>{itm?.name}</td>
                          <td>
                            <input
                              {...register(`folderImage-${itm?.id}`)}
                              className="form-control"
                              type="file"
                              name={`folderImage-${itm?.id}`}
                              accept="image/*, application/pdf"
                              id={`folderImage-${itm?.id}`}
                              onChange={(e) => fileSelect(e, itm)}
                            />
                          </td>
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
                {/* Mandatory folder upload */}
                <div className="table-responsive mt-2">
                  <div>Assets</div>
                  <table className="table">
                    <thead className="table-dark">
                      <tr>
                        <td>Asset Name</td>
                        <td>Asset ID</td>
                        <td>Location</td>
                        <td>Category</td>
                        <td>Action</td>
                      </tr>
                    </thead>
                    <tbody>
                      {!currentContract?.projectContractAssets && (
                        <tr>
                          <td>No Assets are available</td>
                        </tr>
                      )}
                      {currentContract?.projectContractAssets?.map((itm) => (
                        <tr key={itm?.assetId}>
                          <td>{itm?.assetName}</td>
                          <td>{itm?.assetId}</td>
                          <td>
                            {itm.position ? `${itm.position}` : ""}
                            {itm.floor ? ` > ${itm.floor}` : ""}
                            {itm.room ? ` > ${itm.room}` : ""}
                          </td>
                          <td>
                            {itm.category ? `${itm.category}` : ""}
                            {itm.subCategory ? ` > ${itm.subCategory}` : ""}
                            {itm.subCategor2 ? ` > ${itm.subCategor2}` : ""}
                          </td>

                          <td>
                            <a
                              target="_blank"
                              href={`/#/view-asset?assetId=${itm?.assetId}`}
                            >
                              <i className="fas fa-eye"></i>
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mandatory folder upload */}
                <div className="row">
                  <div className="col-md-6">
                    <div className="table-responsive mt-2">
                      <div>Schedule Visit</div>
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
                                    moment(itm?.visitDate).format("DD-MM-YYYY")
                                  )}
                                </td>
                                <td>{itm?.status}</td>
                                <td>
                                  {itm?.status !== "Completed" ? (
                                    <>
                                      <DatePicker
                                        onChange={(value) =>
                                          requestReschedule(
                                            itm,
                                            moment(value).format("YYYY-MM-DD")
                                          )
                                        }
                                        customInput={
                                          <IconButton>
                                            <i className="fas fa-calendar"></i>
                                          </IconButton>
                                        }
                                      />
                                      &nbsp;
                                      <Tooltip
                                        title={`Mark Visit Complete`}
                                        arrow
                                      >
                                        <button
                                          type="button"
                                          className="btn btn-sm btn-light text-primary"
                                          onClick={() =>
                                            markCompletedVisit(itm)
                                          }
                                        >
                                          <i className="fas fa-check"></i>
                                        </button>
                                      </Tooltip>
                                    </>
                                  ) : null}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                {/** END mandatory folder */}

                {/* Add Contractor */}
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
                            <td>Note</td>
                            <td>Manager Note</td>
                            <td>Status</td>
                          </tr>
                        </thead>
                        <tbody>
                          {contratorContracts?.length === 0 && (
                            <tr>
                              <td colSpan={6}>
                                No Contractor Quotation are available
                              </td>
                            </tr>
                          )}
                          {contratorContracts?.map((itm) => (
                            <tr key={itm?.quote}>
                              <td>
                                {itm?.contractor ? itm?.contractor : "--"}
                              </td>
                              <td>{itm?.company ? itm?.company : "--"}</td>
                              <td>{itm?.quote ? itm?.quote : "--"}</td>
                              <td>
                                {itm?.quoteDate
                                  ? moment(itm?.quoteDate).format("DD-MM-YYYY")
                                  : "--"}
                              </td>
                              <td>{itm?.notes ? itm?.notes : "--"}</td>
                              <td>{itm?.managerNotes ? itm?.managerNotes : "--"}</td>
                              <td>
                                <ListStatusBadge status={itm?.status} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-12">
                    <div className="table-responsive mt-2">
                      <div>Add Contractor Quote</div>
                      <div className="row w-100">
                        <div className="col-md-3">
                          <div className="form-group mt-2 mb-2">
                            <label for="quote">Quote</label>
                            <input
                              type="number"
                              className="form-control"
                              min="0"
                              id="quote"
                              {...register("quote", {
                                required: {
                                  value: true,
                                  message: `Please enter quote`,
                                },
                                validate: (value) =>
                                  value > 0 ||
                                  "Quote cannot be zero or negative number",
                              })}
                            />
                            {errors?.quote && (
                              <InputError
                                message={errors?.quote?.message}
                                key={errors?.quote?.message}
                              />
                            )}
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="form-group mt-2 mb-2">
                            <label for="quote">Note</label>
                            <input
                              type="text"
autoComplete="off"
          readOnly
          onFocus={(e) => e.target.removeAttribute("readonly")}
                              className="form-control"
                              min="0"
                              id="quoteNote"
                              {...register("quoteNote", {
                                required: {
                                  value: true,
                                  message: `Please enter quote note`,
                                },
                              })}
                            />
                            {errors?.quoteNote && (
                              <InputError
                                message={errors?.quoteNote?.message}
                                key={errors?.quoteNote?.message}
                              />
                            )}
                          </div>
                        </div>
                        <div>
                          <Button
                            type="submit"
                            className="bg-primary text-white"
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/** END contractor quote  */}
              </Fragment>
            )}
          </DialogContent>
          {!isLoading && (
            <DialogActions>
              <Button onClick={handleClose} className="bg-light text-primary">
                Close
              </Button>
              {/* <Button type="submit" className="bg-primary text-white">
                Save
              </Button>*/}
            </DialogActions>
          )}
        </form>
      </Dialog>
    </React.Fragment>
  );
};

const mapStateToProps = (state) => ({
  loggedInUserData: state.site.loggedInUserData,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
  ManagerList: state.userReducer.ManagerList,
});
export default connect(mapStateToProps, {
  getDocumentsRootFolder,
  getManagerList,
  getSiteAssets,
  updateScheduleVisit,
})(ContractorContractView);
