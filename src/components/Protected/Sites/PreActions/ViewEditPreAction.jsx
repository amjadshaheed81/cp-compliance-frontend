import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import moment from "moment";
import Header from "../../../common/Header/Header";
import BreadCrumHeader from "../../../common/BreadCrumHeader/BreadCrumHeader";
import SidebarNew from "../../../common/Sidebar/SidebarNew";
import { toast } from "react-toastify";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { InputError } from "../../../common/InputError";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import {
  Box,
  Button,
  CircularProgress,
  DialogContent,
  DialogTitle,
  DialogActions,
  Dialog,
  Typography,
  Grid,
} from "@mui/material";
import { createUpdatePreActions } from "../../../../store/thunk/preActions";
import { get, put, putMultiPartFormData } from "../../../../api";
import { getSiteAssets, getSiteLayout, setLoader } from "../../../../store/thunk/site";

const ViewEditPreAction = ({
  createUpdatePreActions,
  loggedInUserData,
  siteSelectedForGlobal,
  siteAssets,
  siteLayout,
  getSiteLayout,
  getSiteAssets
}) => {
  const {
    register,
    reset,
    watch,
    getValues,
    formState: { errors },
    handleSubmit,
  } = useForm({});
  const values = watch();
  const [searchParams] = useSearchParams();
  const actionId = searchParams.get("id");
  const viewMode = searchParams.get("viewMode");
  const navigate = useNavigate();
  const goTo = (link) => {
    navigate(link);
  };

  const [assetOptions, setAssetOptions] = useState([]);
  const [assets, setassets] = useState([]);
  const [actionsPopup, setActionsPopup] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    getSiteAssets(siteSelectedForGlobal?.siteId);
    getActionIdDetails();
    getSiteLayout(siteSelectedForGlobal?.siteId);
  }, []);

  useEffect(() => {
    if (siteAssets?.length > 0) {
      setAssetOptions(
        siteAssets?.map((itm) => {
          return { title: itm?.assetName, id: itm?.assetId };
        })
      );
    }
  }, [siteAssets]);

  const getActionIdDetails = async () => {
    const actionDetail = await get(`/api/action/${actionId}/details`);
    reset(actionDetail);
    setassets(
      actionDetail?.taggedAsset ? actionDetail?.taggedAsset?.split(",") : []
    );
  };
  const [isLoading, setIsLoading] = useState(false);
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
          actionId: null,
          raisedByUserId: loggedInUserData?.id,
        })
      );
      setIsLoading(true);
      await createUpdatePreActions(form_data, siteSelectedForGlobal?.siteId);
      setIsLoading(false);
    } else {
      toast.error("Please login with valid user details to proceed.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const udata = {
      ...formData,
      [name]: value,
    };
    setFormData(udata);
  };

  const approveCreateAction = async () => {
    const data = {
      status: "Pending Action",
      approverNotes: getValues("approverNotes"),
    };
    setActionsPopup(true);
    //setIsLoading(true);
    // try {
    //   const res = await put(`api/action/${actionId}/approve`, data);

    //   if (res?.status === 200) {
    //     toast.success("Successfully approved the pre action.");
    //     goTo("/pre-actions");
    //   } else {
    //     toast.error("Something went wrong while updating pre action.");
    //   }
    //   setIsLoading(false);
    // } catch (e) {
    //   setIsLoading(false);
    //   toast.error("Something went wrong while updating pre action.");
    // }
  };
  const markAsClosed = async () => {
    let form_data = new FormData();
    const actionImage = getValues("closeActionImage");
    const data = {
      status: "Closed",
      actionTaken: getValues("actionTaken"),
    };
    try {
      setIsLoading(true);
      if (actionImage.length > 0) {
        form_data.append("actionImage", actionImage?.[0], "actionImage");
      }
      form_data.append("closeActionRequestString", JSON.stringify({ ...data }));
      const res = await putMultiPartFormData(
        `api/action/${actionId}/close`,
        form_data
      );
      if (res?.status === 200) {
        toast.success("Successfully closed the pre action.");
        goTo("/pre-actions");
      } else {
        toast.error("Something went wrong while updating pre action.");
      }
      setIsLoading(false);
    } catch (e) {
      toast.error("Something went wrong while updating pre action.");
      setIsLoading(false);
    }
  };

  const dateFormat = (date) => {
    return moment(date, "YYYY-MM-DD").format("DD/MM/YYYY");
  };

  const saveAction = async (event) => {
    event.preventDefault();
    const form = event.target;
    if (!form.checkValidity()) {
      form.reportValidity();
    }
    setIsLoading(true);
    const body = {
      type: "ClientAction",
      status: "Reported",
      observation: formData.observation,
      desc: `Client Action - ${moment(new Date()).format("DD/MM/YYYY")}`,
      requiredAction: formData.requiredAction,
      riskScore: Number(formData.likelihood) * Number(formData.consequence),
      dueDate: new Date(),
      siteId: siteSelectedForGlobal?.siteId,
      userId: loggedInUserData?.id,
    };
    await put("/api/site/actions", body);

    try {
      const data = {
        status: "Pending Action",
        approverNotes: getValues("approverNotes"),
      };
      const res = await put(`api/action/${actionId}/approve`, data);

      if (res?.status === 200) {
        toast.success("Successfully approved the pre action.");
        goTo("/pre-actions");
      } else {
        toast.error("Something went wrong while updating pre action.");
      }
      setIsLoading(false);
    } catch (e) {
      setIsLoading(false);
      toast.error("Something went wrong while updating pre action.");
    }
    setActionsPopup(false);
  };
  return (
    <>
      <Dialog
        open={actionsPopup}
        onClose={() => {
          setActionsPopup(false);
        }}
        maxWidth="lg"
        fullWidth
      >
        <form onSubmit={saveAction}>
          <DialogTitle>Actions</DialogTitle>
          <DialogContent dividers>
            <Fragment>
              <Grid container>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Action
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Grid item xs={12} sm={12}>
                        <label htmlFor="consequence" name="consequence">
                          Consequence
                        </label>
                        <select
                          required
                          className="form-control form-select"
                          name="consequence"
                          onChange={(e) => handleInputChange(e)}
                        >
                          <option value="">Select </option>
                          {[1, 2, 3, 4, 5].map((num) => (
                            <option value={num}>{num} </option>
                          ))}
                        </select>
                      </Grid>
                      <Grid item xs={12} sm={12}>
                        <label htmlFor="likelihood" name="likelihood">
                          Likelihood
                        </label>
                        <select
                          required
                          className="form-control form-select"
                          name="likelihood"
                          onChange={(e) => handleInputChange(e)}
                        >
                          <option value="">Select </option>
                          {[1, 2, 3, 4, 5].map((num) => (
                            <option value={num}>{num} </option>
                          ))}
                        </select>
                      </Grid>
                    </Grid>
                    <Grid item xs={12} sm={8}>
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        p={2}
                        mb={2}
                        style={{
                          height: "290px",
                          marginTop: "-20px",
                        }}
                      >
                        <img
                          src="/RiskScore.png"
                          alt="Risk Score Matrix"
                          style={{ width: "100%", height: "100%" }}
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <label htmlFor="observation" name="observation">
                        Observation
                      </label>
                      <textarea
                        name="observation"
                        className="form-control"
                        id="observation"
                        rows="2"
                        required
                        //placeholder="Enter notes..."
                        onChange={(e) => handleInputChange(e)}
                        style={{
                          width: "100%",
                          padding: "10px",
                          margin: "8px 0",
                          borderRadius: "4px",
                          border: "1px solid #ccc",
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <label htmlFor="requiredAction" name="requiredAction">
                        Required Action
                      </label>
                      <textarea
                        name="requiredAction"
                        className="form-control"
                        id="requiredAction"
                        rows="2"
                        required
                        //placeholder="Enter notes..."
                        onChange={(e) => handleInputChange(e)}
                        style={{
                          width: "100%",
                          padding: "10px",
                          margin: "8px 0",
                          borderRadius: "4px",
                          border: "1px solid #ccc",
                        }}
                      />
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Fragment>
          </DialogContent>
          <DialogActions>
            <Button
              type="button"
              onClick={() => setActionsPopup(false)}
              className="bg-light text-primary"
            >
              Cancel
            </Button>
            <button
              type="submit"
              //onClick={addReadingSave}
              style={{
                width: "150px",
                marginBottom: "20px",
                margin: "10px",
                float: "right",
              }}
              className="btn btn-primary text-white pr-2"
            >
              Save
            </button>
          </DialogActions>
        </form>
      </Dialog>

      <Fragment>
        <SidebarNew />
        <div className="content">
          <Header />
          <div className="container-fluid">
            <BreadCrumHeader
              header={
                viewMode === "markApproved"
                  ? "Approve Pre Action"
                  : viewMode === "markClosed"
                  ? "Pre-Action Closure"
                  : "Update/View Pre Actions"
              }
              page={"Pre-Action / View"}
            />
            {/*  */}
            {/*  */}
            {/* row start*/}
            <Fragment>
              <form onSubmit={handleSubmit(submitPreActions)}>
                <div className="row">
                  <div className="col-md-8">
                    <div className="row">
                      <div className="col-md-6">
                        <label for="category">Internal/External</label>
                        <select
                          name="category"
                          className="form-control form-select"
                          id="category"
                          disabled={viewMode === "viewOnly" || "markApproved"}
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
                          <option value="Internal">
                          Internal
                          </option>
                          <option value="External" >
                          External
                          </option>
                          {siteLayout
                          .filter((site) => site.nodeType === "type")
                          .map((site) => (
                            <option value={site.id}>
                              {site.nodeName}
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
                      <div className="col-md-6">
                        <div
                          className="form-group mt-2"
                          style={{
                            display: viewMode === "viewOnly" ? "" : "none",
                          }}
                        >
                          <label for="room">Floor</label>
                          <input
                            className="form-control form-select"
                            type="text"
                            disabled
                            {...register("floor")}
                          />
                        </div>
                        <div
                          className="form-group mt-2"
                          style={{
                            display: viewMode === "viewOnly" ? "none" : "",
                          }}
                        >
                          <label for="room">Floor</label>
                          <select
                            name="floor"
                            className="form-control form-select"
                            id="floor"
                            disabled={viewMode === "viewOnly" || "markApproved"}
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
                            {siteLayout
                          .filter((site) => site.nodeType === "floor" )
                          .map((site) => (
                            <option value={site.nodeName}>
                              {site.nodeName}
                            </option>
                          ))}
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
                        <div
                          className="form-group mt-2"
                          style={{
                            display: viewMode === "viewOnly" ? "" : "none",
                          }}
                        >
                          <label for="room">Room</label>
                          <input
                            className="form-control form-select"
                            type="text"
                            disabled
                            {...register("room")}
                          />
                        </div>
                        <div
                          className="form-group mt-2"
                          style={{
                            display: viewMode === "viewOnly" ? "none" : "",
                          }}
                        >
                          <label for="room">Room</label>
                          <select
                            name="room"
                            className="form-control form-select"
                            id="room"
                            disabled={viewMode === "viewOnly" || "markApproved"}
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
                            {siteLayout
                          .filter((site) => site.nodeType === "room" )
                          .map((site) => (
                            <option value={site.nodeName}>
                              {site.nodeName}
                            </option>
                          ))}
                          </select>
                          {errors?.room && (
                            <InputError
                              message={errors?.room?.message}
                              key={errors?.room?.message}
                            />
                          )}
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="form-group mt-2">
                          <label for="status">Status</label>
                          <select
                            name="status"
                            className="form-control form-select"
                            id="status"
                            disabled={viewMode === "viewOnly" || "markApproved"}
                            {...register("status", {
                              required: {
                                value: true,
                                message: `Please select status`,
                              },
                            })}
                          >
                            <option value="" selected disabled>
                              Select Status
                            </option>
                            <option value="New">New</option>
                            <option value="Pending">Pending</option>
                            <option value="Pending Action">Pending Action</option>
                            <option value="Closed">Closed</option>
                          </select>
                          {errors?.status && (
                            <InputError
                              message={errors?.status?.message}
                              key={errors?.status?.message}
                            />
                          )}
                        </div>
                      </div>

                      <div className="col-md-12">
                        <div className="form-group mt-2 w-50">
                          <label for="taggedAsset">Tagged Asset</label>
                          <input
                            type="text"
                            className="form-control"
                            id="taggedAsset"
                            name="taggedAsset"
                            placeholder=""
                            disabled
                            value={assetOptions
                              .filter((a) => assets.includes(String(a.id)))
                              .map((a) => a.title)
                              .join(",")}
                            //disabled={viewMode === "viewOnly" || "markApproved"}
                            // {...register("taggedAsset", {
                            //   required: {
                            //     value: true,
                            //     message: `Please select asset`,
                            //   },
                            // })}
                          />
                          {/* {errors?.taggedAsset && (
                          <InputError
                            message={errors?.taggedAsset?.message}
                            key={errors?.taggedAsset?.message}
                          />
                        )} */}
                        </div>
                      </div>
                      {viewMode !== "markApproved" && (
                        <div className="col-md-12">
                          <div className="form-group mt-2">
                            <textarea
                              {...register("description")}
                              className="form-control form-text"
                              placeholder="Enter Notes..."
                              disabled={
                                viewMode === "viewOnly" || "markApproved"
                              }
                            ></textarea>
                          </div>
                        </div>
                      )}
                      {viewMode === "markApproved" && (
                        <div className="col-md-12">
                          <div className="form-group mt-2">
                            <textarea
                              {...register("approverNotes")}
                              className="form-control form-text"
                              placeholder="Enter Notes..."
                            ></textarea>
                          </div>
                        </div>
                      )}
                      {viewMode === "markClosed" && (
                        <>
                          <div className="col-md-12">
                            <div className="form-group mt-2">
                              <textarea
                                {...register("actionTaken")}
                                className="form-control form-text"
                                placeholder="Enter Notes..."
                              ></textarea>
                            </div>
                          </div>
                          <div className="col-md-12">
                            <div className="form-group mt-2">
                              <label
                                htmlFor="closeActionImage"
                                className="text-primary cursor mt-4"
                              >
                                Attach Evidence
                              </label>
                              <input
                                className="form-control"
                                type="file"
                                name="closeActionImage"
                                accept="image/*, application/pdf"
                                id="closeActionImage"
                                {...register("closeActionImage")}
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="col-md-4">
                    {values?.image &&
                      (viewMode === "viewOnly" || "markApproved") && (
                        <img
                          src={values?.image}
                          className="img img-responsive w-100"
                        />
                      )}
                    <div
                      className="uploading-outer"
                      style={{
                        backgroundColor: "#f1f5f9",
                        display:
                          viewMode === "viewOnly" || "markApproved"
                            ? "none"
                            : "block",
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
                  <div
                    className="col-md-12 mt-4"
                    style={{
                      display: viewMode === "viewOnly" ? "" : "none",
                    }}
                  >
                    <Button
                      onClick={() => window.history.back()}
                      className="bg-light text-primary"
                    >
                      Back
                    </Button>
                  </div>

                  <div
                    className="col-md-12"
                    style={{
                      display: viewMode === "viewOnly" ? "none" : "",
                    }}
                  >
                    {isLoading && (
                      <Box sx={{ display: "flex" }}>
                        <CircularProgress />
                      </Box>
                    )}
                    {!isLoading && (
                      <div className="float-end">
                        <Button
                          onClick={() => window.history.back()}
                          className="bg-light text-primary"
                        >
                          Cancel
                        </Button>
                        &nbsp;&nbsp;
                        <Button
                          style={{
                            display: viewMode !== "editOnly" ? "none" : "",
                          }}
                          type="submit"
                          className="bg-primary text-white"
                        >
                          Save
                        </Button>
                        <Button
                          type="button"
                          style={{
                            display: viewMode !== "markApproved" ? "none" : "",
                          }}
                          onClick={() => {
                            approveCreateAction();
                          }}
                          className="bg-primary text-white"
                        >
                          Approve &amp; Create Action
                        </Button>
                        <Button
                          type="button"
                          style={{
                            display: viewMode !== "markClosed" ? "none" : "",
                          }}
                          onClick={() => {
                            markAsClosed();
                          }}
                          className="bg-primary text-white"
                        >
                          Mark as closed
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </Fragment>

            {/* row end*/}
          </div>
        </div>
      </Fragment>
    </>
  );
};
const mapStateToProps = (state) => ({
  loggedInUserData: state.site.loggedInUserData,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
  siteAssets: state.site.siteAssets,
  siteLayout: state.site.siteLayout,
});
export default connect(mapStateToProps, {
  createUpdatePreActions,
  getSiteLayout,getSiteAssets
})(ViewEditPreAction);
