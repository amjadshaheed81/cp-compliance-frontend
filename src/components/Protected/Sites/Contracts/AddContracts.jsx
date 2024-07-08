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
import MandatoryFolders from "./MandatoryFolders";

const AddContracts = ({
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
}) => {
  const handleOpen = () => setShowAddModal(true);
  const handleClose = () => setShowAddModal(false);
  const [showMandatoryModal, setShowMandatoryModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMandatoryFolder, setSelectedMandatoryFolder] = useState([]);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [subCategoryList, setSubCategoryList] = useState([]);
  const [subCategoryListData, setSubCategoryListData] = useState([]);
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
    setValue,
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
      setIsLoading(true);
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
        if (data?.category !== "Building Project") {
          let assets = assetData?.map((itm) => {
            if (!itm?.isSaved) {
              return itm.assetId;
            }
          });
          if (assets.length > 0) {
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
        
        if (data?.scheduleDate) {
          const scheduleData = {
            scheduleId: null,
            projectContractId: res?.data?.projectContractId,
            visitPurpose: "Inspection",
            status: "Scheduled",
            visitDate: `${data?.scheduleDate} 10:00:00`,
            rescheduleDate: "",
          };
          const scheduleVisitApi = await put(
            `api/project/visits`,
            scheduleData
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
  const categoryChange = (e) => {
    const val = e.target.value;
    setValue("category", val, { shouldValidate: true });
    const subCategoryData = subCategoryList?.filter(
      (itm) => itm?.attribite1 === val
    );
    setSubCategoryListData(subCategoryData);
  };
  return (
    <React.Fragment>
      <Dialog open={showAddModal} onClose={handleClose} maxWidth="lg" fullWidth>
        <form onSubmit={handleSubmit(submitAddContract)}>
          <DialogTitle>New Contract</DialogTitle>
          <DialogContent dividers>
            {isLoading && (
              <Box sx={{ display: "flex" }}>
                <CircularProgress />
              </Box>
            )}

            {!isLoading && (
              <Fragment>
                <div className="row">
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
                      {subCategoryListData?.length > 0 && (
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
                      )}
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
                      <div className="col-md-3">
                        <MandatoryFolders
                          setSelectedMandatoryFolder={
                            setSelectedMandatoryFolder
                          }
                          selectedMandatoryFolder={selectedMandatoryFolder}
                        />
                      </div>
                    </div>
                  </div>
                  {/** Add Assets start */}
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
                                        const d = [...assetData];
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
                        {/* schedule date */}
                        <div className="col-md-3">
                          <div className="form-group">
                            <label for="scheduleDate">Schedule Visit</label>
                            <input
                              type="date"
                              className="form-control date-input"
                              id="scheduleDate"
                              {...register("scheduleDate")}
                            />
                          </div>
                        </div>
                      </Fragment>
                    )}
                </div>
              </Fragment>
            )}
          </DialogContent>
          {!isLoading && (
            <DialogActions>
              <Button onClick={handleClose} className="bg-light text-primary">
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-white">
                Submit
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
})(AddContracts);
