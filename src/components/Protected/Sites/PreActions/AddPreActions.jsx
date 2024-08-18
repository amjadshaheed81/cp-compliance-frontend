import React, { Fragment, useEffect, useState } from "react";
import { Button, Box } from "@mui/material";
import { connect } from "react-redux";
import { useForm } from "react-hook-form";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import CircularProgress from "@mui/material/CircularProgress";
import DialogTitle from "@mui/material/DialogTitle";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import { InputError } from "../../../common/InputError";
import { createUpdatePreActions } from "../../../../store/thunk/preActions";
import { getSiteAssets, setLoader } from "../../../../store/thunk/site";
import { toast } from "react-toastify";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";

const AddPreActions = ({
  showAddModal,
  setShowAddModal,
  refresh,
  createUpdatePreActions,
  loggedInUserData,
  setLoader,
  siteSelectedForGlobal,
  getSiteAssets,
  siteAssets,
}) => {
  const handleOpen = () => setShowAddModal(true);
  const handleClose = () => setShowAddModal(false);
  const [value, setValue] = useState([]);
  const [assetOptions, setAssetOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    reset,
    watch,
    formState: { errors },
    handleSubmit,
  } = useForm({});
  const values = watch();
  useEffect(() => {
    // reset(selectedUser);
    getSiteAssets(siteSelectedForGlobal?.siteId)
  }, []);
  useEffect(()=>{
    if(siteAssets?.length > 0) {
      setAssetOptions(siteAssets?.map(itm => {
        return { title: itm?.assetName, id: itm?.assetId}
      }))
    }
  }, [siteAssets]);
  const submitPreActions = async (data) => {
    let form_data = new FormData();
    if (!siteSelectedForGlobal?.siteId) {
      toast.error("Please select site from site search to proceed.");
      return;
    }
    if (loggedInUserData?.id) {
      if (data?.actionImage) {
        form_data.append(
          "actionImage",
          data?.actionImage?.[0],
          data?.actionImage?.[0]?.name
        );
      } else {
        form_data.append("actionImage", "", "");
      }
      const { actionImage, ...formData } = data;
      form_data.append(
        "actionRequestString",
        JSON.stringify({
          ...formData,
          status: "Pending",
          actionId: null,
          raisedByUserId: loggedInUserData?.id,
          taggedAsset: value.map(v=> v.id).join(',')
        })
      );
      setIsLoading(true);
      await createUpdatePreActions(form_data, siteSelectedForGlobal?.siteId);
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
          <DialogTitle>Create New Pre-Action</DialogTitle>
          <DialogContent dividers>
            {isLoading && (
              <Box sx={{ display: "flex" }}>
                <CircularProgress />
              </Box>
            )}
            {!isLoading && (
              <Fragment>
                <div className="row">
                  <div className="col-md-8">
                    <div className="row">
                      <div className="col-md-6">
                        <label for="category">Internal/External</label>
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
                            Select Internal/External
                          </option>
                          <option value="Internal">Internal</option>
                          <option value="External">External</option>
                        </select>
                        {errors?.category && (
                          <InputError
                            message={errors?.category?.message}
                            key={errors?.category?.message}
                          />
                        )}
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mt-2">
                          <label for="floor">Floor</label>
                          <select
                            name="floor"
                            className="form-control form-select"
                            id="floor"
                            {...register("floor", {
                              required: {
                                value: true,
                                message: `Please select floor`,
                              },
                            })}
                          >
                            <option value="" selected disabled>
                              Select Floor
                            </option>
                            <option value={"Ground"}>Ground</option>
                            <option value={"First"}>First</option>
                            <option value={"Second"}>Second</option>
                            <option value={"Third"}>Third</option>`
                          </select>
                          {errors?.floor && (
                            <InputError
                              message={errors?.floor?.message}
                              key={errors?.floor?.message}
                            />
                          )}
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="form-group mt-2">
                          <label for="room">Room</label>
                          <select
                            name="room"
                            className="form-control form-select"
                            id="room"
                            {...register("room", {
                              required: {
                                value: true,
                                message: `Please select room`,
                              },
                            })}
                          >
                            <option value="" selected disabled>
                              Select Room
                            </option>
                            <option value="R101">R101</option>
                            <option value="R102">R102</option>
                            <option value="R103">R103</option>
                          </select>
                          {errors?.room && (
                            <InputError
                              message={errors?.room?.message}
                              key={errors?.room?.message}
                            />
                          )}
                        </div>
                      </div>

                      {/* <div className="col-md-6">
                        <div className="form-group mt-2">
                          <label for="status">Status</label>
                          <select
                            name="status"
                            className="form-control form-select"
                            id="status"
                            {...register("status", {
                              required: {
                                value: true,
                                message: `Please select room`,
                              },
                            })}
                          >
                            <option value="" selected disabled>
                              Select Status
                            </option>
                            <option value="New">New</option>
                          </select>
                          {errors?.status && (
                            <InputError
                              message={errors?.status?.message}
                              key={errors?.status?.message}
                            />
                          )}
                        </div>
                      </div> */}

                      <div className="col-md-12">
                        <div className="form-group mt-2 w-50">
                          <Autocomplete
                            multiple
                            id="fixed-tags-demo"
                            value={value}
                            onChange={(event, newValue) => {
                              console.log("newValue", newValue);
                              setValue([
                                ...newValue
                              ]);
                            }}
                            options={assetOptions}
                            getOptionLabel={(option) => option.title}
                            renderTags={(tagValue, getTagProps) =>
                              tagValue.map((option, index) => (
                                <Chip
                                  label={option.title}
                                  {...getTagProps({ index })}
                                />
                              ))
                            }
                            style={{ width: 500 }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Tag Asset"
                                placeholder="Tag Asset"
                              />
                            )}
                          />
                        </div>
                      </div>

                      <div className="col-md-12">
                        <div className="form-group mt-2">
                          <textarea
                            {...register("description")}
                            className="form-control form-text"
                            placeholder="Enter Notes..."
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div
                      className="uploading-outer"
                      style={{
                        backgroundColor: "#f1f5f9",
                        display: "block",
                      }}
                    >
                      <div className="uploadPhotoButton text-center">
                        <FileUploadOutlinedIcon
                          style={{
                            color: "blue",
                            position: "relative",
                            left: "50%",
                            transform: "translate(-50%, 0)",
                          }}
                        />
                        <input
                          className="uploadButton-input mt-4"
                          type="file"
                          name="actionImage"
                          accept="image/*, application/pdf"
                          id="actionImage"
                          {...register("actionImage", {
                            required: {
                              value: true,
                              message: `Please select action image`,
                            },
                          })}
                        />
                        <label
                          htmlFor="actionImage"
                          className="text-primary cursor mt-4"
                        >
                          Click to upload
                        </label>
                        &nbsp;
                        <span>or drag and drop</span>
                        <p>
                          SVG, PNG, JPG or GIF
                          <br />
                          (max 800 * 800 px)
                        </p>
                        {errors?.actionImage && (
                          <InputError
                            message={errors?.actionImage?.message}
                            key={errors?.actionImage?.message}
                          />
                        )}
                      </div>
                    </div>
                  </div>
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
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
  siteAssets: state.site.siteAssets,
});
export default connect(mapStateToProps, { createUpdatePreActions, setLoader, getSiteAssets })(
  AddPreActions
);
