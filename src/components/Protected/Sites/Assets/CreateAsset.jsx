import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import Box from "@mui/material/Box";
import Header from "../../../common/Header/Header";
import BreadCrumHeader from "../../../common/BreadCrumHeader/BreadCrumHeader";
import SidebarNew from "../../../common/Sidebar/SidebarNew";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import siteDummy from "../../../../images/site-dummy.png";
import {
  addSiteAsset,
  getDocumentsRootFolder,
  getSiteAssets,
  setLoader,
} from "../../../../store/thunk/site";
import { Validation } from "../../../../Constant/Validation";
import { InputError } from "../../../common/InputError";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import {
  TextField,
  Autocomplete,
} from "@mui/material";

const CreateAsset = ({
  setLoader,
  siteSelectedForGlobal,
  getDocumentsRootFolder,
  rootFolder,
  addSiteAsset,
  getSiteAssets,
  siteAssets,
}) => {
  const [patRecord, setPatRecord] = useState([]);
  useEffect(() => {
    if (siteSelectedForGlobal?.siteId) {
      getDocumentsRootFolder(siteSelectedForGlobal?.siteId);
      getSiteAssets(siteSelectedForGlobal?.siteId);
    } else {
      toast.error("Please select site from site search to proceed....");
    }
  }, []);

  const addPatRecord = () => {
    setPatRecord([
      ...patRecord,
      {
        tester: "",
        testDate: "",
        nextTestDate: "",
      },
    ]);
  };
  const defaultValues = {
    assetId: null,
    assetName: "",
    manufacturer: "",
    category: "",
    subCategory: "",
    subCategory2: "",
    model: "",
    serialNumber: "",
    relatedAssetId: null,
    folderId: null,
    patItem: false,
    pfpItem: false,
    doorItem: false,
    barcode: "",
  };
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    getValues,
    setValue,
    watch,
  } = useForm({
    defaultValues,
  });
  const navigate = useNavigate();
  const goTo = (link) => {
    navigate(link);
  };
  const submitSiteAsset = (data) => {
    setLoader(true);
    console.log("data", data);
    let form_data = new FormData();
    if (data?.assetImage) {
      form_data.append(
        "assetImage",
        data?.assetImage?.[0],
        data?.assetImage?.[0]?.name
      );
    } else {
      form_data.append("assetImage", "", "");
    }
    const { assetImage, ...formData } = data;
    form_data.append("assetRequestString", JSON.stringify(formData));
    addSiteAsset(form_data, goTo, siteSelectedForGlobal?.siteId);
    // reset(defaultValues);
  };
  return (
    <Fragment>
      <SidebarNew />
      <div className="content">
        <Header />
        <div className="container-fluid">
          <BreadCrumHeader header={"Create New Asset"} page={"Asset Details"} />

          <Box sx={{ width: "100%", typography: "body1" }}>
            <form onSubmit={handleSubmit(submitSiteAsset)}>
              <div className="row p-2 border">
                <div className="col-md-12">
                  <div className="float-end">
                    <button type="button" className="btn btn-light mb-3 mr-4" onClick={() => window.history.back()}>
                      Close
                    </button>
                    &nbsp; &nbsp;
                    <button type="submit" className="btn btn-primary mb-3 mr-4">
                      Save
                    </button>
                  </div>
                </div>
                <div className="col-md-12 p-2">
                  <div className="row" style={{ height: "auto" }}>
                    <div className="col-md-8">
                      <div className="row">
                        <div className="col-md-6">
                          <div className="form-group mt-2">
                            <label for="assetName">Asset Name</label>
                            <input
                              type="text"
                              className="form-control"
                              id="assetName"
                              name="assetName"
                              placeholder=""
                              {...register("assetName", {
                                required: {
                                  value: true,
                                  message: `${Validation.REQUIRED} asset name`,
                                },
                              })}
                            />
                            {errors?.assetName && (
                              <InputError
                                message={errors?.assetName?.message}
                                key={errors?.assetName?.message}
                              />
                            )}
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group mt-2">
                            <label for="manufacturer">Manufacturer</label>
                            <input
                              type="text"
                              className="form-control"
                              id="manufacturer"
                              name="manufacturer"
                              placeholder=""
                              {...register("manufacturer", {
                                required: {
                                  value: true,
                                  message: `${Validation.REQUIRED} manufacturer`,
                                },
                              })}
                            />
                            {errors?.manufacturer && (
                              <InputError
                                message={errors?.manufacturer?.message}
                                key={errors?.manufacturer?.message}
                              />
                            )}
                          </div>
                        </div>

                        <div className="col-md-6">
                          <div className="form-group mt-2">
                            <label for="relatedAssetId">Related Asset</label>
                            <Autocomplete
                              value={siteAssets.find(asset => asset.assetId === getValues('relatedAssetId')) || null}
                              onChange={(event, newValue) => setValue('relatedAssetId', newValue)}
                              options={siteAssets}
                              getOptionLabel={(option) => option.assetName || ""}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  label="Select Asset"
                                  variant="outlined"
                                />
                              )}
                            />
                          </div>
                        </div>

                        <div className="col-md-6">
                          <label for="folder">Folder</label>
                          <select
                            name="folderId"
                            className="form-control form-select"
                            id="folderId"
                            {...register("folderId", {
                              required: {
                                value: true,
                                message: `Please select folder`,
                              },
                            })}
                          >
                            <option value="" selected disabled>
                              Select Folder
                            </option>
                            {rootFolder?.parentFolders?.map((folder) => (
                              <option value={folder?.id}>{folder?.name}</option>
                            ))}
                          </select>
                          {errors?.folderId && (
                            <InputError
                              message={errors?.folderId?.message}
                              key={errors?.folderId?.message}
                            />
                          )}
                        </div>

                        <div className="col-md-6">
                          <div className="form-group mt-2">
                            <label for="modal">Modal</label>
                            <input
                              type="text"
                              className="form-control"
                              id="model"
                              name="model"
                              placeholder=""
                              {...register("model", {
                                required: {
                                  value: true,
                                  message: `${Validation.REQUIRED} model`,
                                },
                              })}
                            />
                            {errors?.model && (
                              <InputError
                                message={errors?.model?.message}
                                key={errors?.model?.message}
                              />
                            )}
                          </div>
                        </div>

                        <div className="col-md-6">
                          <div className="form-group mt-2">
                            <label for="serialNumber">Serial Number</label>
                            <input
                              type="text"
                              className="form-control"
                              id="serialNumber"
                              name="serialNumber"
                              placeholder=""
                              {...register("serialNumber", {
                                required: {
                                  value: true,
                                  message: `${Validation.REQUIRED} serial number`,
                                },
                              })}
                            />
                            {errors?.serialNumber && (
                              <InputError
                                message={errors?.serialNumber?.message}
                                key={errors?.serialNumber?.message}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <input
                          type="file"
                          className="form-control"
                          {...register("assetImage")}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="row" style={{ height: "auto" }}>
                    <div className="col-md-4">
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
                          Select Folder
                        </option>
                        <option value="Lifting Machinery / Equipment">
                          Lifting Machinery / Equipment
                        </option>
                        <option value="Central Heating">Central Heating</option>
                        <option value="Air Conditioning">
                          Air Conditioning
                        </option>
                        <option value="Sanitary">Sanitary</option>
                        <option value="Vantilation">Vantilation</option>
                        <option value="Gas">Gas</option>
                        <option value="Drainage">Drainage</option>
                      </select>
                      {errors?.category && (
                        <InputError
                          message={errors?.category?.message}
                          key={errors?.category?.message}
                        />
                      )}
                    </div>
                    <div className="col-md-4">
                      <label for="subCategory">Sub Category 1</label>
                      <select
                        name="subCategory"
                        className="form-control form-select"
                        id="subCategory"
                        {...register("subCategory", {
                          required: {
                            value: true,
                            message: `Please select sub category 1`,
                          },
                        })}
                      >
                        <option value="" selected disabled>
                          Select Folder
                        </option>
                        <option value="Fire Fighting Equipment">
                          Fire Fighting Equipment
                        </option>
                        <option value="Internal Finishes">
                          Internal Finishes
                        </option>
                        <option value="Mechanical">Mechanical</option>
                        <option value="Electrical">Electrical</option>
                        <option value="Building Envelop">
                          Building Envelop
                        </option>
                        <option value="Maintanance Plant & Equipment">
                          Maintanance Plant & Equipment
                        </option>
                        <option value="Landscaping">Landscaping</option>
                        <option value="Waste Disposal">Waste Disposal</option>
                        <option value="COVID Items">COVID Items</option>
                        <option value="First Aid Equipment">
                          First Aid Equipment
                        </option>
                      </select>
                      {errors?.subCategory && (
                        <InputError
                          message={errors?.subCategory?.message}
                          key={errors?.subCategory?.message}
                        />
                      )}
                    </div>
                    <div className="col-md-4">
                      <label for="subCategory2">Sub Category 2</label>
                      <select
                        name="subCategory2"
                        className="form-control form-select"
                        id="subCategory2"
                        {...register("subCategory2", {
                          required: {
                            value: true,
                            message: `Please select sub category 2`,
                          },
                        })}
                      >
                        <option value="" selected disabled>
                          Select Folder
                        </option>
                        <option value="Water Meter">Water Meter</option>
                        <option value="Cold Water Storage Tank">
                          Cold Water Storage Tank
                        </option>
                        <option value="Calorifier">Calorifier</option>
                        <option value="Distribution Pipework hot">
                          Distribution Pipework hot
                        </option>
                        <option value="Distribution Pipework cold">
                          Distribution Pipework cold
                        </option>
                        <option value="Hot Water Cylinder">
                          Hot Water Cylinder
                        </option>
                        <option value="Controls">Controls</option>
                        <option value="Outlet">Outlet</option>
                        <option value="Pipework Dead Leg">
                          Pipework Dead Leg
                        </option>
                      </select>
                      {errors?.subCategory2 && (
                        <InputError
                          message={errors?.subCategory2?.message}
                          key={errors?.subCategory2?.message}
                        />
                      )}
                    </div>
                    <div className="col-md-4 mt-2">
                      <input
                        type="checkbox"
                        id="patItem"
                        name="patItem"
                        {...register("patItem")}
                      />
                      &nbsp;
                      <label for="patItem">
                        PAT item (fill PAT details below)
                      </label>
                    </div>
                    <div className="col-md-4 mt-2">
                      <input
                        type="checkbox"
                        id="pfpItem"
                        name="pfpItem"
                        {...register("pfpItem")}
                      />
                      &nbsp;
                      <label for="passiveFireSchedule">
                        Passive fire schedule required (fill PFS details below
                        below)
                      </label>
                    </div>
                    <div className="col-md-4 mt-2">
                      <input
                        type="checkbox"
                        id="doorItem"
                        name="doorItem"
                        {...register("doorItem")}
                      />
                      &nbsp;
                      <label for="passiveFireSchedule">
                        Door Assets (fill Door assets details below below)
                      </label>
                    </div>
                  </div>
                  {/* start */}

                  {/* end */}
                </div>
              </div>
            </form>
          </Box>
          {/*  */}
          {/*  */}
        </div>
      </div>
    </Fragment>
  );
};
const mapStateToProps = (state) => ({
  rootFolder: state.site.rootFolder,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
  siteAssets: state.site.siteAssets,
});
export default connect(mapStateToProps, {
  setLoader,
  getDocumentsRootFolder,
  addSiteAsset,
  getSiteAssets,
})(CreateAsset);
