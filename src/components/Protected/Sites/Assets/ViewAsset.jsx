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
  getSiteLayout,
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
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import "./AssetStyle.css";
import Swal from "sweetalert2";
import PdfViewer from "../Documents/PdfViewer";
import TextSnippetOutlinedIcon from "@mui/icons-material/TextSnippetOutlined";

const UpdateAsset = ({
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
  getSiteLayout,
  siteLayout,
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
  const [subCategory3, setSubCategory3] = useState([]);
  const [subCategory3List, setSubCategory3List] = useState([]);
  const [passiveFireMaterial, setPassiveFireMaterial] = useState([]);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState("");

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
      getSiteLayout(siteSelectedForGlobal?.siteId);
      getCategories();
    } else {
      Swal.fire({
        icon: "error",
        title: "Site is not selected",
        text: "Please select site from site search and try again.",
      });
      return;
    }
  }, []);

  const getCategories = async () => {
    const category = await get("/api/lov/ASSET_CATEGORY");
    const subCategory = await get("/api/lov/ASSET_SUB_CATEGORY");
    const subCategory2 = await get("/api/lov/ASSET_SUB_CATEGORY_2");
    const subCategory3 = await get("/api/lov/ASSET_SUB_CATEGORY_3");
    const material = await get("/api/lov/PASSIVE_FIRE_PROTECTION");
    setCategory(category);
    setSubCategory(subCategory);
    setSubCategory2(subCategory2);
    setPassiveFireMaterial(material);
    setSubCategoryList(subCategory);
    setSubCategory2List(subCategory2);
    setSubCategory3(subCategory3);
    setSubCategory3List(subCategory3);
  };

  const getTester = async () => {
    const url = `/api/user/all?userRole=${ROLE.TESTER}`;
    const data = await get(url);
    setTester(
      data?.users?.sort((a, b) => {
        if (a.name < b.name) {
          return -1; // a comes before b
        }
        if (a.name > b.name) {
          return 1; // b comes before a
        }
        return 0; // names are equal
      })
    );
  };

  const savePatDetails = async () => {
    setLoader(true);
    const data = patRecord?.map((itm) => {
      return {
        ...itm,
        patDate: itm?.patDate?.replace(/T/g, " "),
        patNextDate: itm?.patNextDate?.replace(/T/g, " "),
      };
    });
    try {
      await updatePatDetails(data, selectedAsset?.assetId, deleteSavedPatItems);
      getAssetDetails();
      setLoader(false);
    } catch (e) {
      toast.error("Something went wrong while update. Please try again.");
      setLoader(false);
    }
  };

  const getAssetDetails = async () => {
    const url = `/api/site/assets/${assetId}/details`;
    const response = await get(url);
    setSelectedAsset(response);
    setPatRecord(response?.assetPATItems || []);
    if (response?.category) {
      categoryChange(response?.category);
    }
    if (response?.subCategory) {
      subCategoryChange(response?.subCategory);
    }
    purchaseDetailForm.reset({
      invoiceFile: response?.invoiceFile,
      purchaseDate: response?.purchaseDate?.split("T")?.[0],
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
      valuationDate: response?.valuationDate ? response?.valuationDate?.split("T")?.[0] : null,
      valuationUserId: response?.valuationUserId,
      valuationUserName: response?.valuationUserName,
      valuationValue: response?.valuationValue,
      disposalDate: response?.disposalDate ? response?.disposalDate?.split("T")?.[0] : null,
      disposalTo: response?.disposalTo,
      disposalValue: response?.disposalValue,
    });
    passiveFireProtectionForm.reset(response?.assetPFPItem);
    doorSpecificationForm.reset(response?.assetDoorSpecifications);
    reset(response);
  };

  const addPatRecord = () => {
    const d = [...patRecord];
    d.push({
      patId: null,
      assetId: selectedAsset?.assetId,
      patUserId: null,
      patDate: null,
      patNextDate: null,
      patStatus: "",
    });
    setPatRecord(d);
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
  const submitSiteAsset = (data) => {
    setLoader(true);
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
    try {
      addSiteAsset(form_data, goTo, siteSelectedForGlobal?.siteId);
      setLoader(false);
    } catch (e) {
      toast.error("Something went wrong while update asset. Please try again.");
      setLoader(false);
    }
  };

  const purchaseDetailForm = useForm({});
  const purchaseFrormValues = purchaseDetailForm.watch();
  const submitSiteAssetPurchaseDetail = async (data) => {
    let form_data = new FormData();
    const { purchaseInvoice, ...formData } = data;
    if (purchaseInvoice) {
      form_data.append(
        "purchaseInvoice",
        data?.purchaseInvoice?.[0],
        data?.purchaseInvoice?.[0]?.name
      );
    }
    const submitData = {
      ...formData,
      purchaseDate: formData?.purchaseDate + " 10:00:00",
      assetId: selectedAsset?.assetId,
      position: selectedAsset?.position,
      floor: selectedAsset?.floor,
      room: selectedAsset?.room,
      valuationDate: selectedAsset?.valuationDate
        ? `${selectedAsset?.valuationDate?.split("T")?.[0]} 10:00:00`
        : null,
      disposalDate: selectedAsset?.disposalDate
        ? `${selectedAsset?.disposalDate?.split("T")?.[0]} 10:00:00`
        : null,
      disposalTo: selectedAsset?.disposalTo,
      disposalValue: selectedAsset?.disposalValue,
      valuationUserId: selectedAsset?.valuationUserId,
      valuationValue: selectedAsset?.valuationValue,
    };
    form_data.append("assetDetailsRequestString", JSON.stringify(submitData));
    setLoader(true);
    await updatePurchaseDetails(form_data, selectedAsset?.assetId);
    setLoader(false);
    getAssetDetails();
  };

  const locationForm = useForm({});
  const submitLocationForm = async (data) => {
    let form_data = new FormData();
    const submitData = {
      ...data,
      assetId: selectedAsset?.assetId,
      purchaseDate: selectedAsset?.purchaseDate
        ? `${selectedAsset?.purchaseDate?.split("T")?.[0]} 10:00:00`
        : null,
      supplier: selectedAsset?.supplier,
      transactionId: selectedAsset?.transactionId,
      cost: selectedAsset?.cost,
      valuationDate: selectedAsset?.valuationDate
        ? `${selectedAsset?.valuationDate?.split("T")?.[0]} 10:00:00`
        : null,
      disposalDate: selectedAsset?.disposalDate
        ? `${selectedAsset?.disposalDate?.split("T")?.[0]} 10:00:00`
        : null,
      disposalTo: selectedAsset?.disposalTo,
      disposalValue: selectedAsset?.disposalValue,
      valuationUserId: selectedAsset?.valuationUserId,
      valuationValue: selectedAsset?.valuationValue,
    };
    form_data.append("assetDetailsRequestString", JSON.stringify(submitData));
    setLoader(true);
    await updatePurchaseDetails(form_data, selectedAsset?.assetId);
    setLoader(false);
    getAssetDetails();
  };

  const valudationForm = useForm({});
  const submitValudationForm = async (data) => {
    let form_data = new FormData();
    const submitData = {
      ...data,
      assetId: selectedAsset?.assetId,
      valuationDate: data?.valuationDate + " 10:00:00",
      disposalDate: data?.disposalDate + " 10:00:00",
      position: selectedAsset?.position,
      floor: selectedAsset?.floor,
      room: selectedAsset?.room,
      purchaseDate: selectedAsset?.purchaseDate
        ? `${selectedAsset?.purchaseDate?.split("T")?.[0]} 10:00:00`
        : null,
      supplier: selectedAsset?.supplier,
      transactionId: selectedAsset?.transactionId,
      cost: selectedAsset?.cost,
    };
    form_data.append("assetDetailsRequestString", JSON.stringify(submitData));
    setLoader(true);
    await updatePurchaseDetails(form_data, selectedAsset?.assetId);
    setLoader(false);
    getAssetDetails();
  };

  const passiveFireProtectionForm = useForm({});
  const submitPassiveFireProtectionForm = async (data) => {
    const submitData = {
      ...data,
      assetId: selectedAsset?.assetId,
    };
    setLoader(true);
    await updatepspDetails(submitData, selectedAsset?.assetId);
    setLoader(false);
    getAssetDetails();
  };

  const doorSpecificationForm = useForm({});
  const submitDoorSpecificationForm = async (data) => {
    const submitData = {
      ...data,
      assetId: selectedAsset?.assetId,
    };
    setLoader(true);
    await updateDoorSpecification(submitData, selectedAsset?.assetId);
    setLoader(false);
    getAssetDetails();
  };
  const subCategoryChange = (val) => {
    setValue("subCategory", val);
    const subCategoryData = subCategory2?.filter(
      (itm) => itm?.attribite1 === val
    );
    setSubCategory2List(subCategoryData);
  };
  const categoryChange = (val) => {
    setValue("category", val);
    const subCategoryData = subCategory?.filter(
      (itm) => itm?.attribite1 === val
    );
    setSubCategoryList(subCategoryData);
  };
  const getSelectedValue = () => {
    const selectedAssets = getValues("relatedAssetId")?.split(",");
    const arr = [];
    if (selectedAssets) {
      for (const iterator of selectedAssets) {
        const selectedValue =
          siteAssets.find((itm) => itm.assetId == iterator) || null;
        if (selectedValue) {
          arr.push({
            key: selectedValue?.assetId,
            label: selectedValue?.assetName,
          });
        }
      }
    }
    return arr;
  };
  return (
    <Fragment>
      <SidebarNew />
      <div className="content">
        <Header />
        <div className="container-fluid">
          <BreadCrumHeader
            header={`View ${selectedAsset?.assetName}`}
            page={"Asset Details"}
          />

          <Box sx={{ width: "100%", typography: "body1" }}>
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
                            name="assetName"
                            placeholder=""
                            disabled
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
                            disabled
                            {...register("manufacturer")}
                          />
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="form-group mt-2">
                          <label for="relatedAssetId">Related Asset</label>
                          <Autocomplete
                            multiple
                            value={getSelectedValue()}
                            disabled
                            onChange={(event, newValue) => {
                              setValue("relatedAssetId", newValue?.key);
                            }}
                            options={siteAssets.map((option) => {
                              return {
                                key: option.assetId,
                                label: option.assetName,
                              };
                            })}
                            getOptionLabel={(option) => option.label || ""}
                            renderInput={(params) => (
                              <TextField
                                //disabled
                                {...params}
                                //label="Tag Asset"
                                //placeholder="Tag Asset"
                              />
                            )}
                          />
                        </div>
                      </div>

                      {/* <div className="col-md-6">
                        <label for="folder">Folder</label>
                        <select
                          name="folderId"
                          disabled
                          className="form-control form-select"
                          id="folderId"
                          {...register("folderId")}
                        >
                          <option value="" selected disabled>
                            New Document Location
                          </option>
                          {rootFolder?.parentFolders?.map((folder) => (
                            <option value={folder?.id} key={folder?.id}>
                              {folder?.name}
                            </option>
                          ))}
                        </select>
                      </div> */}

                      <div className="col-md-6">
                        <div className="form-group mt-2">
                          <label for="model">Model</label>
                          <input
                            type="text"
                            disabled
                            className="form-control"
                            id="model"
                            name="model"
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
                            disabled
                            name="serialNumber"
                            placeholder=""
                            {...register("serialNumber")}
                          />
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="form-group mt-2">
                          <label for="model">Device Id</label>
                          <input
                            type="text"
                            disabled
                            className="form-control"
                            id="deviceId"
                            name="deviceId"
                            placeholder=""
                            {...register("deviceId")}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label for="category">Category</label>
                        <select
                          name="category"
                          className="form-control form-select"
                          id="category"
                          disabled
                          {...register("category", {
                            required: {
                              value: true,
                              message: `Please select category`,
                            },
                          })}
                          onChange={(e) => {
                            categoryChange(e.target.value);
                          }}
                        >
                          <option value="">Select category</option>
                          {category?.map((itm) => (
                            <option
                              selected={
                                selectedAsset?.category === itm?.lovValue
                              }
                              value={itm?.lovValue}
                            >
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
                      <div className="col-md-6">
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
                            <option
                              selected={
                                selectedAsset?.subCategory === itm?.lovValue
                              }
                              value={itm?.lovValue}
                            >
                              {itm?.lovValue}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label for="subCategory2">Sub Category 2</label>
                        <select
                          name="subCategory2"
                          disabled
                          className="form-control form-select"
                          id="subCategory2"
                          {...register("subCategory2")}
                        >
                          <option value="">Select Sub Category 2</option>
                          {subCategory2List?.map((itm) => (
                            <option
                              selected={
                                selectedAsset?.subCategory2 === itm?.lovValue
                              }
                              value={itm?.lovValue}
                            >
                              {itm?.lovValue}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <div className="col-md-6">
                          <label for="subCategory3">Sub Category 3</label>
                          <select
                            name="subCategory3"
                            disabled
                            className="form-control form-select"
                            id="subCategory3"
                            {...register("subCategory3")}
                          >
                            <option value=""></option>
                            {subCategory3List?.map((itm) => (
                              <option
                                selected={
                                  selectedAsset?.subCategory3 === itm?.lovValue
                                }
                                value={itm?.lovValue}
                              >
                                {itm?.lovValue}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4 text-center">
                    <div className="form-group">
                      {selectedAsset?.image && (
                        <img
                          src={selectedAsset?.image}
                          style={{ width: "100%" }}
                          className="img img-responsive border p-2 m-2"
                        />
                      )}
                      {!selectedAsset?.image && (
                        <strong>Asset Image is not available</strong>
                      )}
                    </div>
                  </div>
                </div>
                <div className="row" style={{ height: "auto" }}>
                  <div className="col-md-4 mt-2">
                    <input
                      type="checkbox"
                      id="patItem"
                      disabled
                      name="patItem"
                      className="form-check-input"
                      {...register("patItem")}
                    />
                    &nbsp;&nbsp;
                    <label for="patItem">
                      PAT item (fill PAT details below)
                    </label>
                  </div>
                  <div className="col-md-4 mt-2">
                    <input
                      type="checkbox"
                      id="pfpItem"
                      name="pfpItem"
                      disabled
                      className="form-check-input"
                      {...register("pfpItem")}
                    />
                    &nbsp;&nbsp;
                    <label for="pfpItem">
                      Passive fire schedule required (fill PFS details below
                      below)
                    </label>
                  </div>
                  <div className="col-md-4 mt-2">
                    <input
                      type="checkbox"
                      id="doorItem"
                      name="doorItem"
                      disabled
                      className="form-check-input"
                      {...register("doorItem")}
                    />
                    &nbsp;&nbsp;
                    <label for="doorItem">
                      Door Assets (fill Door assets details below below)
                    </label>
                  </div>
                </div>
                {/* start */}

                {/* end */}
              </div>
            </div>
          </Box>
          {/*  */}
          <Box sx={{ width: "100%", typography: "body1" }}>
            <TabContext value={value}>
              <Box
                sx={{
                  "& .MuiTabs-flexContainer": {
                    flexWrap: "wrap",
                  },
                }}
              >
                <TabList onChange={tabChange} aria-label="lab API tabs example">
                  <Tab
                    className="text-success"
                    label="Tagged Documents"
                    value="1"
                  />
                  <Tab
                    className={
                      selectedAsset?.purchaseDate &&
                      selectedAsset?.supplier &&
                      selectedAsset?.transactionId &&
                      selectedAsset?.cost &&
                      selectedAsset?.invoiceFile
                        ? "text-success"
                        : "text-warning"
                    }
                    // icon={
                    //   selectedAsset?.purchaseDate &&
                    //   selectedAsset?.supplier &&
                    //   selectedAsset?.transactionId &&
                    //   selectedAsset?.cost &&
                    //   selectedAsset?.invoiceFile ? (
                    //     <CheckCircleOutlineIcon />
                    //   ) : (
                    //     <WarningAmberIcon />
                    //   )
                    // }
                    label="Purchase Details"
                    value="2"
                  />
                  <Tab
                    // icon={
                    //   selectedAsset?.position &&
                    //   selectedAsset?.floor &&
                    //   selectedAsset?.room ? (
                    //     <CheckCircleOutlineIcon />
                    //   ) : (
                    //     <WarningAmberIcon />
                    //   )
                    // }
                    className={
                      selectedAsset?.position &&
                      selectedAsset?.floor &&
                      selectedAsset?.room
                        ? "text-success"
                        : "text-warning"
                    }
                    label="Location"
                    value="3"
                  />
                  <Tab
                    className={
                      selectedAsset?.valuationDate &&
                      selectedAsset?.disposalDate &&
                      selectedAsset?.disposalTo &&
                      selectedAsset?.disposalValue &&
                      selectedAsset?.valuationUserId &&
                      selectedAsset?.valuationValue
                        ? "text-success"
                        : "text-warning"
                    }
                    // icon={
                    //   selectedAsset?.valuationDate &&
                    //   selectedAsset?.disposalDate &&
                    //   selectedAsset?.disposalTo &&
                    //   selectedAsset?.disposalValue &&
                    //   selectedAsset?.valuationUserId &&
                    //   selectedAsset?.valuationValue ? (
                    //     <CheckCircleOutlineIcon />
                    //   ) : (
                    //     <WarningAmberIcon />
                    //   )
                    // }
                    label="Valuation & Disposal"
                    value="4"
                  />
                  {selectedAsset?.patItem && (
                    <Tab
                      // icon={
                      //   selectedAsset?.assetPATItems?.length > 0 ? (
                      //     <CheckCircleOutlineIcon />
                      //   ) : (
                      //     <WarningAmberIcon />
                      //   )
                      // }
                      label="PAT Details"
                      value="5"
                      className={
                        selectedAsset?.assetPATItems?.length > 0
                          ? "text-success"
                          : "text-warning"
                      }
                    />
                  )}
                  {selectedAsset?.pfpItem && (
                    <Tab
                      // icon={
                      //   selectedAsset?.assetPFPItem ? (
                      //     <CheckCircleOutlineIcon />
                      //   ) : (
                      //     <WarningAmberIcon />
                      //   )
                      // }
                      className={
                        selectedAsset?.assetPFPItem
                          ? "text-success"
                          : "text-warning"
                      }
                      label="Passive Fire Protection"
                      value="6"
                    />
                  )}
                  {selectedAsset?.patItem && (
                    <Tab
                      // icon={
                      //   selectedAsset?.assetDoorSpecifications ? (
                      //     <CheckCircleOutlineIcon />
                      //   ) : (
                      //     <WarningAmberIcon />
                      //   )
                      // }
                      className={
                        selectedAsset?.assetDoorSpecifications
                          ? "text-success"
                          : "text-warning"
                      }
                      label="Door Specifications"
                      value="7"
                    />
                  )}
                </TabList>
              </Box>
              <TabPanel value="1">
                {showPdfModal && (
                  <PdfViewer
                    showPdfModal={showPdfModal}
                    setShowPdfModal={setShowPdfModal}
                    selectedPdf={selectedPdf}
                  />
                )}
                <div className="container-fluid">
                  <div className="table-responsive">
                    <table className="table f-11">
                      <thead className="table-dark">
                        <tr>
                          <th scope="col">File</th>
                          <th scope="col">Version</th>
                          <th scope="col">Uploaded By</th>
                          <th scope="col">Date</th>
                          <th scope="col">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!selectedAsset?.files && (
                          <tr className="text-center">
                            <td colSpan={6}>No Result Found.</td>
                          </tr>
                        )}
                        {selectedAsset?.files?.map((file, index) => (
                          <tr key={index}>
                            <td>
                              <div>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setShowPdfModal(true);
                                    setSelectedPdf(file?.fileBlobUrl);
                                  }}
                                >
                                  <TextSnippetOutlinedIcon
                                    style={{ color: "#384BD3" }}
                                  />
                                  <span className="p-3 cursor">
                                    {file?.name}
                                  </span>
                                </button>
                              </div>
                            </td>
                            <td>
                              {file?.fileVersion ? file?.fileVersion : "--"}
                            </td>
                            <td>
                              {file?.uploaderUserName
                                ? file?.uploaderUserName
                                : "--"}
                            </td>
                            <td>
                              {file?.expiryDate
                                ? moment(file?.expiryDate).format("DD/MM/YYYY")
                                : "--"}
                            </td>
                            <td>
                              <button
                                className="btn btn-sm border-less"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setShowPdfModal(true);
                                  setSelectedPdf(file?.fileBlobUrl);
                                }}
                              >
                                <i
                                  className="fa fa-eye fa-2x"
                                  aria-hidden="true"
                                ></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabPanel>
              <TabPanel value="2">
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
                          disabled
                          placeholder=""
                          {...purchaseDetailForm.register("purchaseDate", {
                            required: {
                              value: true,
                              message: `Please enter purchase date.`,
                            },
                          })}
                        />
                        {purchaseDetailForm.formState.errors?.purchaseDate && (
                          <InputError
                            message={
                              purchaseDetailForm.formState.errors?.purchaseDate
                                ?.message
                            }
                            key={
                              purchaseDetailForm.formState.errors?.purchaseDate
                                ?.message
                            }
                          />
                        )}
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label for="supplier">Supplier</label>
                        <input
                          disabled
                          type="text"
                          className="form-control"
                          id="supplier"
                          name="supplier"
                          placeholder=""
                          {...purchaseDetailForm.register("supplier", {
                            required: {
                              value: true,
                              message: `Please enter supplier`,
                            },
                          })}
                        />
                        {purchaseDetailForm.formState.errors?.supplier && (
                          <InputError
                            message={
                              purchaseDetailForm.formState.errors?.supplier
                                ?.message
                            }
                            key={
                              purchaseDetailForm.formState.errors?.supplier
                                ?.message
                            }
                          />
                        )}
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label for="transactionId">Transaction ID</label>
                        <input
                          type="number"
                          className="form-control"
                          id="transactionId"
                          disabled
                          name="transactionId"
                          placeholder=""
                          {...purchaseDetailForm.register("transactionId", {
                            required: {
                              value: true,
                              message: `Please enter transaction ID`,
                            },
                          })}
                        />
                        {purchaseDetailForm.formState.errors?.transactionId && (
                          <InputError
                            message={
                              purchaseDetailForm.formState.errors?.transactionId
                                ?.message
                            }
                            key={
                              purchaseDetailForm.formState.errors?.transactionId
                                ?.message
                            }
                          />
                        )}
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
                          disabled
                          placeholder=""
                          {...purchaseDetailForm.register("cost", {
                            required: {
                              value: true,
                              message: `Please enter cost`,
                            },
                          })}
                        />
                        {purchaseDetailForm.formState.errors?.cost && (
                          <InputError
                            message={
                              purchaseDetailForm.formState.errors?.cost?.message
                            }
                            key={
                              purchaseDetailForm.formState.errors?.cost?.message
                            }
                          />
                        )}
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
              <TabPanel value="3">
                <form onSubmit={locationForm.handleSubmit(submitLocationForm)}>
                  <div className="row">
                    <div className="col-md-4">
                      <label for="position">Interior/Exterior</label>
                      <select
                        name="position"
                        className="form-control form-select"
                        id="position"
                        disabled
                        {...locationForm.register("position", {
                          required: {
                            value: true,
                            message: `Please select Interior/Exterior`,
                          },
                        })}
                      >
                        <option value="">Select Interior/Exterior</option>
                        {["Interior", "Exterior"].map(
                          (num) => (
                            <option value={num}>{num} </option>
                          )
                        )}
                      </select>
                      {locationForm.formState.errors?.position && (
                        <InputError
                          message={
                            locationForm.formState.errors?.position?.message
                          }
                          key={locationForm.formState.errors?.position?.message}
                        />
                      )}
                    </div>
                    <div className="col-md-4">
                      <label for="floor">Floor</label>
                      <select
                        name="floor"
                        className="form-control form-select"
                        id="floor"
                        disabled
                        {...locationForm.register("floor", {
                          required: {
                            value: true,
                            message: `Please select floor`,
                          },
                        })}
                      >
                        <option value="">Select Floor</option>
                        {siteLayout
                          .filter((site) => site.nodeType === "floor")
                          .map((site) => (
                            <option value={site.nodeName}>
                              {site.nodeName}{" "}
                            </option>
                          ))}
                      </select>
                      {locationForm.formState.errors?.floor && (
                        <InputError
                          message={
                            locationForm.formState.errors?.floor?.message
                          }
                          key={locationForm.formState.errors?.floor?.message}
                        />
                      )}
                    </div>
                    <div className="col-md-4">
                      <label for="room">Room</label>
                      <select
                        name="room"
                        disabled
                        className="form-control form-select"
                        id="room"
                        {...locationForm.register("room", {
                          required: {
                            value: true,
                            message: `Please select room`,
                          },
                        })}
                      >
                        <option value="">Select Room</option>
                        {siteLayout
                          .filter((site) => site.nodeType === "room")
                          .map((site) => (
                            <option value={site.nodeName}>
                              {site.nodeName}
                            </option>
                          ))}
                      </select>
                      {locationForm.formState.errors?.room && (
                        <InputError
                          message={locationForm.formState.errors?.room?.message}
                          key={locationForm.formState.errors?.room?.message}
                        />
                      )}
                    </div>
                  </div>
                </form>
              </TabPanel>
              <TabPanel value="4">
                <form
                  onSubmit={valudationForm.handleSubmit(submitValudationForm)}
                >
                  <div className="row">
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label for="valuationDate">Valuation Date</label>
                        <input
                          type="date"
                          className="form-control"
                          id="valuationDate"
                          disabled
                          name="valuationDate"
                          placeholder=""
                          {...valudationForm.register("valuationDate", {
                            required: {
                              value: true,
                              message: `Please enter valuation date`,
                            },
                          })}
                        />
                        {valudationForm.formState.errors?.valuationDate && (
                          <InputError
                            message={
                              valudationForm.formState.errors?.valuationDate
                                ?.message
                            }
                            key={
                              valudationForm.formState.errors?.valuationDate
                                ?.message
                            }
                          />
                        )}
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label for="valuationValue">Valuation</label>
                        <input
                          type="number"
                          className="form-control"
                          disabled
                          id="valuationValue"
                          name="valuationValue"
                          placeholder=""
                          {...valudationForm.register("valuationValue", {
                            required: {
                              value: true,
                              message: `Please enter valuation value`,
                            },
                          })}
                        />
                        {valudationForm.formState.errors?.valuationValue && (
                          <InputError
                            message={
                              valudationForm.formState.errors?.valuationValue
                                ?.message
                            }
                            key={
                              valudationForm.formState.errors?.valuationValue
                                ?.message
                            }
                          />
                        )}
                      </div>
                    </div>
                    <div className="col-md-4">
                      <label for="valuationUserId">Valuation Done By</label>
                      <select
                        name="valuationUserId"
                        className="form-control form-select"
                        id="valuationUserId"
                        disabled
                        {...valudationForm.register("valuationUserId", {
                          required: {
                            value: true,
                            message: `Please select valuation done by`,
                          },
                        })}
                      >
                        <option value=""></option>
                        {users?.map((itm) => (
                          <option value={itm?.id} key={itm?.name}>
                            {itm?.name}
                          </option>
                        ))}
                      </select>
                      {valudationForm.formState.errors?.valuationUserId && (
                        <InputError
                          message={
                            valudationForm.formState.errors?.valuationUserId
                              ?.message
                          }
                          key={
                            valudationForm.formState.errors?.valuationUserId
                              ?.message
                          }
                        />
                      )}
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
                          {...valudationForm.register("disposalDate", {
                            required: {
                              value: true,
                              message: `Please enter disposal date`,
                            },
                          })}
                        />
                        {valudationForm.formState.errors?.disposalDate && (
                          <InputError
                            message={
                              valudationForm.formState.errors?.disposalDate
                                ?.message
                            }
                            key={
                              valudationForm.formState.errors?.disposalDate
                                ?.message
                            }
                          />
                        )}
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label for="disposalValue">Disposal Value</label>
                        <input
                          type="number"
                          className="form-control"
                          id="disposalValue"
                          disabled
                          name="disposalValue"
                          placeholder=""
                          {...valudationForm.register("disposalValue", {
                            required: {
                              value: true,
                              message: `Please enter disposal value`,
                            },
                          })}
                        />
                        {valudationForm.formState.errors?.disposalValue && (
                          <InputError
                            message={
                              valudationForm.formState.errors?.disposalValue
                                ?.message
                            }
                            key={
                              valudationForm.formState.errors?.disposalValue
                                ?.message
                            }
                          />
                        )}
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
                          {...valudationForm.register("disposalTo", {
                            required: {
                              value: true,
                              message: `Please enter disposal to`,
                            },
                          })}
                        />
                        {valudationForm.formState.errors?.disposalTo && (
                          <InputError
                            message={
                              valudationForm.formState.errors?.disposalTo
                                ?.message
                            }
                            key={
                              valudationForm.formState.errors?.disposalTo
                                ?.message
                            }
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </form>
              </TabPanel>
              <TabPanel value="5">
                {" "}
                <div className="row">
                  <div className="col-md-12 mt-2">
                    <div className="table-responsive">
                      <table className="table table-bordered f-11">
                        <thead className="table-dark">
                          <tr>
                            <th scope="col">Tester</th>
                            <th scope="col">Test Date</th>
                            <th scope="col">Next Test Date</th>
                            <th scope="col">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {patRecord?.length === 0 && (
                            <tr>
                              <td colSpan={4}>No PAT Record Found.</td>
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
                              <td></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div></div>
                </div>
              </TabPanel>
              <TabPanel value="6">
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
                        {...passiveFireProtectionForm.register("product", {
                          required: {
                            value: true,
                            message: `Please enter product name`,
                          },
                        })}
                      />
                      {passiveFireProtectionForm.formState.errors?.product && (
                        <InputError
                          message={
                            passiveFireProtectionForm.formState.errors?.product
                              ?.message
                          }
                          key={
                            passiveFireProtectionForm.formState.errors?.product
                              ?.message
                          }
                        />
                      )}
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group mt-2">
                      <label for="access">Access/Position</label>
                      <input
                        disabled
                        type="text"
                        className="form-control"
                        id="access"
                        name="access"
                        placeholder=""
                        {...passiveFireProtectionForm.register("access", {
                          required: {
                            value: true,
                            message: `Please enter Access/Position`,
                          },
                        })}
                      />
                      {passiveFireProtectionForm.formState.errors?.access && (
                        <InputError
                          message={
                            passiveFireProtectionForm.formState.errors?.access
                              ?.message
                          }
                          key={
                            passiveFireProtectionForm.formState.errors?.access
                              ?.message
                          }
                        />
                      )}
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group mt-2">
                      <label for="material">Material</label>
                      <select
                        name="material"
                        disabled
                        className="form-control form-select"
                        id="material"
                        {...passiveFireProtectionForm.register("material", {
                          required: {
                            value: true,
                            message: `Please select material`,
                          },
                        })}
                      >
                        <option value="">Select Material</option>
                        {passiveFireMaterial?.map((itm) => (
                          <option value={itm?.lovValue}>{itm?.lovValue}</option>
                        ))}
                      </select>
                      {passiveFireProtectionForm.formState.errors?.material && (
                        <InputError
                          message={
                            passiveFireProtectionForm.formState.errors?.material
                              ?.message
                          }
                          key={
                            passiveFireProtectionForm.formState.errors?.material
                              ?.message
                          }
                        />
                      )}
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group mt-2">
                      <label for="service">Service</label>
                      <input
                        type="text"
                        className="form-control"
                        id="service"
                        disabled
                        name="service"
                        placeholder=""
                        {...passiveFireProtectionForm.register("service", {
                          required: {
                            value: true,
                            message: `Please enter service`,
                          },
                        })}
                      />
                      {passiveFireProtectionForm.formState.errors?.service && (
                        <InputError
                          message={
                            passiveFireProtectionForm.formState.errors?.service
                              ?.message
                          }
                          key={
                            passiveFireProtectionForm.formState.errors?.service
                              ?.message
                          }
                        />
                      )}
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group mt-2">
                      <label for="dimension">Dimension</label>
                      <input
                        type="text"
                        className="form-control"
                        id="dimension"
                        disabled
                        name="dimension"
                        placeholder=""
                        {...passiveFireProtectionForm.register("dimension", {
                          required: {
                            value: true,
                            message: `Please enter dimension`,
                          },
                        })}
                      />
                      {passiveFireProtectionForm.formState.errors
                        ?.dimension && (
                        <InputError
                          message={
                            passiveFireProtectionForm.formState.errors
                              ?.dimension?.message
                          }
                          key={
                            passiveFireProtectionForm.formState.errors
                              ?.dimension?.message
                          }
                        />
                      )}
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
                        disabled
                        placeholder=""
                        {...passiveFireProtectionForm.register("quantity", {
                          required: {
                            value: true,
                            message: `Please enter quantity`,
                          },
                        })}
                      />
                      {passiveFireProtectionForm.formState.errors?.quantity && (
                        <InputError
                          message={
                            passiveFireProtectionForm.formState.errors?.quantity
                              ?.message
                          }
                          key={
                            passiveFireProtectionForm.formState.errors?.quantity
                              ?.message
                          }
                        />
                      )}
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
                        {...passiveFireProtectionForm.register("area", {
                          required: {
                            value: true,
                            message: `Please enter area (in sq m)`,
                          },
                        })}
                      />
                      {passiveFireProtectionForm.formState.errors?.area && (
                        <InputError
                          message={
                            passiveFireProtectionForm.formState.errors?.area
                              ?.message
                          }
                          key={
                            passiveFireProtectionForm.formState.errors?.area
                              ?.message
                          }
                        />
                      )}
                    </div>
                  </div>
                </div>
              </TabPanel>
              <TabPanel value="7">
                <div className="row">
                  <div className="col-md-4">
                    <div className="form-group mt-2">
                      <label for="width">Door Width (mm)</label>
                      <input
                        type="text"
                        className="form-control"
                        id="width"
                        name="width"
                        placeholder=""
                        disabled
                        {...doorSpecificationForm.register("width", {
                          required: {
                            value: true,
                            message: `Please enter door width (in mm)`,
                          },
                        })}
                      />
                      {doorSpecificationForm.formState.errors?.width && (
                        <InputError
                          message={
                            doorSpecificationForm.formState.errors?.width
                              ?.message
                          }
                          key={
                            doorSpecificationForm.formState.errors?.width
                              ?.message
                          }
                        />
                      )}
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group mt-2">
                      <label for="height">Door Height (mm)</label>
                      <input
                        type="text"
                        className="form-control"
                        id="height"
                        disabled
                        name="height"
                        placeholder=""
                        {...doorSpecificationForm.register("height", {
                          required: {
                            value: true,
                            message: `Please enter door height (in mm)`,
                          },
                        })}
                      />
                      {doorSpecificationForm.formState.errors?.height && (
                        <InputError
                          message={
                            doorSpecificationForm.formState.errors?.height
                              ?.message
                          }
                          key={
                            doorSpecificationForm.formState.errors?.height
                              ?.message
                          }
                        />
                      )}
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group mt-2">
                      <label for="depth">Door Depth (mm)</label>
                      <input
                        type="text"
                        className="form-control"
                        id="depth"
                        disabled
                        name="depth"
                        placeholder=""
                        {...doorSpecificationForm.register("depth", {
                          required: {
                            value: true,
                            message: `Please enter door depth (in mm)`,
                          },
                        })}
                      />
                      {doorSpecificationForm.formState.errors?.depth && (
                        <InputError
                          message={
                            doorSpecificationForm.formState.errors?.depth
                              ?.message
                          }
                          key={
                            doorSpecificationForm.formState.errors?.depth
                              ?.message
                          }
                        />
                      )}
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group mt-2">
                      <label for="finish">Door Finish</label>
                      <input
                        type="text"
                        disabled
                        className="form-control"
                        id="finish"
                        name="finish"
                        placeholder=""
                        {...doorSpecificationForm.register("finish", {
                          required: {
                            value: true,
                            message: `Please enter door finish`,
                          },
                        })}
                      />
                      {doorSpecificationForm.formState.errors?.finish && (
                        <InputError
                          message={
                            doorSpecificationForm.formState.errors?.finish
                              ?.message
                          }
                          key={
                            doorSpecificationForm.formState.errors?.finish
                              ?.message
                          }
                        />
                      )}
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
                        disabled
                        {...doorSpecificationForm.register("visionPanel", {
                          required: {
                            value: true,
                            message: `Please enter vision panel`,
                          },
                        })}
                      />
                      {doorSpecificationForm.formState.errors?.visionPanel && (
                        <InputError
                          message={
                            doorSpecificationForm.formState.errors?.visionPanel
                              ?.message
                          }
                          key={
                            doorSpecificationForm.formState.errors?.visionPanel
                              ?.message
                          }
                        />
                      )}
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
                        disabled
                        placeholder=""
                        {...doorSpecificationForm.register("fireRating", {
                          required: {
                            value: true,
                            message: `Please enter fire rating`,
                          },
                        })}
                      />
                      {doorSpecificationForm.formState.errors?.fireRating && (
                        <InputError
                          message={
                            doorSpecificationForm.formState.errors?.fireRating
                              ?.message
                          }
                          key={
                            doorSpecificationForm.formState.errors?.fireRating
                              ?.message
                          }
                        />
                      )}
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group mt-2">
                      <label for="frameMaterial">Fire Material</label>
                      <input
                        type="text"
                        className="form-control"
                        id="frameMaterial"
                        disabled
                        name="frameMaterial"
                        placeholder=""
                        {...doorSpecificationForm.register("frameMaterial", {
                          required: {
                            value: true,
                            message: `Please enter fire material`,
                          },
                        })}
                      />
                      {doorSpecificationForm.formState.errors
                        ?.frameMaterial && (
                        <InputError
                          message={
                            doorSpecificationForm.formState.errors
                              ?.frameMaterial?.message
                          }
                          key={
                            doorSpecificationForm.formState.errors
                              ?.frameMaterial?.message
                          }
                        />
                      )}
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
                        disabled
                        placeholder=""
                        {...doorSpecificationForm.register("frameFinish", {
                          required: {
                            value: true,
                            message: `Please enter frame finish`,
                          },
                        })}
                      />
                      {doorSpecificationForm.formState.errors?.frameFinish && (
                        <InputError
                          message={
                            doorSpecificationForm.formState.errors?.frameFinish
                              ?.message
                          }
                          key={
                            doorSpecificationForm.formState.errors?.frameFinish
                              ?.message
                          }
                        />
                      )}
                    </div>
                  </div>
                </div>
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
  siteLayout: state.site.siteLayout,
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
  getSiteLayout,
})(UpdateAsset);
