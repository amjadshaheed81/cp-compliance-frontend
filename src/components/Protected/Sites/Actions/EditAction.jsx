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
import Comments from "./Comments";
import {
  Box,
  Button,
  CircularProgress,
  Autocomplete,
  Chip,
  Checkbox,
  TextField
} from "@mui/material";
import { createUpdatePreActions } from "../../../../store/thunk/preActions";
import { get, put, putMultiPartFormData,uploadSiteCheckDoc, getSasToken, del } from "../../../../api";
import { getSiteAssets, setLoader, getSiteLayout } from "../../../../store/thunk/site";
import { isViewRoleForActions } from "../../../../utils/isManagerAdminLogin";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const EditAction = ({
  createUpdatePreActions,
  loggedInUserData,
  siteSelectedForGlobal,
  siteAssets,
  getSiteLayout,
  siteLayout,
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
  const navigate = useNavigate();
  const goTo = (link) => {
    navigate(link);
  };

  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    //arrows: true,
    //autoplay: true,
    autoplaySpeed: 3000,
    };

  const [managerList, setManagerList] = useState([]);
  const [assetOptions, setAssetOptions] = useState([]);
  const [assets, setassets] = useState([]);
  const [actionsPopup, setActionsPopup] = useState(false);
  const [formData, setFormData] = useState({});
  const [sasToken, setSasToken] = useState();
 

  useEffect(() => {
    getToken();
    getActionIdDetails();
    getManagerList();
    getSiteAssets(siteSelectedForGlobal?.siteId);
    getSiteLayout(siteSelectedForGlobal?.siteId);
  }, []);

  const getToken = async () => {
    const token = await getSasToken();
    setSasToken(token);
  }

  const getManagerList = async () => {
    const data = await get(
      `/api/user/all?siteId=${siteSelectedForGlobal?.siteId}`
    );
    setManagerList(data?.users?.sort((a, b) => {
      if (a.name < b.name) {
          return -1; // a comes before b
      }
      if (a.name > b.name) {
          return 1;  // b comes before a
      }
      return 0; // names are equal
  }) || []);
  };

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
    const actionDetail = await get(`/api/site/actions/id/${actionId}`);
    //reset(actionDetail);
    setFormData(actionDetail);
    setassets(
      actionDetail?.taggedAsset ? actionDetail?.taggedAsset?.split(",") : []
    );
  };

  const deleteActionImage = async (image)=>{
    await del(`/api/site/actions/image/${image.assetImageId}`);
    toast.success("Image deleted successfully")
    await getActionIdDetails()
    
  }

  
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

  const handleFileChange = (e) => {
   
    const udata = {
      ...formData,
      file: e.target.files[0],
    };
    setFormData(udata);
  };

  const approveCreateAction = async () => {
    const data = {
      status: "Pending Action",
      approverNotes: getValues("approverNotes"),
    };
    if (
      data.approverNotes === "" ||
      data.approverNotes === undefined ||
      data.approverNotes === null
    ) {
      toast.error("Please enter approver notes");
      return;
    }
    setActionsPopup(true);

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
    const data = { ...formData }
    if (data?.file?.name) {
      data.siteId = siteSelectedForGlobal?.siteId;
      data.actionImage = await uploadSiteCheckDoc(data);
      delete data.file;
    }
    toast.success("Action data saved")
    await put("/api/site/actions", data);
    goTo("/actions");
    //getActionIdDetails();

  };

  const getTimeRemaining2 = (creationDate, riskScore) => {

    const data = riskScore > 16
    ? {badgeColor : "danger", days : 5}
    : riskScore > 9
      ? {badgeColor : "warning", days : 30}
      : riskScore > 4
        ? {badgeColor : "info", days : 90}
        : {badgeColor : "success", days : 365}
    const dueDate = new Date(creationDate);
    dueDate.setDate(dueDate.getDate() + data.days);
    return dueDate;
  };

  const getUserName = (id) => {
    return managerList.filter(u => u.id === id)?.map(u => u.name);
  }
  const getTimeRemaining = (creationDate, riskScore) => {

    const data = riskScore > 16
    ? {badgeColor : "danger", days : 5}
    : riskScore > 9
      ? {badgeColor : "warning", days : 30}
      : riskScore > 4
        ? {badgeColor : "info", days : 90}
        : {badgeColor : "success", days : 365}
    const dueDate = new Date(creationDate);
    dueDate.setDate(dueDate.getDate() + data.days);
    const today = new Date();
    const timeRemaining = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    const status = timeRemaining < 0 ? `${timeRemaining * -1} Days Overdue` : `${timeRemaining} days remaining`;
  
   
  
    // Return the UI component
    return (
      <span
        style={{ width: '150px' }}
        className={`badge bg-${data.badgeColor} p-2 m-1 risk-span`}
      >
        {status}
      </span>
    );
  };

  return (
    <>

      <Fragment>
        <SidebarNew />
        <div className="content">
          <Header />
          <div className="container-fluid">
            <BreadCrumHeader
              header={
                "Update/View Actions"
              }
              page={"Pre-Action / View"}
            />
            <Fragment>
              <form onSubmit={handleSubmit(submitPreActions)}>
                <div className="row">
                  <div className="col-md-8">
                    <div className="row">

                      <div className="col-md-2">
                        <label for="actionId">Action Id</label>
                        <input
                          disabled
                          name="actionId"
                          className="form-control"
                          id="actionId"
                          value={formData?.actionId}
                        />
                      </div>

                      <div className="col-md-2">
                        <label for="actionId">Date Created</label>
                        <input
                          disabled
                          name="actionId"
                          className="form-control"
                          id="actionId"
                          value={dateFormat(formData?.createdAt ? formData?.createdAt : formData?.dueDate)}
                        />
                      </div>

                      <div className="col-md-2">
                        <label for="actionId">Due Date</label>
                        <input
                          disabled
                          name="actionId"
                          className="form-control"
                          id="actionId"
                          value={dateFormat(getTimeRemaining2(formData?.createdAt ? formData?.createdAt : formData?.dueDate, formData?.riskScore))}
                        />
                      </div>

                      <div className="col-md-1">
                        <label for="actionId">Risk</label>
                        <br />
                        <span
                          style={{ width: '60px' }}
                          className={`badge bg-${formData?.riskScore > 16
                            ? "danger"
                            : formData?.riskScore > 9
                              ? "warning"
                              : formData?.riskScore > 4
                                ? "info"
                                : "success"
                            } p-2 m-1 risk-span`}
                        >
                          {formData?.riskScore ?? 0}
                        </span>
                      </div>

                      <div className="col-md-2">
                        <label for="actionId">Status</label>
                        <br />
                        <span
                          style={{ width: '100px' }}
                          className={`badge bg-${formData?.status === "Completed" ||  formData?.status === "completed" ? "success" : "warning"
                            } p-2 m-1 risk-span`}
                        >
                          {formData?.status}
                        </span>
                       
                      </div>
                      {/* <div className="col-md-3">
                        <label for="actionId">Date Created</label>
                        <input
                          disabled
                          name="actionId"
                          className="form-control"
                          id="actionId"
                          value={dateFormat(formData?.createdAt ? formData?.createdAt : formData?.dueDate)}
                        />
                      </div> */}

                      <div className="col-md-2">
                        <label for="actionId">Time Remaning</label>
                        {getTimeRemaining(formData?.createdAt ? formData?.createdAt : formData?.dueDate, formData?.riskScore)}
                      </div>

                      {(formData?.status === "Completed" ||  formData?.status === "completed") && formData?.completedBy && <>
                      <div className="col-md-6">
                        <label for="actionId">Completed On</label>
                        <input
                          disabled
                          name="actionId"
                          className="form-control"
                          id="actionId"
                          value={dateFormat(formData?.completedAt)}
                        />
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mt-2">
                          <label for="desc">Completed By</label>
                          <input
                          disabled
                            name="desc"
                            className="form-control"
                            id="desc"
                            value={getUserName(formData?.completedBy)}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>


                      </>}



                      <div className="col-md-12">
                        <div className="form-group mt-2">
                          <label for="desc">Inspection Name</label>
                          <input
                          disabled
                            name="desc"
                            className="form-control"
                            id="desc"
                            value={formData?.desc}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="form-group mt-2">
                          <label for="observation">Observation</label>
                          <textarea
                          disabled
                            name="observation"
                            id="observation"
                            value={formData?.observation}
                            onChange={handleInputChange}

                            className="form-control form-text"
                          //placeholder="Enter Notes..."

                          ></textarea>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="form-group mt-2">
                          <label for="requiredAction">Required Actions</label>
                          <textarea
                          disabled
                            name="requiredAction"
                            id="requiredAction"
                            value={formData?.requiredAction}
                            onChange={handleInputChange}

                            className="form-control form-text"

                          ></textarea>
                        </div>
                      </div>

                      <div className="col-md-4">
                        <div className="form-group mt-2">
                          <label for="internalExternal">Internal/External</label>
                          <select
                            name="internalExternal"
                            disabled={isViewRoleForActions(loggedInUserData)}
                            className="form-control form-select"
                            id="internalExternal"
                            value={formData?.internalExternal}
                            onChange={handleInputChange}
                          >
                            <option value="">Select Internal/External</option>
                            <option value="Interior">Interior</option>
                            <option value="Exterior">Exterior</option>
                          
                          </select>

                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group mt-2">
                          <label for="floor">Floor</label>
                          <select
                            name="floor"
                            className="form-control form-select"
                            id="floor"
                            disabled={isViewRoleForActions(loggedInUserData)}
                            value={formData?.floor}
                            onChange={handleInputChange}
                          >
                            <option value="">Select Floor</option>
                            {siteLayout
                              //.filter((site) => site.nodeType === "floor")?
                              .filter(
                                (site) =>
                                  site.nodeType === "floor" &&
                                  site.parentNode === siteLayout.filter(s=> s.nodeName === formData?.internalExternal && s.nodeType === "type")[0]?.id
                              )
                              .map((site) => (
                                <option value={site.nodeName}>
                                  {site.nodeName}{" "}
                                </option>
                              ))}
                          </select>

                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group mt-2">
                          <label for="room">Room</label>
                          <select
                            name="room"
                            className="form-control form-select"
                            id="room"
                            disabled={isViewRoleForActions(loggedInUserData)}
                            value={formData?.room}
                            onChange={handleInputChange}
                          >
                            <option value="">Select Room</option>
                            {siteLayout
                            .filter(
                              (site) =>
                                site.nodeType === "room" &&
                                site.parentNode === siteLayout.filter(s=> s.nodeName === formData?.floor && s.nodeType === "floor")[0]?.id
                            )
                              //.filter((site) => site.nodeType === "room")?
                              .map((site) => (
                                <option value={site.nodeName}>
                                  {site.nodeName}
                                </option>
                              ))}
                          </select>

                        </div>
                      </div>

                     





                      <div className="col-md-12">
                        <div className="form-group mt-4">
                        <Autocomplete
                          multiple
                          disabled={isViewRoleForActions(loggedInUserData)}
                          value={siteAssets.filter(s => formData?.taggedAsset?.split(",")?.includes(s.assetId.toString())).map((option) => option.assetId)}
                        
                        //value={formData?.taggedAsset?.split(",").map(s=>Number(s))}
                        onChange={(event, newValue) => {
                          const uformData = { ...formData }
                          const assetsList = siteAssets;
                          if (
                            newValue.length === assetsList.length ||
                            (newValue.length === 1 &&
                              newValue[0] === "Select All")
                          ) {
                            uformData.taggedAsset = assetsList.filter(s => !uformData.taggedAsset?.split(",")?.includes(s.assetId.toString())).map(i => i.assetId).join(",")
                          } else if (
                            newValue.length === 0 ||
                            (newValue.includes("Select All"))
                          ) {
                            uformData.taggedAsset = ""
                          } else {                 
                            uformData.taggedAsset = newValue.filter((value) => value !== "Select All").join(",")                            
                          }
                          setFormData(uformData);
                        }}
                        options={[ "Select All", ...siteAssets
                          .map((option) => option.assetId)]}
                       
                        getOptionLabel={(option) =>
                          option === "Select All"
                            ? "Select All"
                            : siteAssets.filter((a) => a.assetId === option)
                            .map(option =>  option.assetId + " - " + option.assetName + " (" + `${option?.position || "NA"} > ${option?.floor || "NA"} > ${option?.room || "NA"}` + ")" )[0]
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                           label="Assets"
                           size="small"
                          />
                        )}
                        renderOption={(props, option, { selected }) => (
                          <li {...props}>
                            <Checkbox checked={selected} />
                            {option === "Select All"
                            ? "Select All"
                            : siteAssets.filter((a) => a.assetId === option).map(option =>  option.assetId + " - " + option.assetName + " (" + `${option?.position || "NA"} > ${option?.floor || "NA"} > ${option?.room || "NA"}` + ")" )[0]}
                          </li>
                        )}
                        renderTags={(value, getTagProps) => (
                          <Box
                            sx={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: 0.5,
                              maxHeight: 120, 
                              overflowY: 'auto', 
                              alignItems: 'flex-start',
                              alignContent: 'flex-start', 
                              padding: '4px 0',
                            }}
                          >
                            {value.map((option, index) => (
                              <Chip
                                key={index}
                                label={siteAssets.filter((a) => a.assetId === option).map(option =>  option.assetId + " - " + option.assetName + " (" + `${option?.position || "NA"} > ${option?.floor || "NA"} > ${option?.room || "NA"}` + ")" )[0]}
                                {...getTagProps({ index })}
                              />
                            ))}
                          </Box>
                        )}
                      />
                          {/* <Autocomplete
                            multiple
                            disabled={isViewRoleForActions(loggedInUserData)}
                            onChange={(event, item) => {
                              const uformData = { ...formData }
                              uformData.taggedAsset = item?.map(i => i.key).join(",");
                              setFormData(uformData);
                            }}
                            value={
                              siteAssets?.map((option) => ({
                                  key: option.assetId, 
                                  label: option.assetName + " - " + option.category
                                }))
                                .filter((option) => {
                                  const taggedAsset = formData?.taggedAsset?.split(",");
                                  return taggedAsset?.includes(String(option.key))
                                }) || null
                            }
                            //value={siteAssets.filter(s => formData?.taggedAssets?.split(",")?.includes(s.assetId.toString())).map((option) => { return { key: option.assetId, label: option.assetName + " - " + option.category } })}

                            options={siteAssets?.map((option) => { return { key: option.assetId, label: option.assetName + " - " + option.category } })}
                            getOptionLabel={(option) => option.label}

                            renderInput={(params) => (

                              <TextField
                                //required
                                {...params}
                                variant="outlined"
                                label="Asset"
                              />
                            )}
                          /> */}
                        </div>
                      </div>

                      {/* <div className="col-md-6">
                        <div className="form-group mt-2">
                          <label htmlFor="serviceProvider">Service Provider</label>
                          <Autocomplete
                            id="serviceProvider"
                            //value={managerList.filter(o => String(o.id) === String(formData?.serviceProvider)).map((option) => { return { key: option.id, label: option.role + ' - ' + option.name + ' (' + option.email + ')' + (option.companyName ? " - " + option.companyName : "") } })[0]}
                            value={
                              managerList
                                .map((option) => ({
                                  key: option.id,
                                  label: `${option.role} - ${option.name} (${option.email})${option.companyName ? " - " + option.companyName : ""}`,
                                }))
                                .find((option) => String(option.key) === String(formData?.serviceProvider)) || null
                            }
                            onChange={(event, item) => {
                              const uformData = { ...formData }
                              uformData.serviceProvider = item?.key;
                              setFormData(uformData);
                            }}
                            options={managerList.map((option) => { return { key: option.id, label: option.role + ' - ' + option.name + ' (' + option.email + ')' + (option.companyName ? " - " + option.companyName : "") } })}
                            getOptionLabel={(option) => option.label}
                            renderInput={(params) => (
                              <div ref={params.InputProps.ref} >
                                <input type="text"
autoComplete="off"
          readOnly
          onFocus={(e) => e.target.removeAttribute("readonly")}
                                  {...params.inputProps}
                                  required
                                  className="form-control"
                                  placeholder="Select User"
                                />
                              </div>
                            )}
                          />

                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="form-group mt-2">
                          <label htmlFor="competentPersons">Competent Persons</label>
                          <Autocomplete
                            id="competentPersons"
                            //value={managerList.filter(o => String(o.id) === String(formData?.competentPersons)).map((option) => { return { key: option.id, label: option.role + ' - ' + option.name + ' (' + option.email + ')' + (option.companyName ? " - " + option.companyName : "") } })[0]}
                            value={
                              managerList
                                .map((option) => ({
                                  key: option.id,
                                  label: `${option.role} - ${option.name} (${option.email})${option.companyName ? " - " + option.companyName : ""}`,
                                }))
                                .find((option) => String(option.key) === String(formData?.competentPersons)) || null
                            }
                            onChange={(event, item) => {
                              const uformData = { ...formData }
                              uformData.competentPersons = item?.key;
                              setFormData(uformData);
                            }}
                            options={managerList.map((option) => { return { key: option.id, label: option.role + ' - ' + option.name + ' (' + option.email + ')' + (option.companyName ? " - " + option.companyName : "") } })}
                            getOptionLabel={(option) => option.label}
                            renderInput={(params) => (
                              <div ref={params.InputProps.ref} >
                                <input type="text"
autoComplete="off"
          readOnly
          onFocus={(e) => e.target.removeAttribute("readonly")}
                                  {...params.inputProps}
                                  required
                                  className="form-control"
                                  placeholder="Select User"
                                />
                              </div>
                            )}
                          />

                        </div>
                      </div> */}

                    <div className="col-md-6">
                        <div className="form-group mt-2">
                          <label htmlFor="assignedTo">Assign To</label>
                          <Autocomplete
                            id="assignedTo"
                            value={
                              managerList
                                ?.map((option) => ({
                                  key: option.id,
                                  label: `${option.role} - ${option.name} (${option.email})${option.companyName ? " - " + option.companyName : ""}`,
                                }))
                                .find((option) => String(option.key) === String(formData?.assignedTo)) || null
                            }
                          //  value={managerList.filter(o => String(o.id) === String(formData?.assignedTo))
                          //   .map((option) => { return { key: option.id, label: option.role + ' - ' + option.name + ' (' + option.email + ')' + (option.companyName ? " - " + option.companyName : "") } })[0]}
                            onChange={(event, item) => {
                              const uformData = { ...formData }
                              uformData.assignedTo = item?.key;
                              setFormData(uformData);
                            }}
                            options={managerList.map((option) => { return { key: option.id, label: option.role + ' - ' + option.name + ' (' + option.email + ')' + (option.companyName ? " - " + option.companyName : "") } })}
                            getOptionLabel={(option) => option.label}
                            renderInput={(params) => (
                              <div ref={params.InputProps.ref} >
                                <input type="text"
autoComplete="off"
          readOnly
          onFocus={(e) => e.target.removeAttribute("readonly")}
                                  {...params.inputProps}
                                  required
                                  disabled={isViewRoleForActions(loggedInUserData)}
                                  className="form-control"
                                  placeholder="Select User"
                                />
                              </div>
                            )}
                          />

                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="form-group mt-2">
                          <label htmlFor="stakeholder">Stakeholder</label>
                          <Autocomplete
                            id="stakeholder"
                            //value={managerList.filter(o => String(o.id) === String(formData?.stakeholder)).map((option) => { return { key: option.id, label: option.role + ' - ' + option.name + ' (' + option.email + ')' + (option.companyName ? " - " + option.companyName : "") } })[0]}
                            value={
                              managerList
                                .map((option) => ({
                                  key: option.id,
                                  label: `${option.role} - ${option.name} (${option.email})${option.companyName ? " - " + option.companyName : ""}`,
                                }))
                                .find((option) => String(option.key) === String(formData?.stakeholder)) || null
                            }
                            onChange={(event, item) => {
                              const uformData = { ...formData }
                              uformData.stakeholder = item?.key;
                              setFormData(uformData);
                            }}
                            options={managerList.map((option) => { return { key: option.id, label: option.role + ' - ' + option.name + ' (' + option.email + ')' + (option.companyName ? " - " + option.companyName : "") } })}
                            getOptionLabel={(option) => option.label}
                            renderInput={(params) => (
                              <div ref={params.InputProps.ref} >
                                <input type="text"
autoComplete="off"
          readOnly
          onFocus={(e) => e.target.removeAttribute("readonly")}
                                  {...params.inputProps}
                                  disabled={isViewRoleForActions(loggedInUserData)}
                                  required
                                  className="form-control"
                                  placeholder="Select User"
                                />
                              </div>
                            )}
                          />

                        </div>
                      </div>

                      <div className="col-md-4">
                        <div className="form-group mt-2">
                        <Button
                          disabled={isViewRoleForActions(loggedInUserData)}
                          onClick={() => goTo("/site-contracts")}
                          className="bg-light text-primary"
                        >
                          Add Quote
                        </Button>

                        </div>
                      </div>


                      <div className="col-md-12">
                        <div className="form-group mt-2">
                          <br />
                          <h5>Comments </h5>
                          <Comments actionId={actionId}/>
                          {/* <label for="comments">Comments</label>
                          <textarea
                            name="comments"
                            id="comments"
                            value={formData?.comments}
                            onChange={handleInputChange}
                            className="form-control form-text"
                          ></textarea> */}
                        </div>
                      </div>




                    </div>
                  </div>
                  <div className="col-md-4 text-center mt-2">
                      <div className="form-group">
                        {formData?.images?.length > 1 && (
                          <Slider {...carouselSettings}>
                            {formData?.images?.map(i => (
                              <div>
                                <img
                                  src={i?.imageUrl + "?" + sasToken}
                                  className="img img-responsive border p-2 m-2 w-100"
                                  alt="Asset Image"
                                />
                                <button
                                  type="button"
                                  className="btn btn-sm btn-danger mb-2"
                                  onClick={() => {
                                    deleteActionImage(i);
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
                            ))}
                          </Slider>
                        )}
                        {formData?.images?.length === 1 && (
                          <img
                            src={formData?.images[0].imageUrl+ "?" + sasToken}
                            className="img img-responsive border p-2 m-2 w-100"
                          />)}
                          {formData?.images?.length === 1 &&
                           <button
                                  type="button"
                                  className="btn btn-sm btn-danger mb-2"
                                  onClick={() => {
                                    deleteActionImage(0);
                                  }}
                                >
                                  Delete
                                </button>}
                        <input
                          type="file"
                          multiple
                          className="form-control"
                          style={{ marginTop: '30px' }}
                          name="actionImage"
                          accept="image/*, application/pdf"
                          id="actionImage"
                          onChange={(e) => handleFileChange(e)}
                        />
                        
                      </div>
                      </div>
                  {/* <div className="col-md-4">
                    {formData?.actionImage && (
                      <img
                        src={formData?.actionImage+ "?" + sasToken}
                        className="img img-responsive w-100"
                      />
                    )}
                    <div
                      className="uploading-outer"
                      style={{
                        backgroundColor: "#f1f5f9",
                        display: formData?.actionImage
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
                          onChange={(e) => handleFileChange(e)}
                          
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
                        
                      </div>
                    </div>
                  </div> */}


                  <div
                    className="col-md-12"

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
                          style={{display: isViewRoleForActions(loggedInUserData) ? "none" : "" }}
                          onClick={(e) => saveAction(e)}
                          type="button"
                          className="bg-primary text-white"
                        >
                          Save
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
  getSiteLayout
})(EditAction);
