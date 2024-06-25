import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import Box from "@mui/material/Box";
import Header from "../../../common/Header/Header";
import BreadCrumHeader from "../../../common/BreadCrumHeader/BreadCrumHeader";
import SidebarNew from "../../../common/Sidebar/SidebarNew";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import {
  addSiteAsset,
  getDocumentsRootFolder,
  setLoader,
} from "../../../../store/thunk/site";
import { Validation } from "../../../../Constant/Validation";
import { InputError } from "../../../common/InputError";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useNavigate, useSearchParams } from "react-router-dom";
import { get } from "../../../../api";

const UpdateAsset = ({
  setLoader,
  siteSelectedForGlobal,
  getDocumentsRootFolder,
  rootFolder,
  addSiteAsset,
}) => {
  const [searchParams] = useSearchParams();
  const [selectedAsset, setSelectedAsset] = useState(null);
  const assetId = searchParams.get("assetId");
  const [value, setValue] = useState("1");
  const tabChange = (event, newValue) => {
    event?.preventDefault();
    setValue(newValue);
  };
  const [patRecord, setPatRecord] = useState([]);
  useEffect(() => {
    if (siteSelectedForGlobal?.siteId) {
      getDocumentsRootFolder(siteSelectedForGlobal?.siteId);
      getAssetDetails();
    } else {
      toast.error("Please select site from site search to proceed....");
    }
  }, []);

  const getAssetDetails = async () => {
    const url = `/api/site/assets/${assetId}/details`;
    const response = await get(url);
    setSelectedAsset(response);
    reset(response);
  };

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
    const { assetImage, ...formData } = data;
    if (data?.assetImage?.length > 0) {
      form_data.append(
        "assetImage",
        data?.assetImage?.[0],
        data?.assetImage?.[0]?.name
      );
    } else {
      form_data.append("assetImage", JSON.stringify(data?.image));
    }
    console.log("data", data);
    console.log("assetImage", assetImage);
    console.log("formData", formData);
    const formDetails = {
      assetId: formData?.assetId,
      assetName: formData?.assetName,
      manufacturer: formData?.manufacturer,
      category: formData?.category,
      subCategory: formData?.subCategory,
      subCategory2: formData?.subCategory2,
      model: formData?.model,
      serialNumber: formData?.serialNumber,
      relatedAssetId: formData?.relatedAssetId,
      folderId: formData?.folderId,
      patItem: formData?.patItem,
      pfpItem: formData?.pfpItem,
      doorItem: formData?.doorItem,
      barcode: "code",
    };
    form_data.append("assetRequestString", JSON.stringify(formDetails));
    addSiteAsset(form_data, goTo, siteSelectedForGlobal?.siteId);
    // reset(defaultValues);
  };

  const purchaseDetailForm = useForm({});
  const submitSiteAssetPurchaseDetail = (data) => {
    console.log("data", data);
  };

  const locationForm = useForm({});
  const submitLocationForm = (data) => {
    console.log("data", data);
  };

  const valudationForm = useForm({});
  const submitValudationForm = (data) => {
    console.log("data", data);
  };

  const passiveFireProtectionForm = useForm({});
  const submitPassiveFireProtectionForm = (data) => {
    console.log("data", data);
  };

  const doorSpecificationForm = useForm({});
  const submitDoorSpecificationForm = (data) => {
    console.log("data", data);
  };
  return (
    <Fragment>
      <SidebarNew />
      <div className="content">
        <Header />
        <div className="container-fluid">
          <BreadCrumHeader
            header={`Update ${selectedAsset?.assetName}`}
            page={"Asset Details"}
          />

          <Box sx={{ width: "100%", typography: "body1" }}>
            <form onSubmit={handleSubmit(submitSiteAsset)}>
              <div className="row p-2 border">
                <div className="col-md-12">
                  <div className="float-end">
                    <button type="button" className="btn btn-light mb-3 mr-4">
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
                            <input
                              type="text"
                              className="form-control"
                              id="relatedAssetId"
                              name="relatedAssetId"
                              placeholder=""
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
                              <option value={folder?.id} key={folder?.id}>
                                {folder?.name}
                              </option>
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
                        {selectedAsset?.image && (
                          <img
                            src={selectedAsset?.image}
                            className="img img-responsive"
                          />
                        )}
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
                      <input
                        type="text"
                        className="form-control"
                        id="category"
                        name="category"
                        placeholder=""
                        {...register("category", {
                          required: {
                            value: true,
                            message: `${Validation.REQUIRED} category`,
                          },
                        })}
                      />
                      {errors?.category && (
                        <InputError
                          message={errors?.category?.message}
                          key={errors?.category?.message}
                        />
                      )}
                    </div>
                    <div className="col-md-4">
                      <label for="subCategory">Sub Category 1</label>
                      <input
                        type="text"
                        className="form-control"
                        id="subCategory"
                        name="subCategory"
                        placeholder=""
                        {...register("subCategory", {
                          required: {
                            value: true,
                            message: `${Validation.REQUIRED} sub category 1`,
                          },
                        })}
                      />
                      {errors?.subCategory && (
                        <InputError
                          message={errors?.subCategory?.message}
                          key={errors?.subCategory?.message}
                        />
                      )}
                    </div>
                    <div className="col-md-4">
                      <label for="subCategory2">Sub Category 2</label>
                      <input
                        type="text"
                        className="form-control"
                        id="subCategory2"
                        name="subCategory2"
                        placeholder=""
                        {...register("subCategory2", {
                          required: {
                            value: true,
                            message: `${Validation.REQUIRED} sub category 2`,
                          },
                        })}
                      />
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
          <Box sx={{ width: "100%", typography: "body1" }}>
            <TabContext value={value}>
              <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                <TabList onChange={tabChange} aria-label="lab API tabs example">
                  <Tab
                    label="Purchase Details"
                    value="1"
                    icon={<i className="fa fa-circle-exclamation"></i>}
                  />
                  <Tab label="Location" value="2" />
                  <Tab label="Valuation & Disposal" value="3" />
                  {selectedAsset?.patItem && (
                    <Tab label="PAT Details" value="4" />
                  )}
                  {selectedAsset?.pfpItem && (
                    <Tab label="Passive Fire Protection" value="5" />
                  )}
                  {selectedAsset?.patItem && (
                    <Tab label="Door Specifications" value="6" />
                  )}
                </TabList>
              </Box>
              <TabPanel value="1">
                <form
                  onSubmit={purchaseDetailForm.handleSubmit(
                    submitSiteAssetPurchaseDetail
                  )}
                >
                  <div className="row">
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label for="purchaseDate">Purchase Date</label>
                        <input
                          type="date"
                          className="form-control"
                          id="purchaseDate"
                          name="purchaseDate"
                          placeholder=""
                          {...purchaseDetailForm.register("purchaseDate")}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label for="supplier">Supplier</label>
                        <input
                          type="text"
                          className="form-control"
                          id="supplier"
                          name="supplier"
                          placeholder=""
                          {...purchaseDetailForm.register("supplier")}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label for="transactionId">Tramsaction ID</label>
                        <input
                          type="number"
                          className="form-control"
                          id="transactionId"
                          name="transactionId"
                          placeholder=""
                          {...purchaseDetailForm.register("transactionId")}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label for="cost">Cost</label>
                        <input
                          type="number"
                          className="form-control"
                          id="cost"
                          name="cost"
                          placeholder=""
                          {...purchaseDetailForm.register("cost")}
                        />
                      </div>
                    </div>

                    <div className="col-md-8">
                      <div className="form-group mt-2">
                        <label for="purchaseInvoice">Invoice</label>
                        <input
                          type="file"
                          className="form-control"
                          id="purchaseInvoice"
                          name="purchaseInvoice"
                          placeholder=""
                          {...purchaseDetailForm.register("purchaseInvoice")}
                        />
                      </div>
                    </div>
                    <div>
                      <button type="submit" className="btn btn-primary mt-2">
                        Save
                      </button>
                    </div>
                  </div>
                </form>
              </TabPanel>
              <TabPanel value="2">
                <form onSubmit={locationForm.handleSubmit(submitLocationForm)}>
                  <div className="row">
                    <div className="col-md-4">
                      <label for="position">Internal/External</label>
                      <select
                        name="position"
                        className="form-control form-select"
                        id="position"
                        {...locationForm.register("position")}
                      >
                        <option value="">Select Internal/External</option>
                        <option value={"Internal"}>Internal</option>
                        <option value={"External"}>External</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label for="floor">Floor</label>
                      <select
                        name="floor"
                        className="form-control form-select"
                        id="floor"
                        {...locationForm.register("floor")}
                      >
                        <option value="">Select Floor</option>
                        <option value={"Ground"}>Ground</option>
                        <option value={"First"}>First</option>
                        <option value={"Second"}>Second</option>
                        <option value={"Third"}>Third</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label for="room">Room</label>
                      <select
                        name="room"
                        className="form-control form-select"
                        id="room"
                        {...locationForm.register("room")}
                      >
                        <option value="">Select Room</option>
                        <option value="G1">G1</option>
                        <option value="G2">G2</option>
                      </select>
                    </div>
                    <div>
                      <button type="submit" className="btn btn-primary mt-2">
                        Save
                      </button>
                    </div>
                  </div>
                </form>
              </TabPanel>
              <TabPanel value="3">
                <form
                  onSubmit={valudationForm.handleSubmit(submitValudationForm)}
                >
                  <div className="row">
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label for="valuationDate">Valudation Date</label>
                        <input
                          type="date"
                          className="form-control"
                          id="valuationDate"
                          name="valuationDate"
                          placeholder=""
                          {...valudationForm.register("valuationDate")}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label for="valuationValue">Valuation</label>
                        <input
                          type="number"
                          className="form-control"
                          id="valuationValue"
                          name="valuationValue"
                          placeholder=""
                          {...valudationForm.register("valuationValue")}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <label for="valuationUserId">Valuation Done By</label>
                      <select
                        name="valuationUserId"
                        className="form-control form-select"
                        id="valuationUserId"
                        {...valudationForm.register("valuationUserId")}
                      >
                        <option value=""></option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label for="disposalDate">Disposal Date</label>
                        <input
                          type="date"
                          className="form-control"
                          id="disposalDate"
                          name="disposalDate"
                          placeholder=""
                          {...valudationForm.register("disposalDate")}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label for="disposalValue">Disposal Value</label>
                        <input
                          type="number"
                          className="form-control"
                          id="disposalValue"
                          name="disposalValue"
                          placeholder=""
                          {...valudationForm.register("disposalValue")}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label for="disposalTo">Disposal To</label>
                        <input
                          type="text"
                          className="form-control"
                          id="disposalTo"
                          name="disposalTo"
                          placeholder=""
                          {...valudationForm.register("disposalTo")}
                        />
                      </div>
                    </div>
                    <div>
                      <button type="submit" className="btn btn-primary mt-2">
                        Save
                      </button>
                    </div>
                  </div>
                </form>
              </TabPanel>
              <TabPanel value="4">
                {" "}
                <div className="row">
                  <div>
                    <button
                      onClick={() => addPatRecord()}
                      className="btn btn-light text-primary"
                    >
                      <i className="fas fa-plus"></i>&nbsp;Add PAT Record
                    </button>
                  </div>
                  <div className="col-md-12 mt-2">
                    <div className="table-responsive">
                      <table className="table table-bordered f-11">
                        <thead className="table-lght">
                          <tr>
                            <th scope="col">Tester</th>
                            <th scope="col">Test Date</th>
                            <th scope="col">Next Test Date</th>
                            <th scope="col">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {patRecord?.map((itm) => (
                            <tr>
                              <td>
                                <select
                                  name="tester"
                                  className="form-control form-select"
                                  id="tester"
                                >
                                  <option value="">Select Tester</option>
                                </select>
                              </td>
                              <td>
                                <input
                                  type="date"
                                  className="form-control"
                                  id="testDate"
                                  name="testDate"
                                  placeholder="dd/mm/yyyy"
                                />
                              </td>
                              <td>
                                <input
                                  type="date"
                                  className="form-control"
                                  id="nextTestDate"
                                  name="nextTestDate"
                                  placeholder="dd/mm/yyyy"
                                />
                              </td>
                              <td>
                                <i class="fas fa-regular fa-thumbs-up cursor"></i>{" "}
                                &nbsp;
                                <i class="fas fa-regular fa-thumbs-down cursor"></i>{" "}
                                &nbsp;
                                <i className="fas fa-trash cursor"></i>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div>
                    <button type="submit" className="btn btn-primary mt-2">
                      Save
                    </button>
                  </div>
                </div>
              </TabPanel>
              <TabPanel value="5">
                <form
                  onSubmit={passiveFireProtectionForm.handleSubmit(
                    submitPassiveFireProtectionForm
                  )}
                >
                  <div className="row">
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label for="product">Product Name</label>
                        <input
                          type="text"
                          className="form-control"
                          id="product"
                          name="product"
                          placeholder=""
                          {...passiveFireProtectionForm.register("product")}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label for="access">Access/Position</label>
                        <input
                          type="text"
                          className="form-control"
                          id="access"
                          name="access"
                          placeholder=""
                          {...passiveFireProtectionForm.register("access")}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label for="material">Material</label>
                        <select
                          name="material"
                          className="form-control form-select"
                          id="material"
                          {...passiveFireProtectionForm.register("material")}
                        >
                          <option value="">Select Material</option>
                          <option value={"Test Material"}>Test Material</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label for="service">Service</label>
                        <input
                          type="text"
                          className="form-control"
                          id="service"
                          name="service"
                          placeholder=""
                          {...passiveFireProtectionForm.register("service")}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label for="dimension">Dimension</label>
                        <input
                          type="text"
                          className="form-control"
                          id="dimension"
                          name="dimension"
                          placeholder=""
                          {...passiveFireProtectionForm.register("dimension")}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label for="quantity">Quantity</label>
                        <input
                          type="text"
                          className="form-control"
                          id="quantity"
                          name="quantity"
                          placeholder=""
                          {...passiveFireProtectionForm.register("quantity")}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label for="area">Area (in sq m)</label>
                        <input
                          type="text"
                          className="form-control"
                          id="area"
                          name="area"
                          placeholder=""
                          {...passiveFireProtectionForm.register("area")}
                        />
                      </div>
                    </div>
                    <div>
                      <button type="submit" className="btn btn-primary mt-2">
                        Save
                      </button>
                    </div>
                  </div>
                </form>
              </TabPanel>
              <TabPanel value="6">
                <form
                  onSubmit={doorSpecificationForm.handleSubmit(
                    submitDoorSpecificationForm
                  )}
                >
                  <div className="row">
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label for="width">Door Width (cm)</label>
                        <input
                          type="text"
                          className="form-control"
                          id="width"
                          name="width"
                          placeholder=""
                          {...doorSpecificationForm.register("width")}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label for="height">Door Height (cm)</label>
                        <input
                          type="text"
                          className="form-control"
                          id="height"
                          name="height"
                          placeholder=""
                          {...doorSpecificationForm.register("height")}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label for="depth">Door Depth (cm)</label>
                        <input
                          type="text"
                          className="form-control"
                          id="depth"
                          name="depth"
                          placeholder=""
                          {...doorSpecificationForm.register("depth")}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label for="finish">Door Finish</label>
                        <input
                          type="text"
                          className="form-control"
                          id="finish"
                          name="finish"
                          placeholder=""
                          {...doorSpecificationForm.register("finish")}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label for="visionPanel">Vision Panel</label>
                        <input
                          type="text"
                          className="form-control"
                          id="visionPanel"
                          name="visionPanel"
                          placeholder=""
                          {...doorSpecificationForm.register("visionPanel")}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label for="fireRating">Fire Rating</label>
                        <input
                          type="text"
                          className="form-control"
                          id="fireRating"
                          name="fireRating"
                          placeholder=""
                          {...doorSpecificationForm.register("fireRating")}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label for="frameMaterial">Fire Material</label>
                        <input
                          type="text"
                          className="form-control"
                          id="frameMaterial"
                          name="frameMaterial"
                          placeholder=""
                          {...doorSpecificationForm.register("frameMaterial")}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label for="frameFinish">Frame Finish</label>
                        <input
                          type="text"
                          className="form-control"
                          id="frameFinish"
                          name="frameFinish"
                          placeholder=""
                          {...doorSpecificationForm.register("frameFinish")}
                        />
                      </div>
                    </div>
                  </div>
                </form>
              </TabPanel>
            </TabContext>
          </Box>
          {/*  */}
        </div>
      </div>
    </Fragment>
  );
};
const mapStateToProps = (state) => ({
  rootFolder: state.site.rootFolder,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
});
export default connect(mapStateToProps, {
  setLoader,
  getDocumentsRootFolder,
  addSiteAsset,
})(UpdateAsset);
