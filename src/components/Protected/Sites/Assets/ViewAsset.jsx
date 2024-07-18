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
import { TextField, Autocomplete } from "@mui/material";
import {
  addSiteAsset,
  getDocumentsRootFolder,
  getSiteAssets,
  getUsers,
  setLoader,
  updateDoorSpecification,
  updatePatDetails,
  updatePurchaseDetails,
  updatepspDetails,
} from "../../../../store/thunk/site";
import { Validation } from "../../../../Constant/Validation";
import { InputError } from "../../../common/InputError";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useNavigate, useSearchParams } from "react-router-dom";
import { get } from "../../../../api";
import { ROLE } from "../../../../Constant/Role";
import moment from "moment";

const ViewAsset = ({
  setLoader,
  siteSelectedForGlobal,
  getDocumentsRootFolder,
  rootFolder,
  addSiteAsset,
  updatePurchaseDetails,
  getUsers,
  users,
  updateDoorSpecification,
  updatepspDetails,
  updatePatDetails,
  getSiteAssets,
  siteAssets,
}) => {
  const [searchParams] = useSearchParams();
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [tester, setTester] = useState([]);
  const assetId = searchParams.get("assetId");
  const [value, setTabValue] = useState("1");
  const [category, setCategory] = useState([]);
  const [subCategory, setSubCategory] = useState([]);
  const [subCategoryList, setSubCategoryList] = useState([]);
  const [subCategory2, setSubCategory2] = useState([]);
  const [subCategory2List, setSubCategory2List] = useState([]);

  const tabChange = (event, newValue) => {
    event?.preventDefault();
    setTabValue(newValue);
  };
  const [patRecord, setPatRecord] = useState([]);
  useEffect(() => {
    if (siteSelectedForGlobal?.siteId) {
      getDocumentsRootFolder(siteSelectedForGlobal?.siteId);
      getAssetDetails();
      getUsers();
      getTester();
      getSiteAssets(siteSelectedForGlobal?.siteId);
      getCategories();
    } else {
      toast.error("Please select site from site search to proceed....");
    }
  }, []);

  const getCategories = async () => {
    const category = await get("/api/lov/ASSET_CATEGORY");
    const subCategory = await get("/api/lov/ASSET_SUB_CATEGORY");
    const subCategory2 = await get("/api/lov/ASSET_SUB_CATEGORY_2");
    setCategory(category);
    setSubCategory(subCategory);
    setSubCategory2(subCategory2);
  };

  const getTester = async () => {
    const url = `/api/user/all?userRole=${ROLE.TESTER}`;
    const data = await get(url);
    setTester(data?.users);
  };

  const getAssetDetails = async () => {
    const url = `/api/site/assets/${assetId}/details`;
    const response = await get(url);
    setSelectedAsset(response);
    setPatRecord(response?.assetPATItems);
    if(response?.category) {
      categoryChange(response?.category);
    }
    if(response?.subCategory) {
      subCategoryChange(response?.subCategory)
    }
    purchaseDetailForm.reset({
      invoiceFile: response?.invoiceFile,
      purchaseDate: response?.purchaseDate,
      supplier: response?.supplier,
      transactionId: response?.transactionId,
      cost: response?.cost,
    });
    locationForm.reset({
      position: response?.position,
      floor: response?.floor,
      room: response?.room,
    });
    valudationForm.reset({
      valuationDate: response?.valuationDate,
      valuationUserId: response?.valuationUserId,
      valuationUserName: response?.valuationUserName,
      valuationValue: response?.valuationValue,
      disposalDate: response?.disposalDate,
      disposalTo: response?.disposalTo,
      disposalValue: response?.disposalValue,
    });
    passiveFireProtectionForm.reset(response?.assetPFPItem);
    doorSpecificationForm.reset(response?.assetDoorSpecifications);
    reset(response);
  };

  const addPatRecord = () => {
    setPatRecord([
      ...patRecord,
      {
        patId: null,
        assetId: selectedAsset?.assetId,
        patUserId: null,
        patDate: null,
        patNextDate: null,
        patStatus: "",
      },
    ]);
  };
  const [deleteSavedPatItems, setDeleteSavedPatItems] = useState([]);
  const deletePatRecord = (index, item) => {
    if (item?.patId) {
      setDeleteSavedPatItems((deleteSavedPatItems) => [
        ...deleteSavedPatItems,
        item?.patId,
      ]);
    }
    setPatRecord(patRecord.filter((_, i) => i !== index));
  };

  const handleInputChange = (index, field, value) => {
    const updatedData = [...patRecord];
    updatedData[index] = {
      ...updatedData[index],
      [field]:
        field === "patDate" || field === "patNextDate"
          ? `${value} 10:00:00`
          : field === "patUserId"
          ? Number(value)
          : value,
    };
    setPatRecord(updatedData);
  };
  const getTesterName = (id) => {
    return tester?.filter((itm) => itm.id === id)?.[0]?.name;
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
    setValue,
  } = useForm({
    defaultValues,
  });
  const navigate = useNavigate();
  const goTo = (link) => {
    navigate(link);
  };

  const purchaseDetailForm = useForm({});
  const purchaseFrormValues = purchaseDetailForm.watch();
  
  const locationForm = useForm({});
  

  const valudationForm = useForm({});
  

  const passiveFireProtectionForm = useForm({});
  const doorSpecificationForm = useForm({});
  const subCategoryChange = (val) => {
    setValue("subCategory", val);
    const subCategoryData = subCategory2?.filter(
      (itm) => itm?.attribite1 === val
    );
    setSubCategory2List(subCategoryData);
  }
  const categoryChange = (val) => {
    setValue("category", val);
    const subCategoryData = subCategory?.filter(
      (itm) => itm?.attribite1 === val
    );
    setSubCategoryList(subCategoryData);
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
            <form>
              <div className="row p-2 border">
                <div className="col-md-12">
                  <div className="float-end">
                    <button
                      type="button"
                      className="btn btn-light mb-3 mr-4"
                      onClick={() => window.history.back()}
                    >
                      Close
                    </button>
                  </div>
                </div>
                <div className="col-md-12 p-2">
                  <div className="row" style={{ height: "auto" }}>
                    <div className="col-md-8" style={{ height: "fit-content" }}>
                      <div className="row">
                        <div className="col-md-6">
                          <div className="form-group mt-2">
                            <label for="assetName">Asset Name</label>
                            <input
                              type="text"
                              className="form-control"
                              id="assetName"
                              disabled
                              name="assetName"
                              placeholder=""
                              {...register("assetName")}
                            />
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
                              disabled
                              {...register("manufacturer")}
                            />
                          </div>
                        </div>

                        <div className="col-md-6">
                          <div className="form-group mt-2">
                            <label for="relatedAssetId">Related Asset</label>
                            <Autocomplete
                              value={
                                siteAssets.find(
                                  (asset) =>
                                    asset.assetId ===
                                    getValues("relatedAssetId")
                                ) || null
                              }
                              onChange={(event, newValue) => {
                                console.log("newValue", newValue);
                                setValue("relatedAssetId", newValue?.assetId);
                              }}
                              disabled
                              options={siteAssets}
                              getOptionLabel={(option) =>
                                option.assetName || ""
                              }
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
                            disabled
                            {...register("folderId")}
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
                        </div>

                        <div className="col-md-6">
                          <div className="form-group mt-2">
                            <label for="modal">Modal</label>
                            <input
                              type="text"
                              className="form-control"
                              id="model"
                              name="model"
                              disabled
                              placeholder=""
                              {...register("model")}
                            />
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
                              disabled
                              {...register("serialNumber")}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4 text-center">
                      <div className="form-group">
                        {selectedAsset?.image && (
                          <img
                            src={selectedAsset?.image}
                            style={{ width: "100px", height: "100px" }}
                            className="img img-responsive border p-2 m-2"
                          />
                        )}
                        {!selectedAsset?.image && (
                          <strong>Asset image is not available</strong>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="row" style={{ height: "auto" }}>
                    <div className="col-md-4">
                      <label for="category">Category</label>
                      <select
                        name="category"
                        disabled
                        className="form-control form-select"
                        id="category"
                        {...register("category")}
                        onChange={(e) => {
                          categoryChange(e.target.value);
                        }}
                      >
                        <option value="">Select category</option>
                        {category?.map((itm) => (
                          <option value={itm?.lovValue}>{itm?.lovValue}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label for="subCategory">Sub Category 1</label>
                      <select
                        name="subCategory"
                        className="form-control form-select"
                        id="subCategory"
                        disabled
                        {...register("subCategory")}
                        onChange={(e) => {
                          subCategoryChange(e.target.value);
                        }}
                      >
                        <option value="">Select Sub Category</option>
                        {subCategoryList?.map((itm) => (
                          <option value={itm?.lovValue}>{itm?.lovValue}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label for="subCategory2">Sub Category 2</label>
                      <select
                        name="subCategory2"
                        className="form-control form-select"
                        id="subCategory2"
                        disabled
                        {...register("subCategory2")}
                      >
                        <option value="">Select Sub Category 2</option>
                        {subCategory2List?.map((itm) => (
                          <option value={itm?.lovValue}>{itm?.lovValue}</option>
                        ))}
                      </select>
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
                <form>
                  <div className="row">
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label for="purchaseDate">Purchase Date</label>
                        <input
                          type="date"
                          disabled
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
                          disabled
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
                          disabled
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
                          disabled
                          id="cost"
                          name="cost"
                          placeholder=""
                          {...purchaseDetailForm.register("cost")}
                        />
                      </div>
                    </div>

                    <div className="col-md-8">
                      {purchaseFrormValues.invoiceFile && (
                        <a href={purchaseFrormValues.invoiceFile} download>
                          Download Uploaded Invoice
                        </a>
                      )}
                    </div>
                  </div>
                </form>
              </TabPanel>
              <TabPanel value="2">
                <form>
                  <div className="row">
                    <div className="col-md-4">
                      <label for="position">Internal/External</label>
                      <select
                        name="position"
                        className="form-control form-select"
                        id="position"
                        disabled
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
                        disabled
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
                        disabled
                        className="form-control form-select"
                        id="room"
                        {...locationForm.register("room")}
                      >
                        <option value="">Select Room</option>
                        <option value="G1">G1</option>
                        <option value="G2">G2</option>
                      </select>
                    </div>
                  </div>
                </form>
              </TabPanel>
              <TabPanel value="3">
                <form>
                  <div className="row">
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label for="valuationDate">Valuation Date</label>
                        <input
                          type="date"
                          disabled
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
                          disabled
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
                        disabled
                        {...valudationForm.register("valuationUserId")}
                      >
                        <option value=""></option>
                        {users?.map((itm) => (
                          <option value={itm?.id} key={itm?.name}>
                            {itm?.name}
                          </option>
                        ))}
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
                          disabled
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
                          disabled
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
                          disabled
                          placeholder=""
                          {...valudationForm.register("disposalTo")}
                        />
                      </div>
                    </div>
                  </div>
                </form>
              </TabPanel>
              <TabPanel value="4">
                {" "}
                <div className="row">
                  <div className="col-md-12 mt-2">
                    <div className="table-responsive">
                      <table className="table table-bordered f-11">
                        <thead className="table-lght">
                          <tr>
                            <th scope="col">Tester</th>
                            <th scope="col">Test Date</th>
                            <th scope="col">Next Test Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {patRecord?.length === 0 && (
                            <tr>
                              <td colSpan={3}>No Result Found</td>
                            </tr>
                          )}
                          {patRecord?.map((itm, index) => (
                            <tr>
                              <td>
                                {itm?.patId ? (
                                  getTesterName(itm?.patUserId)
                                ) : (
                                  <select
                                    name="patUserId"
                                    className="form-control form-select"
                                    id="patUserId"
                                    onChange={(e) =>
                                      handleInputChange(
                                        index,
                                        "patUserId",
                                        e.target.value
                                      )
                                    }
                                  >
                                    <option value="" selected disabled>
                                      Select Tester
                                    </option>
                                    {tester?.map((itm) => (
                                      <option value={itm?.id} key={itm?.id}>
                                        {itm?.name}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </td>
                              <td>
                                {itm?.patId ? (
                                  moment(itm?.patDate).format("DD-MM-YYYY")
                                ) : (
                                  <input
                                    type="date"
                                    className="form-control"
                                    id="patDate"
                                    name="patDate"
                                    placeholder="dd/mm/yyyy"
                                    onChange={(e) =>
                                      handleInputChange(
                                        index,
                                        "patDate",
                                        e.target.value
                                      )
                                    }
                                  />
                                )}
                              </td>
                              <td>
                                {itm?.patId ? (
                                  moment(itm?.patNextDate).format("DD-MM-YYYY")
                                ) : (
                                  <input
                                    type="date"
                                    className="form-control"
                                    id="patNextDate"
                                    name="patNextDate"
                                    placeholder="dd/mm/yyyy"
                                    onChange={(e) =>
                                      handleInputChange(
                                        index,
                                        "patNextDate",
                                        e.target.value
                                      )
                                    }
                                  />
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </TabPanel>
              <TabPanel value="5">
                <form>
                  <div className="row">
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label for="product">Product Name</label>
                        <input
                          type="text"
                          className="form-control"
                          id="product"
                          name="product"
                          disabled
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
                          disabled
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
                          disabled
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
                          disabled
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
                          disabled
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
                          disabled
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
                          disabled
                          name="area"
                          placeholder=""
                          {...passiveFireProtectionForm.register("area")}
                        />
                      </div>
                    </div>
                  </div>
                </form>
              </TabPanel>
              <TabPanel value="6">
                <form>
                  <div className="row">
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label for="width">Door Width (cm)</label>
                        <input
                          type="text"
                          className="form-control"
                          id="width"
                          name="width"
                          disabled
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
                          disabled
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
                          disabled
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
                          disabled
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
                          disabled
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
                          disabled
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
                          disabled
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
                          disabled
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
  users: state.site.users,
  siteAssets: state.site.siteAssets,
});
export default connect(mapStateToProps, {
  setLoader,
  getDocumentsRootFolder,
  addSiteAsset,
  updatePurchaseDetails,
  getUsers,
  updateDoorSpecification,
  updatepspDetails,
  updatePatDetails,
  getSiteAssets,
})(ViewAsset);
