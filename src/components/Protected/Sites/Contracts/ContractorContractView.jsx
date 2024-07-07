import React, { Fragment, useEffect, useState } from "react";
import { Button, Box, Tooltip } from "@mui/material";
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
import AddAssets from "./AddAssets";
import { get, put } from "../../../../api";
import ChipComponent from "../../../common/Chips/Chips";
import BusinessIcon from "@mui/icons-material/Business";
import moment from "moment";

const ContractorContractView = ({
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
  const [companies, setCompanies] = useState([]);
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
  } = useForm({});
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
      company: data?.contractorCompanyId,
      startDate: data?.startDate?.split("T")?.[0],
      endDate: data?.endDate?.split("T")?.[0],
    });
    setCurrentContract(data);
  };
  const getCompanies = async () => {
    const companiesData = await get(`/api/user/companies`);
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
        projectContractId: null,
        summary: data?.summary,
        siteId: siteSelectedForGlobal?.siteId,
        category: data?.category || "",
        subCategory: data?.subCategory || "",
        contractorCompanyId: data?.company ? Number(data?.company) : null,
        status: "Active",
        budget: data?.cost,
        cost: data?.cost,
        startDate: `${data?.startDate} 10:00:00`,
        endDate: `${data?.endDate} 10:00:00`,
        projectManagerUserId: data?.manager ? Number(data?.manager) : null,
        description: data?.description,
      };
      const url = "api/project/manage";
      const res = await put(url, formData);
      if (res?.status === 200) {
        let mandatoryFolders = selectedMandatoryFolder?.map((itm) => {
          if (!itm?.isSaved) {
            return itm.id;
          }
        });
        if (mandatoryFolders.length > 0) {
          const folders = {
            mandatoryFolders: mandatoryFolders,
            removeMandatoryFolders: null,
          };
          const folderApi = await put(
            `api/project/${res?.data?.projectContractId}/folders`,
            folders
          );
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
  return (
    <React.Fragment>
      <Dialog open={showAddModal} onClose={handleClose} maxWidth="lg" fullWidth>
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
                  <div className="col">
                    <ChipComponent status={currentContract?.status} />
                    &nbsp;
                    <BusinessIcon />
                    &nbsp;
                    <span>{currentContract?.siteName}</span>
                  </div>
                  <div className="col-md-12">
                    <div className="row">
                      <div className="col-md-3">
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
                      <div className="col-md-3">
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
                      <div className="col-md-3">
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
                      <div className="col-md-3">
                        <label for="company">Company</label>
                        <select
                          name="company"
                          className="form-control form-select"
                          id="company"
                          {...register("company", {
                            required: {
                              value: true,
                              message: `Please select company`,
                            },
                          })}
                        >
                          <option value="" selected disabled>
                            Select company
                          </option>
                          {companies?.map((itm) => (
                            <option value={itm?.userId}>
                              {itm?.companyName}
                            </option>
                          ))}
                        </select>
                        {errors?.company && (
                          <InputError
                            message={errors?.company?.message}
                            key={errors?.company?.message}
                          />
                        )}
                      </div>
                      <div className="col-md-3">
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
                      <div className="col-md-3">
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
                      <div className="col-md-3">
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
                      <div className="col-md-3">
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
                      <div className="col-md-6">
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
                      </tr>
                    </thead>
                    <tbody>
                      {currentContract?.projectContractFolders?.length ===
                        0 && (
                        <tr>
                          <td>No Folders are available to select file</td>
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
                            />
                          </td>
                          <td>
                            {itm?.floorPlanUrl ? (
                              <a
                                className="btn btn-sm btn-light"
                                download
                                href={itm?.files}
                              >{`${itm?.name}.png`}</a>
                            ) : null}
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
                        <td>Asset Reference</td>
                        <td>Location</td>
                        <td>Category</td>
                        <td>Action</td>
                      </tr>
                    </thead>
                    <tbody>
                      {currentContract?.projectContractAssets?.length === 0 && (
                        <tr>
                          <td>No Assets are available</td>
                        </tr>
                      )}
                      {currentContract?.projectContractAssets?.map((itm) => (
                        <tr key={itm?.assetId}>
                          <td>{itm?.assetName}</td>
                          <td>{itm?.model}</td>
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
                              href={`/#/update-asset?assetId=${itm?.assetId}`}
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
                  <div className="col-6">
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
                          {currentContract?.projectContractScheduleVisits
                            ?.length === 0 && (
                            <tr>
                              <td>No Assets are available</td>
                            </tr>
                          )}
                          {currentContract?.projectContractScheduleVisits?.map(
                            (itm) => (
                              <tr key={itm?.scheduleId}>
                                <td>
                                  {moment(itm?.visitDate).format("DD-MM-YYYY")}
                                </td>
                                <td>{itm?.status}</td>
                                <td>
                                  <a
                                    target="_blank"
                                    href={`/#/update-asset?assetId=${itm?.assetId}`}
                                  >
                                    <i className="fas fa-eye"></i>
                                  </a>
                                </td>
                              </tr>
                            )
                          )}
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
              <Button type="submit" className="bg-primary text-white">
                Save
              </Button>
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
})(ContractorContractView);
