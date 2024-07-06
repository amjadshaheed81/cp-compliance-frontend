import React, { Fragment, useEffect, useState } from "react";
import { Button, Box, Tooltip } from "@mui/material";
import { connect } from "react-redux";
import { useForm } from "react-hook-form";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import CircularProgress from "@mui/material/CircularProgress";
import DialogTitle from "@mui/material/DialogTitle";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import { InputError } from "../../../common/InputError";
import { toast } from "react-toastify";
import { Validation } from "../../../../Constant/Validation";
import {
  getDocumentsRootFolder,
  getSiteAssets,
} from "../../../../store/thunk/site";
import { getManagerList } from "../../../../store/thunk/user";
import AddAssets from "./AddAssets";

const AddContracts = ({
  showAddModal,
  setShowAddModal,
  refresh,
  createUpdatePreActions,
  loggedInUserData,
  siteSelectedForGlobal,
  rootFolder,
  getDocumentsRootFolder,
  getManagerList,
  ManagerList,
  getSiteAssets,
  siteAssets,
}) => {
  const handleOpen = () => setShowAddModal(true);
  const handleClose = () => setShowAddModal(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMandatoryFolder, setSelectedMandatoryFolder] = useState([]);
  const [selectedAssets, setSelectedAssets] = useState([]);
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
      getDocumentsRootFolder(siteSelectedForGlobal?.siteId);
      getSiteAssets(siteSelectedForGlobal?.siteId);
    } else {
      toast.error("Please select site from site search.");
    }
  }, []);
  const submitPreActions = async (data) => {
    // let form_data = new FormData();
    if (!siteSelectedForGlobal?.siteId) {
      toast.error("Please select site from site search to proceed.");
      return;
    }
    if (loggedInUserData?.id) {
      console.log("data", data);
      setIsLoading(false);
      handleClose();
      refresh();
    } else {
      toast.error("Please login with valid user details to proceed.");
    }
  };
  return (
    <React.Fragment>
      <Dialog open={showAddModal} onClose={handleClose} maxWidth="lg" fullWidth>
        <form onSubmit={handleSubmit(submitPreActions)}>
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
                        >
                          <option value="" selected disabled>
                            Select category
                          </option>
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
                    </div>
                  </div>
                  {/** Add Mandatory Folder */}
                  <div className="col-md-12 mt-2 mb-2">
                    Add Mandatory Folder
                  </div>
                  <div className="table-responsive">
                    <table className="table f-11">
                      <thead className="table-dark">
                        <tr>
                          <th scope="col">Folder</th>
                          <th scope="col">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rootFolder?.parentFolders?.map((folder, index) => (
                          <tr>
                            <td>
                              <i
                                style={{ color: "#384BD3" }}
                                className="fas fa-folder fa-2x"
                              ></i>
                              <span className="p-3">{folder?.name}</span>
                            </td>
                            <td>
                              <span
                                className="text-primary cursor"
                                onClick={() => {
                                  setSelectedMandatoryFolder([
                                    ...selectedMandatoryFolder,
                                    folder,
                                  ]);
                                }}
                              >
                                <i className="fas fa-plus" size="sm"></i>
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div>
                    {selectedMandatoryFolder?.map((itm) => (
                      <Fragment>
                        <span className="bg-light text-primary cursor h6 p-2">
                          {itm?.name}{" "}
                          <i
                            className="fas fa-times"
                            size="sm"
                            onClick={() => {
                              setSelectedMandatoryFolder(
                                selectedMandatoryFolder?.filter(
                                  (value) => value?.id != itm?.id
                                )
                              );
                            }}
                          ></i>
                        </span>
                        &nbsp;
                      </Fragment>
                    ))}
                  </div>
                  {/** Add Assets start */}
                  <div className="d-flex bd-highlight">
                    <div className="pt-2 bd-highlight">
                      <div className="row">
                        <div className="col">Add Asset</div>
                      </div>
                    </div>
                    <div className="ms-auto p-2 bd-highlight">
                      <div className="row" style={{ height: "auto" }}>
                        <div className="col">
                          <div className="col">
                            <Tooltip title={`Add New row`} arrow>
                              <button
                                type="button"
                                className="btn btn-primary text-white pr-2"
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
                                <i className="fas fa-plus"></i>&nbsp; Add More
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
