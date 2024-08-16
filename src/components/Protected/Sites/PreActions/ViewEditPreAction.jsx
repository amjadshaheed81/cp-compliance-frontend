import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import { CSVLink } from "react-csv";
import moment from "moment";
import Header from "../../../common/Header/Header";
import BreadCrumHeader from "../../../common/BreadCrumHeader/BreadCrumHeader";
import SidebarNew from "../../../common/Sidebar/SidebarNew";
import Tooltip from "@mui/material/Tooltip";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useNavigate, useSearchParams } from "react-router-dom";
import siteDummy from "../../../../images/site-dummy.png";
import { useForm } from "react-hook-form";
import { InputError } from "../../../common/InputError";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import { Box, Button, CircularProgress } from "@mui/material";
import { createUpdatePreActions } from "../../../../store/thunk/preActions";
import { get, put, putMultiPartFormData } from "../../../../api";
import { getSiteAssets, setLoader } from "../../../../store/thunk/site";

const ViewEditPreAction = ({
  createUpdatePreActions,
  loggedInUserData,
  siteSelectedForGlobal,
  siteAssets,
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

  useEffect(() => {
    getActionIdDetails();
    getSiteAssets(siteSelectedForGlobal?.siteId)
  }, []);


  useEffect(()=>{
    if(siteAssets?.length > 0) {
      setAssetOptions(siteAssets?.map(itm => {
        return { title: itm?.assetName, id: itm?.assetId}
      }))
    }
  }, [siteAssets]);


  const getActionIdDetails = async () => {
    const actionDetail = await get(`/api/action/${actionId}/details`);
    reset(actionDetail);
    setassets(actionDetail?.taggedAsset ? actionDetail?.taggedAsset?.split(",") : []);
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

  
  const approveCreateAction = async () => {
    
    const data = {
      status: "Pending Action",
      approverNotes: getValues("approverNotes"),
    };
    if(data.approverNotes === '' || data.approverNotes === undefined || data.approverNotes === null) {
      toast.error("Please enter approver notes");
      return;
    }
    setIsLoading(true);
    try {
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
  };
  const markAsClosed = async () => {
    let form_data = new FormData();
    const actionImage = getValues("closeActionImage");
    console.log("actionImage", actionImage);
    const data = {
      status: "Closed",
      actionTaken: getValues("actionTaken"),
    };
    try {
      setIsLoading(true);
      form_data.append("actionImage", actionImage?.[0], "actionImage");
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
  return (
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
                          disabled={viewMode === "viewOnly" || "markApproved"}
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
                          value={
                            assetOptions.filter(a=> assets.includes(String(a.id))).map(a=> a.title).join(",")
                          }
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
                            disabled={viewMode === "viewOnly" || "markApproved"}
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
  );
};
const mapStateToProps = (state) => ({
  loggedInUserData: state.site.loggedInUserData,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
  siteAssets: state.site.siteAssets,
});
export default connect(mapStateToProps, {
  createUpdatePreActions,
})(ViewEditPreAction);
