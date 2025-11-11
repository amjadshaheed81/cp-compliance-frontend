import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import Box from "@mui/material/Box";
import { CircularProgress } from "@mui/material";
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
import { del, get, put } from "../../../../api";
import { ROLE } from "../../../../Constant/Role";
import moment from "moment";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import "./AssetStyle.css";
import Swal from "sweetalert2";
import TagAsset from "./TagAsset";
import TextSnippetOutlinedIcon from "@mui/icons-material/TextSnippetOutlined";
import PdfViewer from "../Documents/PdfViewer";
import DatePicker from "../../../common/DatePicker";
import ValuationComponent from "./ValuationComponent";

import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { formatDate } from "../../../../utils/dateFormat";

async function fetchBlob(selectedPdf) {
  try {
    const response = await fetch(selectedPdf);
    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error("Error fetching the PDF:", error);
    throw error; // Re-throw the error so it can be handled by the caller
  }
}

const UpdateAsset = ({
                       setLoader,
                       siteSelectedForGlobal,
                       getDocumentsRootFolder,
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

  const [searchParams] = useSearchParams();
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [tester, setTester] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
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
  const [relatedAssetOption, setRelatedAssetOption] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState("");
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [valuations, setValuations] = useState([]);
  const [valuationModified, setValuationModified] = useState(false);


  // useEffect(() => {
  //   const setFloorsData = async () => {
  //     if (siteLayout?.length > 0) {
  //       const data = siteLayout.filter((site) => site.nodeType === "floor");
  //       setFloors(data || []);
  //       const data2 = siteLayout.filter((site) => site.nodeType === "room");
  //       setRooms(data2 || []);
  //     }
  //   };
  //   setFloorsData();
  // }, [siteLayout]);

  const setFloorsData = async (value) => {
    if (siteLayout?.length > 0) {
      const node = siteLayout.filter((site) => site.nodeName === value);
      const data = siteLayout.filter(
          (site) => site.nodeType === "floor" && site.parentNode === node?.[0]?.id
      );
      setFloors(data || []);
    }
  };

  const setRoomsData = async (value) => {
    if (siteLayout?.length > 0) {
      const node = siteLayout.filter((site) => site.nodeName === value);
      const data = siteLayout.filter(
          (site) => site.nodeType === "room" && site.parentNode === node?.[0]?.id
      );
      setRooms(data || []);
    }
  };

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
    } else {
      Swal.fire({
        icon: "error",
        title: "Site is not selected",
        text: "Please select site from site search and try again.",
      });
      return;
    }
  }, []);

  useEffect(() => {
    if (selectedAsset) {
      getCategories();
    }
  }, [selectedAsset]);

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
    const subCategoryData = subCategory?.filter(
        (itm) => itm?.attribite1 === selectedAsset?.category
    );
    setSubCategory2List(subCategoryData);
    const subCategoryData2 = subCategory2?.filter(
        (itm) => itm?.attribite1 === selectedAsset?.subCategory
    );
    setSubCategory2List(subCategoryData2);
    setSubCategory3(subCategory3);
    const subCategoryData3 = subCategory3?.filter(
        (itm) => itm?.attribite1 === selectedAsset?.subCategory2
    );
    setSubCategory3List(subCategoryData3);
  };

  const getTester = async () => {
    const url = `/api/user/all`;
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

  const toggleEditMode = (index) => {
    const updatedRecords = [...patRecord];
    updatedRecords[index].isEditing = !updatedRecords[index].isEditing;
    setPatRecord(updatedRecords);
  };

  const updatePatStatus = (index, status) => {
    const updatedRecords = [...patRecord];
    updatedRecords[index].patStatus = status;
    setPatRecord(updatedRecords);
    savePatDetails();
  };

  const handleInputpATChange = (index, field, value) => {
    const updatedRecords = [...patRecord];
    updatedRecords[index][field] = value;
    setPatRecord(updatedRecords);
  };

  const savePatDetails = async () => {
    setLoader(true);
    const data = patRecord?.map((itm) => {
      return {
        ...itm,
        patDate: itm?.patDate?.includes("T")
            ? itm?.patDate?.replace(/T/g, " ")
            : `${itm?.patDate} 10:00:00`,
        patNextDate: itm?.patNextDate?.includes("T")
            ? itm?.patNextDate?.replace(/T/g, " ")
            : `${itm?.patNextDate} 10:00:00`,
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

  const deletAssetImage = async (image) => {
    Swal.fire({
      title: `Are you sure you'd like to permanently delete this image?`,
      showDenyButton: false,
      showCancelButton: true,
      confirmButtonText: "Delete",
    }).then(async (result) => {
      if (result.isConfirmed) {
        await del(`/api/site/assets/image/${image.assetImageId}`);
        toast.success("Image deleted successfully");
        await getAssetDetails();
      } else if (result.isDenied) {
        // Swal.fire("Changes are not saved", "", "info");
      }
    });
  };
  const sortValuations = (valuations) => {
    return [...valuations].sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return new Date(a.date) - new Date(b.date);
    });
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
    // Initialize valuations
    if (response?.valuations?.length > 0) {
      // If no valid valuations exist, initialize with empty array
      setValuations(sortValuations(response.valuations));
    }
    //  else if (response?.date) {
    //   // For backward compatibility with single valuation
    //   setValuations([
    //     {
    //       date: response.date?.split("T")?.[0] || "",
    //       valuation: response.valuation || "",
    //       valuationBy: response.valuationBy || "",
    //       valuationUserName: response.valuationUserName || "",
    //     },
    //   ]);
    // } else {
    //   // Default empty valuation
    //   setValuations([
    //     {
    //       date: "",
    //       valuation: "",
    //       valuationBy: "",
    //     },
    //   ]);
    // }

    disposalForm.reset({
      disposalDate: response?.disposalDate?.split("T")?.[0] || "",
      disposalTo: response?.disposalTo || "",
      disposalValue: response?.disposalValue || "",
    });

    if (response?.position?.length > 0) {
      setFloorsData(response?.position);
    }
    if (response?.floor?.length > 0) {
      setRoomsData(response?.floor);
    }
    passiveFireProtectionForm.reset(response?.assetPFPItem);
    // In the getAssetDetails function, update the door specification form reset:
    doorSpecificationForm.reset({
      ...response?.assetDoorSpecifications,
      doorWidth: response?.assetDoorSpecifications?.doorWidth,
      doorHeight: response?.assetDoorSpecifications?.doorHeight,
      doorDepth: response?.assetDoorSpecifications?.doorDepth,
    });
    reset(response);
    initRelatedAssetOptions(response);
  };

  const initRelatedAssetOptions = (response) => {
    const selectedAssets = response?.relatedAssetId?.split(",");
    const arr = [];
    if (selectedAssets?.length > 0) {
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
    setRelatedAssetOption(arr);
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
    powerOutput: "",
    damperSize: null,
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
  const submitSiteAsset = async (data) => {
    setLoader(true);
    let form_data = new FormData();
    const { assetImage, ...formData } = data;
    if (data?.assetImage?.length > 0) {
      data?.assetImage?.forEach((assetImage) => {
        form_data.append("assetImage", assetImage);
      });
    }
    const formDetails = {
      assetId: formData?.assetId,
      assetName: formData?.assetName,
      manufacturer: formData?.manufacturer,
      category: formData?.category,
      subCategory: formData?.subCategory,
      subCategory2: formData?.subCategory2,
      subCategory3: formData?.subCategory3,
      model: formData?.model,
      deviceId: formData?.deviceId,
      serialNumber: formData?.serialNumber,
      powerOutput: formData?.powerOutput,
      damperSize: formData?.damperSize,
      relatedAssetId: relatedAssetOption?.map((item) => item.key).join(","),
      folderId: null,
      patItem: formData?.patItem,
      pfpItem: formData?.pfpItem,
      doorItem: formData?.doorItem,
      barcode: "code",
      position: selectedAsset?.position || null,
      floor: selectedAsset?.floor || null,
      room: selectedAsset?.room || null,
    };

    form_data.append("assetRequestString", JSON.stringify(formDetails));
    try {
      await addSiteAsset(form_data, null, siteSelectedForGlobal?.siteId);
      await getAssetDetails();

      setLoader(false);
    } catch (e) {
      toast.error("Something went wrong while update asset. Please try again.");
      setLoader(false);
    }
  };

  const purchaseDetailForm = useForm({
    defaultValues: {
      purchaseDate: "",
    },
  });
  const purchaseFrormValues = purchaseDetailForm.watch();

  const submitSiteAssetPurchaseDetail = async (data) => {
    let form_data = new FormData();
    const { purchaseInvoice, ...formData } = data;

    if (purchaseInvoice?.length > 0) {
      form_data.append(
        "purchaseInvoice",
        data?.purchaseInvoice?.[0],
        data?.purchaseInvoice?.[0]?.name
      );
    }

    // Get current asset values from the form
    const assetValues = getValues();

    const submitData = {
      ...formData,
      powerOutput: assetValues.powerOutput, // Use value from main asset form
      damperSize: assetValues.damperSize,   // Use value from main asset form
      purchaseDate: formData?.purchaseDate + " 10:00:00",
      assetId: selectedAsset?.assetId,
      position: selectedAsset?.position,
      floor: selectedAsset?.floor,
      room: selectedAsset?.room,
      disposalDate: selectedAsset?.disposalDate
        ? `${formatDate(selectedAsset.disposalDate)} 10:00:00`
        : null,
      disposalTo: selectedAsset?.disposalTo,
      disposalValue: selectedAsset?.disposalValue,
      valuationBy: selectedAsset?.valuationBy,
      valuation: selectedAsset?.valuation,
      deviceId: selectedAsset?.deviceId,
    };

    form_data.append("assetDetailsRequestString", JSON.stringify(submitData));
    setLoader(true);
    await updatePurchaseDetails(form_data, selectedAsset?.assetId);
    setLoader(false);
    getAssetDetails();
  };


  const locationForm = useForm({});
  const locationFormValues = locationForm.watch();
  const submitLocationForm = async (data) => {
    let form_data = new FormData();

    const assetValues = getValues();

    const submitData = {
      ...data,
      powerOutput: assetValues.powerOutput,
      damperSize: assetValues.damperSize,
      assetId: selectedAsset?.assetId,
      purchaseDate: selectedAsset?.purchaseDate
          ? `${formatDate(selectedAsset.purchaseDate)} 10:00:00`
          : null,
      supplier: selectedAsset?.supplier,
      transactionId: selectedAsset?.transactionId,
      cost: selectedAsset?.cost,
      // date: selectedAsset?.date
      //   ? `${selectedAsset?.date?.split("T")?.[0]} 10:00:00`
      //   : null,
      disposalDate: selectedAsset?.disposalDate
          ? `${formatDate(selectedAsset.disposalDate)} 10:00:00`
          : null,
      disposalTo: selectedAsset?.disposalTo,
      disposalValue: selectedAsset?.disposalValue,
      valuationBy: selectedAsset?.valuationBy,
      valuation: selectedAsset?.valuation,
      deviceId: selectedAsset?.deviceId,
    };
    form_data.append("assetDetailsRequestString", JSON.stringify(submitData));
    setLoader(true);
    await updatePurchaseDetails(form_data, selectedAsset?.assetId);
    setLoader(false);
    getAssetDetails();
  };

  const disposalForm = useForm({
    mode: "onSubmit",
    defaultValues: {
      disposalDate: "",
      disposalValue: "",
      disposalTo: "",
    },
  });

  const submitValuationForm = async (data) => {
    setLoader(true);
    try {
      // Filter out valuations marked for deletion
      const valuationsToDelete = valuations
          .filter((v) => v.delete && v.id)
          .map((v) => ({ id: v.id, delete: true }));

      // Get valid valuations (not marked for deletion)
      const validValuations = valuations.filter(
          (v) => !v.delete && v.date && v.valuation && v.valuationBy
      );

      const assetValues = getValues();

      const submitData = {
        ...data,
        assetId: selectedAsset?.assetId,
        powerOutput: assetValues.powerOutput,
        damperSize: assetValues.damperSize,
        valuations: [
          ...validValuations.map((v) => ({
            id: v.id,
            assetId: selectedAsset?.assetId,
            valuation: v.valuation,
            valuationBy: v.valuationBy,
            date: `${formatDate(v.date)}`, // v.date is now a proper Date object
          })),
          ...valuationsToDelete,
        ],
        position: selectedAsset?.position,
        floor: selectedAsset?.floor,
        room: selectedAsset?.room,
        purchaseDate: selectedAsset?.purchaseDate
            ? `${formatDate(selectedAsset.purchaseDate)} 10:00:00`
            : null,
        supplier: selectedAsset?.supplier,
        transactionId: selectedAsset?.transactionId,
        cost: selectedAsset?.cost,
        deviceId: selectedAsset?.deviceId,
      };

      const form_data = new FormData();
      form_data.append("assetDetailsRequestString", JSON.stringify(submitData));

      await updatePurchaseDetails(form_data, selectedAsset?.assetId);
      setLoader(false);
      getAssetDetails();
      setValuationModified(false);
      toast.success("Valuations saved successfully");
    } catch (error) {
      setLoader(false);
      console.error("Valuation submission error:", error);
      toast.error("Failed to save valuation details");
    }
  };

  const submitDisposalForm = async (data) => {
    // First perform the conditional validation
    const { disposalDate, disposalValue, disposalTo } = data;
    const hasAnyField = disposalDate || disposalValue || disposalTo;

    if (hasAnyField) {
      const errors = {};
      if (!disposalDate)
        errors.disposalDate = {
          message: "Disposal date is required when other fields are filled",
        };
      if (!disposalValue)
        errors.disposalValue = {
          message: "Disposal value is required when other fields are filled",
        };
      if (!disposalTo)
        errors.disposalTo = {
          message: "Disposal to is required when other fields are filled",
        };

      if (Object.keys(errors).length > 0) {
        Object.entries(errors).forEach(([field, error]) => {
          disposalForm.setError(field, error);
        });
        return;
      }
    }

    setLoader(true);

    const assetValues = getValues();

    try {
      const submitData = {
        ...data,
        assetId: selectedAsset?.assetId,
        powerOutput: assetValues.powerOutput,
        damperSize: assetValues.damperSize,
        disposalDate: data.disposalDate
            ? `${formatDate(data.disposalDate)} 10:00:00`
            : null,
        position: selectedAsset?.position,
        floor: selectedAsset?.floor,
        room: selectedAsset?.room,
        purchaseDate: selectedAsset?.purchaseDate
            ? `${formatDate(selectedAsset.purchaseDate)} 10:00:00`
            : null,
        supplier: selectedAsset?.supplier,
        transactionId: selectedAsset?.transactionId,
        cost: selectedAsset?.cost,
        deviceId: selectedAsset?.deviceId,
      };

      const form_data = new FormData();
      form_data.append("assetDetailsRequestString", JSON.stringify(submitData));

      await updatePurchaseDetails(form_data, selectedAsset?.assetId);
      setLoader(false);
      getAssetDetails();
      toast.success("Disposal details saved successfully");
    } catch (error) {
      setLoader(false);
      console.error("Disposal submission error:", error);
      toast.error("Failed to save disposal details");
    }
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
      width: data.doorWidth || '',
      height: data.doorHeight || '',
      depth: data.doorDepth || '',
    };

    setLoader(true);
    try {
      await updateDoorSpecification(submitData, selectedAsset?.assetId);
      toast.success("Door specifications updated successfully");
      getAssetDetails();
    } catch (error) {
      toast.error("Failed to update door specifications");
      console.error("Door specification update error:", error);
    } finally {
      setLoader(false);
    }
  };

  const subCategoryChange = (val) => {
    setValue("subCategory", val);
    const subCategoryData = subCategory2?.filter(
        (itm) => itm?.attribite1 === val
    );
    setSubCategory2List(subCategoryData);
    setValue("subCategory2", null);
    setValue("subCategory3", null);
    setSubCategory3List([]);
  };

  const subCategoryChange2 = (val) => {
    setValue("subCategory2", val);
    const subCategoryData = subCategory3?.filter(
        (itm) => itm?.attribite1 === val
    );
    setSubCategory3List(subCategoryData);
    setValue("subCategory3", null);
  };
  const categoryChange = (val) => {
    setValue("category", val);
    const subCategoryData = subCategory?.filter(
        (itm) => itm?.attribite1 === val
    );
    setValue("subCategory", null);
    setValue("subCategory2", null);
    setValue("subCategory3", null);
    setSubCategory2List([]);
    setSubCategory3List([]);
    setSubCategoryList(subCategoryData);
  };
  const getSelectedValue = () => {
    const arr = [];
    if (relatedAssetOption?.length > 0) {
      for (const iterator of relatedAssetOption) {
        const selectedValue =
            siteAssets.find((itm) => itm.assetId === iterator?.key) || null;
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
  const changePatItem = (e) => {
    const value = e.target.checked;
    setValue("patItem", value);
    setSelectedAsset((prevState) => ({ ...prevState, patItem: value }));
    const ispfpItem = getValues("pfpItem");
    const isdoorItem = getValues("doorItem");
    if (ispfpItem || isdoorItem) {
      setValue("pfpItem", false);
      setValue("doorItem", false);
      setSelectedAsset((prevState) => ({
        ...prevState,
        pfpItem: false,
        doorItem: false,
      }));
    }
  };
  const changePfpItem = (e) => {
    const value = e.target.checked;
    setValue("pfpItem", value);
    setSelectedAsset((prevState) => ({ ...prevState, pfpItem: value }));
    const ispatItem = getValues("patItem");
    const isdoorItem = getValues("doorItem");
    if (ispatItem || isdoorItem) {
      setValue("patItem", false);
      setValue("doorItem", false);
      setSelectedAsset((prevState) => ({
        ...prevState,
        patItem: false,
        doorItem: false,
      }));
    }
  };
  const changeDoorItem = (e) => {
    const value = e.target.checked;
    setValue("doorItem", value);
    setSelectedAsset((prevState) => ({ ...prevState, doorItem: value }));
    const ispatItem = getValues("patItem");
    const ispfpItem = getValues("pfpItem");
    if (ispatItem || ispfpItem) {
      setValue("patItem", false);
      setValue("pfpItem", false);
      setSelectedAsset((prevState) => ({
        ...prevState,
        pfpItem: false,
        patItem: false,
      }));
    }
  };

  const [selectedAssetRows, setSelectedAssetRows] = useState([]);

  // Handle row selection
  const handleRowSelect = (file) => {
    if (selectedAssetRows.includes(file)) {
      // If already selected, deselect it
      setSelectedAssetRows(
          selectedAssetRows.filter((selectedFile) => selectedFile !== file)
      );
    } else {
      // Otherwise, add it to the selected list
      setSelectedAssetRows([...selectedAssetRows, file]);
    }
  };

  const addValuation = () => {
    setValuations((prevValuation) => [
      ...prevValuation,
      {
        tempId: Date.now(),
        date: "",
        valuation: "",
        valuationBy: "",
        delete: false,
      },
    ]);
  };

  const handleRemoveValuation = (index) => {
    setValuations(
        (currentValuations) =>
            currentValuations
                .map((v) => {
                  // Check both tempId and id
                  if ((v.tempId && v.tempId === index) || (v.id && v.id === index)) {
                    if (v.id) {
                      // If it has a real ID (already saved), mark for deletion
                      return { ...v, delete: true };
                    } else {
                      // If it's a new item (only has tempId), mark it to be filtered out immediately
                      // Returning null and filtering is a clean way
                      return null;
                    }
                  }
                  return v;
                })
                .filter((v) => v !== null) // Remove the new items marked as null
    );
  };

  const updateValuation = (index, data) => {
    setValuationModified(true);
    setValuations((currentValuations) =>
        currentValuations.map((v) => {
          if ((v.tempId && v.tempId === index) || (v.id && v.id === index)) {
            return { ...v, ...data }; // Merge the updated fields
          }
          return v;
        })
    );
  };

  // checking tab switching from valuation to another tabs
  const handleTabChange = (event, newValue) => {
    event?.preventDefault();

    // If trying to switch away from valuation tab (value 4) with unsaved changes
    if (value === "4" && valuationModified && newValue !== "4") {
      Swal.fire({
        title: "Unsaved Valuation Changes",
        text: "You have unsaved changes in the Valuation tab. Do you want to save before switching?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Save & Switch",
        cancelButtonText: "Discard & Switch",
        reverseButtons: true,
      }).then((result) => {
        if (result.isConfirmed) {
          submitValuationForm().then(() => {
            setTabValue(newValue);
            setValuationModified(false);
          });
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          setTabValue(newValue);
          setValuationModified(false);
        }
      });
    } else {
      setTabValue(newValue);
    }
  };
  // Method to get all selected rows
  const untagAsset = async () => {
    if (selectedAssetRows?.length === 0) {
      toast.warn("Please select asset which you want to untag.");
    } else {
      const fileIds = selectedAssetRows?.map((item) => item.id);
      const url = `/api/document/untag-file`;
      const data = {
        fileIds: fileIds,
        assetId: Number(assetId),
      };
      const res = await put(url, data);
      if (res?.status === 200) {
        setIsLoading(false);
        toast.success("Files un tagged successfully.");
        getAssetDetails();
        setSelectedAssetRows([]);
      } else {
        setIsLoading(false);
        toast.error("Something went wrong while un tagging files.");
      }
    }
  };
  return (
      <Fragment>
        {showModal && (
            <TagAsset
                showModal={showModal}
                setShowModal={setShowModal}
                siteId={siteSelectedForGlobal?.siteId}
                assetId={assetId}
                refresh={() => {
                  getAssetDetails();
                }}
            />
        )}
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
                  <div className="col-md-6">
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => setShowModal(true)}
                    >
                      Tag Documents
                    </button>
                  </div>
                  <div className="col-md-6">
                    <div className="float-end">
                      <button
                          type="button"
                          className="btn btn-light mb-3 mr-4"
                          onClick={() => goTo("/assets")}
                      >
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
                      <div className="col-md-8" style={{ height: "fit-content" }}>
                        <div className="row">
                          <div className="col-md-6">
                            <div className="form-group mt-2">
                              <label for="assetName">Asset Name</label>
                              <input
                                  type="text"
                                  autoComplete="off"
                                  readOnly
                                  onFocus={(e) =>
                                      e.target.removeAttribute("readonly")
                                  }
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
                                  autoComplete="off"
                                  readOnly
                                  onFocus={(e) =>
                                      e.target.removeAttribute("readonly")
                                  }
                                  className="form-control"
                                  id="manufacturer"
                                  name="manufacturer"
                                  placeholder=""
                                  {...register("manufacturer")}
                              />
                            </div>
                          </div>

                          <div className="col-md-6">
                            <div className="form-group mt-2">
                              <label for="relatedAssetId">Related Asset</label>
                              <Autocomplete
                                  multiple
                                  onChange={(event, newValue) => {
                                    setRelatedAssetOption(newValue);
                                  }}
                                  value={getSelectedValue()}
                                  options={siteAssets.map((option) => {
                                    return {
                                      key: option.assetId,
                                      label:
                                          option.assetId +
                                          " - " +
                                          option.assetName +
                                          " (" +
                                          `${option?.position || "NA"} > ${
                                              option?.floor || "NA"
                                          } > ${option?.room || "NA"}` +
                                          ")",
                                    };
                                  })}
                                  getOptionLabel={(option) => option.label}
                                  renderInput={(params) => (
                                      <TextField
                                          disabled
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
                                  autoComplete="off"
                                  readOnly
                                  onFocus={(e) =>
                                      e.target.removeAttribute("readonly")
                                  }
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
                                  autoComplete="off"
                                  readOnly
                                  onFocus={(e) =>
                                      e.target.removeAttribute("readonly")
                                  }
                                  className="form-control"
                                  id="serialNumber"
                                  name="serialNumber"
                                  placeholder=""
                                  {...register("serialNumber")}
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-group mt-2">
                              <label for="powerOutput">Power Output(KW)</label>
                              <input
                                  type="text"
                                  autoComplete="off"
                                  readOnly
                                  onFocus={(e) =>
                                      e.target.removeAttribute("readonly")
                                  }
                                  className="form-control"
                                  id="powerOutput"
                                  name="powerOutput"
                                  placeholder=""
                                  {...register("powerOutput")}
                              />
                            </div>
                          </div>
                        <div className="col-md-6">
                          <div className="form-group mt-2">
                            <label for="damperSize">Damper Size(mm)</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              autoComplete="off"
                              readOnly
                              onFocus={(e) =>
                                e.target.removeAttribute("readonly")
                              }
                              className="form-control"
                              id="damperSize"
                              name="damperSize"
                              placeholder=""
                              {...register("damperSize")}
                            />
                          </div>
                        </div>
                          <div className="col-md-6 mt-2">
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
                          <div className="col-md-6 mt-2">
                            <label for="subCategory">Sub Category 1</label>
                            <select
                                name="subCategory"
                                className="form-control form-select"
                                id="subCategory"
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
                          <div className="col-md-6 mt-2">
                            <label for="subCategory2">Sub Category 2</label>
                            <select
                                name="subCategory2"
                                className="form-control form-select"
                                id="subCategory2"
                                {...register("subCategory2")}
                                onChange={(e) => {
                                  subCategoryChange2(e.target.value);
                                }}
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
                          <div className="col-md-6 mt-2">
                            <label for="subCategory3">Sub Category 3</label>
                            <select
                                name="subCategory3"
                                className="form-control form-select"
                                id="subCategory3"
                                {...register("subCategory3")}
                            >
                              <option value="">Select Sub Category 3</option>
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
                          <div className="col-md-6">
                            <div className="form-group mt-2">
                              <label for="model">Device Id</label>
                              <input
                                  type="text"
                                  autoComplete="off"
                                  readOnly
                                  onFocus={(e) =>
                                      e.target.removeAttribute("readonly")
                                  }
                                  className="form-control"
                                  id="deviceId"
                                  name="deviceId"
                                  placeholder=""
                                  {...register("deviceId")}
                              />
                            </div>
                          </div>
                          <div className="row"></div>
                          <div className="row">
                            <div className="col-md-4 mt-2">
                              <input
                                  type="checkbox"
                                  id="patItem"
                                  name="patItem"
                                  onClick={changePatItem}
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
                                  onClick={changePfpItem}
                                  className="form-check-input"
                                  {...register("pfpItem")}
                              />
                              &nbsp;&nbsp;
                              <label for="pfpItem">
                                Passive fire schedule required (fill PFS details
                                below below)
                              </label>
                            </div>
                            <div className="col-md-4 mt-2">
                              <input
                                  type="checkbox"
                                  id="doorItem"
                                  name="doorItem"
                                  onClick={changeDoorItem}
                                  className="form-check-input"
                                  {...register("doorItem")}
                              />
                              &nbsp;&nbsp;
                              <label for="doorItem">
                                Door Assets (fill Door assets details below below)
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4 text-center mt-2">
                        <div className="form-group">
                          {selectedAsset?.images?.length > 1 && (
                              <Slider {...carouselSettings}>
                                {selectedAsset?.images?.map((i) => (
                                    <div>
                                      <img
                                          src={i?.imageUrl}
                                          className="img img-responsive border p-2 m-2 w-100"
                                          alt="Asset Image"
                                      />
                                      <button
                                          type="button"
                                          className="btn btn-sm btn-danger mb-2"
                                          onClick={() => {
                                            deletAssetImage(i);
                                          }}
                                      >
                                        Delete
                                      </button>
                                    </div>
                                ))}
                              </Slider>
                          )}
                          {selectedAsset?.images?.length === 1 && (
                              <img
                                  src={selectedAsset?.images[0].imageUrl}
                                  className="img img-responsive border p-2 m-2 w-100"
                              />
                          )}
                          {selectedAsset?.images?.length === 1 && (
                              <button
                                  type="button"
                                  className="btn btn-sm btn-danger mb-2"
                                  onClick={() => {
                                    deletAssetImage(selectedAsset?.images[0]);
                                  }}
                              >
                                Delete
                              </button>
                          )}
                          <input
                              type="file"
                              accept="image/jpeg, image/jpg, image/png"
                              multiple
                              className="form-control"
                              style={{ marginTop: "30px" }}
                              {...register("assetImage")}
                          />
                          {errors?.assetImage && (
                              <InputError
                                  message={errors?.assetImage?.message}
                                  key={errors?.assetImage?.message}
                              />
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="row" style={{ height: "auto" }}></div>
                    {/* start */}

                    {/* end */}
                  </div>
                </div>
              </form>
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
                  <TabList
                      onChange={handleTabChange}
                      aria-label="lab API tabs example"
                  >
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
                          selectedAsset?.date &&
                          selectedAsset?.valuationBy &&
                          selectedAsset?.valuation
                              ? "text-success"
                              : "text-warning"
                        }
                        label="Valuation"
                        value="4"
                    />
                    <Tab
                        className={
                          selectedAsset?.disposalDate &&
                          selectedAsset?.disposalTo &&
                          selectedAsset?.disposalValue
                              ? "text-success"
                              : "text-warning"
                        }
                        label="Disposal"
                        value="5"
                    />
                    {selectedAsset?.patItem && (
                        <Tab
                            label="PAT Details"
                            value="6"
                            className={
                              selectedAsset?.assetPATItems?.length > 0
                                  ? "text-success"
                                  : "text-warning"
                            }
                        />
                    )}
                    {selectedAsset?.pfpItem && (
                        <Tab
                            className={
                              selectedAsset?.assetPFPItem
                                  ? "text-success"
                                  : "text-warning"
                            }
                            label="Passive Fire Protection"
                            value="7"
                        />
                    )}

                  {selectedAsset?.doorItem && (
                    <Tab
                      className={
                        selectedAsset?.assetDoorSpecifications &&
                          (selectedAsset?.assetDoorSpecifications.doorWidth ||
                            selectedAsset?.assetDoorSpecifications.doorHeight ||
                            selectedAsset?.assetDoorSpecifications.doorRef ||
                            selectedAsset?.assetDoorSpecifications.fireRating)
                          ? "text-success"
                          : "text-warning"
                      }
                      label="Door Specifications"
                      value="8"
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
                    {isLoading && (
                        <Box sx={{ display: "flex" }}>
                          <CircularProgress />
                        </Box>
                    )}
                    {!isLoading && selectedAsset?.files?.length > 0 && (
                        <button
                            className="btn btn-sm btn-danger mb-2"
                            onClick={() => {
                              untagAsset();
                            }}
                        >
                          Untag Documents
                        </button>
                    )}

                    <div className="table-responsive">
                      <table className="table f-11">
                        <thead className="table-dark">
                        <tr>
                          <th scope="col">
                            <input
                                type="checkbox"
                                onChange={(e) => {
                                  // Select or deselect all rows
                                  if (e.target.checked) {
                                    setSelectedAssetRows(
                                        selectedAsset?.files || []
                                    );
                                  } else {
                                    setSelectedAssetRows([]);
                                  }
                                }}
                                checked={
                                    selectedAsset?.files?.length > 0 &&
                                    selectedAssetRows.length ===
                                    selectedAsset?.files?.length
                                }
                            />
                          </th>
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
                              {/* Checkbox column */}
                              <td>
                                <input
                                    type="checkbox"
                                    onChange={() => handleRowSelect(file)}
                                    checked={selectedAssetRows.includes(file)}
                                />
                              </td>
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
                          <DatePicker
                              label="Purchase Date"
                              required={true}
                              value={
                                purchaseDetailForm.watch("purchaseDate")
                                    ? new Date(
                                        purchaseDetailForm.watch("purchaseDate")
                                    )
                                    : null
                              }
                              onChange={(date) => {
                                purchaseDetailForm.setValue(
                                    "purchaseDate",
                                    date ? formatDate(date) : "",
                                    {
                                      shouldValidate: true,
                                    }
                                );
                              }}
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
                              type="text"
                              autoComplete="off"
                              readOnly
                              onFocus={(e) => e.target.removeAttribute("readonly")}
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
                              min={0}
                              className="form-control"
                              id="transactionId"
                              name="transactionId"
                              placeholder=""
                              {...purchaseDetailForm.register("transactionId")}
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
                              step="0.01"
                              min={0}
                              className="form-control"
                              id="cost"
                              name="cost"
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
                          {purchaseDetailForm.formState.errors
                              ?.purchaseInvoice && (
                              <InputError
                                  message={
                                    purchaseDetailForm.formState.errors
                                        ?.purchaseInvoice?.message
                                  }
                                  key={
                                    purchaseDetailForm.formState.errors
                                        ?.purchaseInvoice?.message
                                  }
                              />
                          )}
                        </div>
                        {purchaseFrormValues.invoiceFile && (
                            <a href={purchaseFrormValues.invoiceFile} download>
                              Download Uploaded Invoice
                            </a>
                        )}
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
                  <form onSubmit={locationForm.handleSubmit(submitLocationForm)}>
                    <div className="row">
                      <div className="col-md-4">
                        <label for="position">Interior/Exterior</label>
                        <select
                            name="position"
                            className="form-control form-select"
                            id="position"
                            value={locationFormValues?.position}
                            onChange={(e) => {
                              const value = e.target.value;
                              locationForm.setValue("position", value);
                              const node = siteLayout.filter(
                                  (site) => site.nodeName === value
                              );
                              const data = siteLayout.filter(
                                  (site) =>
                                      site.nodeType === "floor" &&
                                      site.parentNode === node?.[0]?.id
                              );
                              setFloors(data || []);
                            }}
                        >
                          <option value="">Select Interior/Exterior</option>
                          {["Interior", "Exterior"].map((num) => (
                              <option value={num}>{num} </option>
                          ))}
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
                            value={locationFormValues?.floor}
                            onChange={(e) => {
                              const value = e.target.value;
                              locationForm.setValue("floor", value);
                              const node = siteLayout.filter(
                                  (site) => site.nodeName === value
                              );
                              const data = siteLayout.filter(
                                  (site) =>
                                      site.nodeType === "room" &&
                                      site.parentNode === node?.[0]?.id
                              );
                              setRooms(data || []);
                            }}
                        >
                          <option value="">Select Floor</option>
                          {floors?.map((site) => (
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
                            className="form-control form-select"
                            id="room"
                            {...locationForm.register("room", {
                              required: {
                                value: false,
                                message: `Please select room`,
                              },
                            })}
                        >
                          <option value="">Select Room</option>
                          {rooms?.map((site) => (
                              <option value={site.nodeName}>{site.nodeName}</option>
                          ))}
                        </select>
                        {locationForm.formState.errors?.room && (
                            <InputError
                                message={locationForm.formState.errors?.room?.message}
                                key={locationForm.formState.errors?.room?.message}
                            />
                        )}
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
                  <div className="mb-4 d-flex justify-content-between align-items-center">
                    <button
                        type="button"
                        className="btn btn-primary d-flex align-items-center"
                        onClick={addValuation}
                        disabled={!!selectedAsset?.disposalDate} // Disable if disposal date exists
                        title={
                          selectedAsset?.disposalDate
                              ? "Cannot add valuation after disposal"
                              : ""
                        }
                    >
                      Add Valuation
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary px-4 py-2 d-flex align-items-center"
                        onClick={() => submitValuationForm()}
                        disabled={!!selectedAsset?.disposalDate} // Disable if disposal date exists
                        title={
                          selectedAsset?.disposalDate
                              ? "Cannot save valuations after disposal"
                              : ""
                        }
                    >
                      Save Valuations
                    </button>
                  </div>

                  <div className="table-responsive row">
                    <table className="table mb-4">
                      <thead className="table-dark">
                      <tr>
                        <th
                            scope="col"
                            className="py-3 px-4 fw-semibold"
                            style={{
                              width: "25%",
                              borderLeft: "1px solid #dee2e6",
                            }}
                        >
                          <div className="d-flex align-items-center justify-content-between">
                            Valuation Date
                            <i className="bi bi-arrow-down-up text-muted fs-small"></i>
                          </div>
                        </th>
                        <th
                            scope="col"
                            className="py-3 px-4 fw-semibold"
                            style={{ width: "25%" }}
                        >
                          <div className="d-flex align-items-center justify-content-between">
                            Valuation
                            <i className="bi bi-arrow-down-up text-muted fs-small"></i>
                          </div>
                        </th>
                        <th
                            scope="col"
                            className="py-3 px-4 fw-semibold"
                            style={{ width: "25%" }}
                        >
                          <div className="d-flex align-items-center justify-content-between">
                            Valuation Done By
                            <i className="bi bi-arrow-down-up text-muted fs-small"></i>
                          </div>
                        </th>
                        <th
                            scope="col"
                            className="py-3 px-4 fw-semibold text-end"
                            style={{
                              width: "25%",
                              borderRight: "1px solid #dee2e6",
                            }}
                        >
                          Actions
                        </th>
                      </tr>
                      </thead>
                      <tbody className="border-top-0">
                      {valuations
                          .filter((v) => !v.delete) // Only show non-deleted valuations
                          .map((valuation) => (
                              <ValuationComponent
                                  key={valuation.tempId || valuation.id}
                                  valuation={valuation}
                                  users={users}
                                  onRemove={() =>
                                      handleRemoveValuation(
                                          valuation.tempId || valuation.id
                                      )
                                  }
                                  onUpdate={(uv) =>
                                      updateValuation(
                                          valuation.tempId || valuation.id,
                                          uv
                                      )
                                  }
                                  isRemovable={
                                      valuations.filter((v) => !v.delete).length > 0
                                  }
                                  readOnly={!!selectedAsset?.disposalDate}
                                  disabled={!!selectedAsset?.disposalDate}
                                  hasDisposalDate={!!selectedAsset?.disposalDate}
                              />
                          ))}
                      {valuations.filter((v) => !v.delete).length === 0 && (
                          <tr>
                            <td
                                colSpan="4"
                                className="text-center py-4 text-muted"
                            >
                              <i className="bi bi-info-circle me-2"></i>
                              No valuation records found. Click "Add Valuation" to
                              create one.
                            </td>
                          </tr>
                      )}
                      </tbody>
                    </table>
                  </div>
                </TabPanel>

                <TabPanel value="5">
                  <form onSubmit={disposalForm.handleSubmit(submitDisposalForm)}>
                    <div className="row">
                      <div className="col-md-4">
                        <div className="form-group mt-2">
                          <DatePicker
                              label="Disposal Date"
                              value={
                                disposalForm.watch("disposalDate")
                                    ? new Date(disposalForm.watch("disposalDate"))
                                    : null
                              }
                              onChange={(date) => {
                                disposalForm.setValue(
                                    "disposalDate",
                                    date ? formatDate(date) : "",
                                    {
                                      shouldValidate: true,
                                    }
                                );
                              }}
                          />
                          {disposalForm.formState.errors?.disposalDate && (
                              <InputError
                                  message={
                                    disposalForm.formState.errors?.disposalDate
                                        ?.message
                                  }
                              />
                          )}
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group mt-2">
                          <label htmlFor="disposalValue">Disposal Value</label>
                          <input
                              type="number"
                              step="0.01"
                              min={0}
                              className="form-control"
                              id="disposalValue"
                              name="disposalValue"
                              placeholder=""
                              {...disposalForm.register("disposalValue")}
                          />
                          {disposalForm.formState.errors?.disposalValue && (
                              <InputError
                                  message={
                                    disposalForm.formState.errors?.disposalValue
                                        ?.message
                                  }
                              />
                          )}
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group mt-2">
                          <label htmlFor="disposalTo">Disposal To</label>
                          <input
                              type="text"
                              autoComplete="off"
                              readOnly
                              onFocus={(e) => e.target.removeAttribute("readonly")}
                              className="form-control"
                              id="disposalTo"
                              name="disposalTo"
                              placeholder=""
                              {...disposalForm.register("disposalTo")}
                          />
                          {disposalForm.formState.errors?.disposalTo && (
                              <InputError
                                  message={
                                    disposalForm.formState.errors?.disposalTo?.message
                                  }
                              />
                          )}
                        </div>
                      </div>
                      <div>
                        <button type="submit" className="btn btn-primary mt-2">
                          Save
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary mt-2 ms-2"
                            onClick={() => {
                              disposalForm.reset({
                                disposalDate: "",
                                disposalTo: "",
                                disposalValue: "",
                              });
                              disposalForm.clearErrors();
                            }}
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  </form>
                </TabPanel>
                <TabPanel value="6">
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
                          <thead className="table-dark">
                          <tr>
                            <th scope="col">Tester</th>
                            <th scope="col">Test Date</th>
                            <th scope="col">Next Test Date</th>
                            <th scope="col">Status</th>
                            <th scope="col">Action</th>
                          </tr>
                          </thead>
                          <tbody>
                          {patRecord?.length === 0 && (
                              <tr>
                                <td colSpan={5}>No PAT Record Found.</td>
                              </tr>
                          )}
                          {patRecord?.map((itm, index) => (
                              <tr key={index}>
                                <td>
                                  {itm?.isEditing ? (
                                      <Autocomplete
                                          id="stakeholder"
                                          onChange={(event, item) => {
                                            handleInputpATChange(
                                                index,
                                                "patUserId",
                                                item?.key
                                            );
                                          }}
                                          options={tester.map((option) => {
                                            return {
                                              key: option.id,
                                              label:
                                                  option.role +
                                                  " - " +
                                                  option.name +
                                                  " (" +
                                                  option.email +
                                                  ")" +
                                                  (option.companyName
                                                      ? " - " + option.companyName
                                                      : ""),
                                            };
                                          })}
                                          getOptionLabel={(option) => option.label}
                                          renderInput={(params) => (
                                              <div ref={params.InputProps.ref}>
                                                <input
                                                    type="text"
                                                    autoComplete="off"
                                                    readOnly
                                                    onFocus={(e) =>
                                                        e.target.removeAttribute("readonly")
                                                    }
                                                    {...params.inputProps}
                                                    required
                                                    className="form-control"
                                                    placeholder="Select User"
                                                />
                                              </div>
                                          )}
                                      />
                                  ) : (
                                      getTesterName(itm?.patUserId)
                                  )}
                                </td>
                                <td>
                                  {itm?.isEditing ? (
                                      <input
                                          type="date"
                                          className="form-control"
                                          value={itm?.patDate || ""}
                                          onChange={(e) =>
                                              handleInputpATChange(
                                                  index,
                                                  "patDate",
                                                  e.target.value
                                              )
                                          }
                                      />
                                  ) : (
                                      moment(itm?.patDate).format("DD-MM-YYYY")
                                  )}
                                </td>
                                <td>
                                  {itm?.isEditing ? (
                                      <input
                                          type="date"
                                          className="form-control"
                                          value={itm?.patNextDate || ""}
                                          onChange={(e) =>
                                              handleInputpATChange(
                                                  index,
                                                  "patNextDate",
                                                  e.target.value
                                              )
                                          }
                                      />
                                  ) : (
                                      moment(itm?.patNextDate).format("DD-MM-YYYY")
                                  )}
                                </td>
                                <td>
                                  <i
                                      className={`fas fa-thumbs-up cursor ${
                                          itm.patStatus === "Pass"
                                              ? "text-success"
                                              : "text-dark"
                                      }`}
                                      onClick={() => updatePatStatus(index, "Pass")}
                                  ></i>
                                  &nbsp;
                                  <i
                                      className={`fas fa-thumbs-down cursor ${
                                          itm.patStatus === "Fail"
                                              ? "text-danger"
                                              : "text-dark"
                                      }`}
                                      onClick={() => updatePatStatus(index, "Fail")}
                                  ></i>
                                </td>
                                <td>
                                  {itm?.isEditing ? (
                                      <button
                                          className="btn btn-success"
                                          onClick={() => toggleEditMode(index)}
                                      >
                                        Save
                                      </button>
                                  ) : (
                                      <button
                                          className="btn btn-secondary"
                                          onClick={() => toggleEditMode(index)}
                                      >
                                        Edit
                                      </button>
                                  )}
                                  &nbsp;
                                  <i
                                      className="fas fa-trash cursor text-danger"
                                      onClick={() => deletePatRecord(index, itm)}
                                  ></i>
                                </td>
                              </tr>
                          ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div>
                      <button
                          type="button"
                          className="btn btn-primary mt-2"
                          onClick={() => {
                            savePatDetails();
                          }}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </TabPanel>
                <TabPanel value="7">
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
                              autoComplete="off"
                              readOnly
                              onFocus={(e) => e.target.removeAttribute("readonly")}
                              className="form-control"
                              id="product"
                              name="product"
                              placeholder=""
                              {...passiveFireProtectionForm.register("product", {
                                required: {
                                  value: true,
                                  message: `Please enter product name`,
                                },
                              })}
                          />
                          {passiveFireProtectionForm.formState.errors
                              ?.product && (
                              <InputError
                                  message={
                                    passiveFireProtectionForm.formState.errors
                                        ?.product?.message
                                  }
                                  key={
                                    passiveFireProtectionForm.formState.errors
                                        ?.product?.message
                                  }
                              />
                          )}
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group mt-2">
                          <label for="access">Access/Position</label>
                          <input
                              type="text"
                              autoComplete="off"
                              readOnly
                              onFocus={(e) => e.target.removeAttribute("readonly")}
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
                                <option value={itm?.lovValue}>
                                  {itm?.lovValue}
                                </option>
                            ))}
                          </select>
                          {passiveFireProtectionForm.formState.errors
                              ?.material && (
                              <InputError
                                  message={
                                    passiveFireProtectionForm.formState.errors
                                        ?.material?.message
                                  }
                                  key={
                                    passiveFireProtectionForm.formState.errors
                                        ?.material?.message
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
                              autoComplete="off"
                              readOnly
                              onFocus={(e) => e.target.removeAttribute("readonly")}
                              className="form-control"
                              id="service"
                              name="service"
                              placeholder=""
                              {...passiveFireProtectionForm.register("service", {
                                required: {
                                  value: true,
                                  message: `Please enter service`,
                                },
                              })}
                          />
                          {passiveFireProtectionForm.formState.errors
                              ?.service && (
                              <InputError
                                  message={
                                    passiveFireProtectionForm.formState.errors
                                        ?.service?.message
                                  }
                                  key={
                                    passiveFireProtectionForm.formState.errors
                                        ?.service?.message
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
                              autoComplete="off"
                              readOnly
                              onFocus={(e) => e.target.removeAttribute("readonly")}
                              className="form-control"
                              id="dimension"
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
                              autoComplete="off"
                              readOnly
                              onFocus={(e) => e.target.removeAttribute("readonly")}
                              className="form-control"
                              id="quantity"
                              name="quantity"
                              placeholder=""
                              {...passiveFireProtectionForm.register("quantity", {
                                required: {
                                  value: true,
                                  message: `Please enter quantity`,
                                },
                              })}
                          />
                          {passiveFireProtectionForm.formState.errors
                              ?.quantity && (
                              <InputError
                                  message={
                                    passiveFireProtectionForm.formState.errors
                                        ?.quantity?.message
                                  }
                                  key={
                                    passiveFireProtectionForm.formState.errors
                                        ?.quantity?.message
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
                              autoComplete="off"
                              readOnly
                              onFocus={(e) => e.target.removeAttribute("readonly")}
                              className="form-control"
                              id="area"
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
                      <div>
                        <button type="submit" className="btn btn-primary mt-2">
                          Save
                        </button>
                      </div>
                    </div>
                  </form>
                </TabPanel>
              <TabPanel value="8">
                <form
                  onSubmit={doorSpecificationForm.handleSubmit(
                    submitDoorSpecificationForm
                  )}
                >
                  <div className="row">
                    {/* Basic Door Dimensions */}
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label htmlFor="doorWidth">Door Width (mm)</label>
                        <input
                          type="text"
                          autoComplete="off"
                          readOnly
                          onFocus={(e) => e.target.removeAttribute("readonly")}
                          className="form-control"
                          id="doorWidth"
                          name="doorWidth"
                          placeholder=""
                          {...doorSpecificationForm.register("doorWidth")}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label htmlFor="doorHeight">Door Height (mm)</label>
                        <input
                          type="text"
                          autoComplete="off"
                          readOnly
                          onFocus={(e) => e.target.removeAttribute("readonly")}
                          className="form-control"
                          id="doorHeight"
                          name="doorHeight"
                          placeholder=""
                          {...doorSpecificationForm.register("doorHeight")}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label htmlFor="doorDepth">Door Depth (mm)</label>
                        <input
                          type="text"
                          autoComplete="off"
                          readOnly
                          onFocus={(e) => e.target.removeAttribute("readonly")}
                          className="form-control"
                          id="doorDepth"
                          name="doorDepth"
                          placeholder=""
                          {...doorSpecificationForm.register("doorDepth")}
                        />
                      </div>
                    </div>

                    {/* Door Reference and Size */}
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label htmlFor="doorRef">Door Reference</label>
                        <input
                          type="text"
                          autoComplete="off"
                          readOnly
                          onFocus={(e) => e.target.removeAttribute("readonly")}
                          className="form-control"
                          id="doorRef"
                          name="doorRef"
                          placeholder=""
                          {...doorSpecificationForm.register("doorRef")}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label htmlFor="doorSize">Door Size</label>
                        <input
                          type="text"
                          autoComplete="off"
                          readOnly
                          onFocus={(e) => e.target.removeAttribute("readonly")}
                          className="form-control"
                          id="doorSize"
                          name="doorSize"
                          placeholder=""
                          {...doorSpecificationForm.register("doorSize")}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label htmlFor="coreDurability">Core Durability</label>
                        <select
                          className="form-control form-select"
                          id="coreDurability"
                          name="coreDurability"
                          {...doorSpecificationForm.register("coreDurability")}
                        >
                          <option value="">Please Select Core Durability</option>
                          <option value="Specialist">Specialist</option>
                          <option value="Sever duty">Sever duty</option>
                        </select>
                      </div>
                    </div>
                    {/* Ratings */}
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label htmlFor="fireRating">Fire Rating</label>
                        <select
                          className="form-control form-select"
                          id="fireRating"
                          name="fireRating"
                          {...doorSpecificationForm.register("fireRating")}
                        >
                          <option value="">Please Select Fire Rating</option>
                          <option value="None">None</option>
                          <option value="FD30">FD30</option>
                          <option value="FD60">FD60</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label htmlFor="dbRating">DB Rating</label>
                        <input
                          type="text"
                          autoComplete="off"
                          readOnly
                          onFocus={(e) => e.target.removeAttribute("readonly")}
                          className="form-control"
                          id="dbRating"
                          name="dbRating"
                          placeholder=""
                          {...doorSpecificationForm.register("dbRating")}
                        />
                      </div>
                    </div>

                    {/* Door Facing and Finish */}
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label htmlFor="doorFacing">Door Facing</label>
                        <input
                          type="text"
                          autoComplete="off"
                          readOnly
                          onFocus={(e) => e.target.removeAttribute("readonly")}
                          className="form-control"
                          id="doorFacing"
                          name="doorFacing"
                          placeholder=""
                          {...doorSpecificationForm.register("doorFacing")}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label htmlFor="doorFinish">Door Finish</label>
                        <select
                          className="form-control form-select"
                          id="doorFinish"
                          name="doorFinish"
                          {...doorSpecificationForm.register("doorFinish")}
                        >
                          <option value="">Please Select</option>
                          <option value="Primed">Primed</option>
                          <option value="Lacquered">
                            Lacquered
                          </option>
                          <option value="Oak">
                            Oak
                          </option>
                          <option value="Powder Coating">
                            Powder Coating
                          </option>
                          <option value="Veneered">
                            Veneered
                          </option>
                          <option value="Wallnut">
                            Wallnut
                          </option>
                          <option value="Mahogony">Mahogony</option>
                          <option value="Beach">Beach</option>
                          <option value="Papered">Papered</option>
                        </select>
                      </div>
                    </div>


                    {/* Vision Panel and Glazing */}
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label htmlFor="visionPanel">Vision Panel</label>
                        <select
                          className="form-control form-select"
                          id="visionPanel"
                          name="visionPanel"
                          {...doorSpecificationForm.register("visionPanel")}
                        >
                          <option value="">Please Select</option>
                          <option value="None">None</option>
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label htmlFor="glazingSize">Glazing Size</label>
                        <input
                          type="text"
                          autoComplete="off"
                          readOnly
                          onFocus={(e) => e.target.removeAttribute("readonly")}
                          className="form-control"
                          id="glazingSize"
                          name="glazingSize"
                          placeholder=""
                          {...doorSpecificationForm.register("glazingSize")}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label htmlFor="glassType">Glass Type</label>
                        <input
                          type="text"
                          autoComplete="off"
                          readOnly
                          onFocus={(e) => e.target.removeAttribute("readonly")}
                          className="form-control"
                          id="glassType"
                          name="glassType"
                          placeholder=""
                          {...doorSpecificationForm.register("glassType")}
                        />
                      </div>
                    </div>

                    {/* Cut Outs */}
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label htmlFor="flushBoltCutOut">Flush Bolt Cut Out</label>
                        <select
                          className="form-control form-select"
                          id="flushBoltCutOut"
                          name="flushBoltCutOut"
                          {...doorSpecificationForm.register("flushBoltCutOut")}
                        >
                          <option value="">Please Select</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label htmlFor="lockCutOut">Lock Cut Out</label>
                        <select
                          className="form-control form-select"
                          id="lockCutOut"
                          name="lockCutOut"
                          {...doorSpecificationForm.register("lockCutOut")}
                        >
                          <option value="">Please Select</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label htmlFor="rebatedMS">Rebated M/S</label>
                        <select
                          className="form-control form-select"
                          id="rebatedMS"
                          name="rebatedMS"
                          {...doorSpecificationForm.register("rebatedMS")}
                        >
                          <option value="">Please Select</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                    </div>

                    {/* Additional Cut Outs */}
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label htmlFor="cDCCutOut">C.D.C Cut Out</label>
                        <select
                          className="form-control form-select"
                          id="cDCCutOut"
                          name="cDCCutOut"
                          {...doorSpecificationForm.register("cDCCutOut")}
                        >
                          <option value="">Please Select</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label htmlFor="hingeCutOut">Hinge Cut Out</label>
                        <select
                          className="form-control form-select"
                          id="hingeCutOut"
                          name="hingeCutOut"
                          {...doorSpecificationForm.register("hingeCutOut")}
                        >
                          <option value="">Please Select</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label htmlFor="hinges">Hinges</label>
                        <select
                          className="form-control form-select"
                          id="hinges"
                          name="hinges"
                          {...doorSpecificationForm.register("hinges")}
                        >
                          <option value="">Please Select</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                    </div>

                    {/* Frame Details */}
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label htmlFor="frameSection">Frame Section</label>
                        <select
                          className="form-control form-select"
                          id="frameSection"
                          name="frameSection"
                          {...doorSpecificationForm.register("frameSection")}
                        >
                          <option value="">Please Select</option>
                          <option value="120 x 32">120 x 32 mm</option>
                          <option value="120 x 32/38">120 x 32/38 mm</option>
                          <option value="85 x 38">85 x 38 mm</option>
                          <option value="150 x 38">150 x 38 mm</option>
                          <option value="130 x 38">130 x 38 mm</option>
                          <option value="110 x 38">110 x 38 mm</option>
                          <option value="115 x 44">115 x 44 mm</option>
                          <option value="115 x 32">115 x 32 mm</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label htmlFor="stopSize">Stop Size</label>
                        <select
                          className="form-control form-select"
                          id="stopSize"
                          name="stopSize"
                          {...doorSpecificationForm.register("stopSize")}
                        >
                          <option value="">Please Select</option>
                          <option value="44 x 19">44 x 19 mm</option>
                          <option value="D/S">D/S</option>
                          <option value="32 x 12">32 x 12 mm</option>
                          <option value="44 x 25">44 x 25 mm</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label htmlFor="fourSided">Four Sided</label>
                        <select
                          className="form-control form-select"
                          id="fourSided"
                          name="fourSided"
                          {...doorSpecificationForm.register("fourSided")}
                        >
                          <option value="">Please Select</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                    </div>

                    {/* Additional Features */}
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label htmlFor="fanLight">Fan Light</label>
                        <select
                          className="form-control form-select"
                          id="fanLight"
                          name="fanLight"
                          {...doorSpecificationForm.register("fanLight")}
                        >
                          <option value="">Please Select</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label htmlFor="screen">Screen</label>
                        <select
                          className="form-control form-select"
                          id="screen"
                          name="screen"
                          {...doorSpecificationForm.register("screen")}
                        >
                          <option value="">Please Select</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label htmlFor="architraves">Architraves</label>
                        <select
                          className="form-control form-select"
                          id="architraves"
                          name="architraves"
                          {...doorSpecificationForm.register("architraves")}
                        >
                          <option value="">Please Select</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                    </div>

                    {/* Frame Material and Finish */}
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label htmlFor="frameMaterial">Frame Material</label>
                        <select
                          className="form-control form-select"
                          id="hinges"
                          name="hinges"
                          {...doorSpecificationForm.register("hinges")}
                        >
                          <option value="">Please Select</option>
                          <option value="Redwood">Redwood</option>
                          <option value="HardWood">HardWood</option>
                          <option value="Aliminium">Aliminium</option>
                          <option value="Unknown">Unknown</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label htmlFor="frameFinish">Frame Finish</label>
                        <select
                          className="form-control form-select"
                          id="frameFinish"
                          name="frameFinish"
                          {...doorSpecificationForm.register("frameFinish")}
                        >
                          <option value="">Please Select</option>
                          <option value="No">No</option>
                          <option value="Primmed">Primed</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group mt-2">
                        <label htmlFor="ScreenFanLightMaterial">Screen/Fan Light Material</label>
                        <select
                          className="form-control form-select"
                          id="ScreenFanLightMaterial"
                          name="ScreenFanLightMaterial"
                          {...doorSpecificationForm.register("ScreenFanLightMaterial")}
                        >
                          <option value="">Please Select</option>
                          <option value="None">None</option>
                          <option value="RedWood">Redwood</option>
                          <option value="HardWood">Hardwood</option>
                        </select>
                      </div>
                    </div>


                    <div className="col-12">
                      <button type="submit" className="btn btn-primary mt-2">
                        Save Door Specifications
                      </button>
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
