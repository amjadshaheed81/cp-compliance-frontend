import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import { CSVLink } from "react-csv";
import Tooltip from "@mui/material/Tooltip";
import { QRCodeSVG } from "qrcode.react";
import {
  deleteSiteAsset,
  getSiteLayout,
  getSitePATAssets,
} from "../../../../store/thunk/site";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { get, put } from "../../../../api";
import ShowQRCode from "./ShowQRCode";
import ShowCloneModal from "./ShowCloneModal";
import Pagination from "../../../common/Pagination/Pagination";
import { printMultipleSelectedAsset } from "../../../../utils/export-qr-code";
import { getCategoryLabelValue } from "../../../../utils/getCategoryLabelValue";
import { getPatTestedEndDate, getPatTestedStartDate } from "../../../../utils/getPatTestedDate";
import { calculateLastPageIndex } from "../../../../utils/calculateSearchedPageNumber";
import AddPatDetails from "./AddPatDetails";
import { useLocation } from "react-router-dom";
import moment from "moment";
import Papa from "papaparse";
import MultiEditModal from './MultiEdit';


export const findAssetWithNearestPatNextDate = (asset) => {
  let nearestAsset = null;
  let nearestPatItem = null;
  let nearestDate = null;
  if (asset.assetPATItems) {
    asset.assetPATItems.forEach(patItem => {
      const patNextDate = new Date(patItem.patNextDate);
      
      // Check if it's the first date or closer than the previous nearestDate
      if (!nearestDate || patNextDate < nearestDate) {
        nearestDate = patNextDate;
        nearestPatItem = patItem;
        nearestAsset = asset;
      }
    });
  }

  return nearestAsset && nearestPatItem ? { asset: nearestAsset, patItem: nearestPatItem } : null;
};


const Pat = ({
  sitePATItems,
  deleteSiteAsset,
  siteSelectedForGlobal,
  getSitePATAssets,
  getSiteLayout,
  siteLayout,
}) => {
  const [filteredSitePATItems, setFilteredSitePATItems] = useState([]);
  const [siteAssetsList, setSiteAssetsList] = useState([]);
  const [category, setCategory] = useState([]);
  const [subCategory, setSubCategory] = useState([]);
  const [subCategory2, setSubCategory2] = useState([]);
  const [subCategory3, setSubCategory3] = useState([]);
  const [subCategoryList, setSubCategoryList] = useState([]);
  const [subCategory2List, setSubCategory2List] = useState([]);
  const [subCategory3List, setSubCategory3List] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState({});
  const [selectedAssetForClone, setSelectedAssetForClone] = useState({});
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [showPatModal, setShowPatModal] = useState(false);
  const [preActionsPerPage] = useState(7);
  const [currentPage, setCurrentPage] = useState(1);
  const [floorNode, setFloorNode] = useState([]);
  const [roomNode, setRoomNode] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showMultiEditModal, setShowMultiEditModal] = useState(false);

  const location = useLocation();

  const indexOfLastPreAction = currentPage * preActionsPerPage;
  const indexOfFirstPreAction = indexOfLastPreAction - preActionsPerPage;
  const currentSiteAssets = filteredSitePATItems?.slice(
    indexOfFirstPreAction,
    indexOfLastPreAction
  );
  const locationFilter = siteAssetsList?.map((itm) => {
      return { location: itm.location };
    })
    .filter(
      (obj1, i, arr) =>
        arr.findIndex((obj2) => obj2.location === obj1.location) === i
    );
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };
  useEffect(() => {
    if (sitePATItems) {
      const formattedPATItems = sitePATItems.map((itm) => ({
        ...itm,
        location: `${itm?.position || "NA"} > ${itm?.floor || "NA"} > ${itm?.room || "NA"}`,
      }));
  
      // Use Promise.all to ensure both state updates before calling searchAssets
      Promise.all([
        setFilteredSitePATItems(formattedPATItems),
        setSiteAssetsList(formattedPATItems),
      ]).then(() => {
        searchAssets(); // Trigger search after both states are updated
      });
    }
  }, [sitePATItems]);
  
  const navigate = useNavigate();
  const goTo = (link) => {
    navigate(link);
  };
  const [formData, setFormData] = useState({
    assetName: "",
    manufacturer: "",
    category: "",
    subCategory: "",
    subCategory2: "",
    subCategory3: "",
    location: "",
    floor: "",
    room: "",
  });
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (name === "category") {
      console.log("category");
      const subCategoryData = subCategory?.filter(
        (itm) => itm?.attribite1 === value
      );
      setSubCategoryList(subCategoryData);
      setSubCategory2List([]);
      setSubCategory3List([]);
    }else if (name === "subCategory") {
      const subCategoryData = subCategory2?.filter(
        (itm) => itm?.attribite1 === value
      );
      setSubCategory2List(subCategoryData);
      setSubCategory3List([]);
    }else if (name === "subCategory2") {
      const subCategoryData = subCategory3?.filter(
        (itm) => itm?.attribite1 === value
      );
      setSubCategory3List(subCategoryData);
    }
  };
  useEffect(() => {
    searchAssets();
  }, [
    formData.assetName,
    formData.category,
    formData.subCategory,
    formData.subCategory2,
    formData.subCategory3,
    formData.location,
    formData.manufacturer,
    formData.floor,
    formData.room,
  ]);
  const searchAssets = () => {
    const assetName = formData?.assetName;
    const category = formData?.category;
    const subCategory = formData?.subCategory;
    const subCategory2 = formData?.subCategory2;
    const subCategory3 = formData?.subCategory3;
    const location = formData?.location;
    const manufacturer = formData?.manufacturer;
    const floor = formData?.floor;
    const room = formData?.room;
    if (assetName || category || subCategory || subCategory2 || subCategory3 || location || manufacturer || floor || room) {
      const list = siteAssetsList?.filter(
        (x) =>
          String(x?.assetName)
            .toLowerCase()
            .includes(String(assetName).toLowerCase()) &&
          String(x?.category)
            .toLowerCase()
            .includes(String(category).toLowerCase()) &&
          String(x?.subCategory)
            .toLowerCase()
            .includes(String(subCategory).toLowerCase()) &&
          String(x?.subCategory2)
            .toLowerCase()
            .includes(String(subCategory2).toLowerCase()) &&
          String(x?.subCategory3)
            .toLowerCase()
            .includes(String(subCategory3).toLowerCase()) &&
          String(x?.position)
            .toLowerCase()
            .includes(String(location).toLowerCase()) &&
          String(x?.manufacturer)
            .toLowerCase()
            .includes(String(manufacturer).toLowerCase()) &&
            String(x?.floor)
              .toLowerCase()
              .includes(String(floor).toLowerCase()) &&
            String(x?.room)
              .toLowerCase()
              .includes(String(room).toLowerCase())
      );
      setCurrentPage(1); //calculateLastPageIndex(list?.length, preActionsPerPage)
      setFilteredSitePATItems(list);
    } else {
      setFilteredSitePATItems(siteAssetsList);
    }
  };
  useEffect(() => {
    getSitePATAssets(siteSelectedForGlobal?.siteId);
    getCategory();
    getSiteLayout(siteSelectedForGlobal?.siteId)
  }, [siteSelectedForGlobal]);
  const getCategory = async () => {
    const categoryList = await get("/api/lov/ASSET_CATEGORY");
    const subCategoryList = await get("/api/lov/ASSET_SUB_CATEGORY");
    const subCategory2List = await get("/api/lov/ASSET_SUB_CATEGORY_2");
    const subCategory3List = await get("/api/lov/ASSET_SUB_CATEGORY_3");
    setCategory(categoryList);
    setSubCategory(subCategoryList);
    setSubCategory2(subCategory2List);
    setSubCategory3(subCategory3List);
    setSubCategoryList(subCategoryList);
    setSubCategory2List(subCategory2List);
    setSubCategory3List(subCategory3List);
  };
  useEffect(() => {
    const floorNodes =
      siteLayout?.filter((itm) => itm?.nodeType === "floor") || [];
    const roomNodes =
      siteLayout?.filter((itm) => itm?.nodeType === "room") || [];
    setFloorNode(floorNodes);
    setRoomNode(roomNodes);
    // Check if there is a label parameter in the URL
    const queryParams = new URLSearchParams(location.search);
    const label = queryParams.get("roomLabel");

    if (label) {
      const roomNumber = label; // Extract the part after '-'
      const matchedRoom = roomNodes.find((room) => room.nodeName?.split(" ")[1] === roomNumber);
      if (matchedRoom) {
        setFormData((prevFormData) => ({
          ...prevFormData,
          room: matchedRoom?.nodeName,
        }));
      }
    }
  }, [siteLayout, location.search]);


  const handleSaveMultiEdit = async () => {
    try {
      setIsLoading(true);

      const updatePayload = {
        assets: selectedItems.map((item) => ({
          assetId: item.assetId,
          assetName: item.assetName,
          manufacturer: item.manufacturer,
          category: item.category,
          subCategory: item.subCategory,
          subCategory2: item.subCategory2,
          subCategory3: item.subCategory3,
          position: item.position,
          floor: item.floor,
          room: item.room,
          powerOutput: item.powerOutput,
          // Include PAT specific fields if needed
          assetPATItems: item.assetPATItems
        })),
      };

      const response = await put(
          `/api/site/${siteSelectedForGlobal?.siteId}/assets/mutiples`,
          updatePayload,
          { headers: { "Content-Type": "application/json" } }
      );

      if (response.status === 200 || response.status === 201) {
        toast.success(`Successfully updated ${selectedItems.length} assets`);
        getSitePATAssets(siteSelectedForGlobal?.siteId); // Changed from getSiteDoorAssets
        setSelectedItems([]);
        setShowMultiEditModal(false);
      } else {
        throw new Error("Failed to update assets");
      }
    } catch (error) {
      console.error("Asset update error:", error);
      toast.error(`Error updating assets: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAsset = (itm) => {
    Swal.fire({
      title: `Do you want to delete ${itm?.assetName}`,
      showDenyButton: false,
      showCancelButton: true,
      confirmButtonText: "Delete",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const res = await deleteSiteAsset(itm?.assetId);
        if (res === "Success") {
          toast.success(
            `${itm?.assetName} site asset has been deleted successully`
          );
          getSitePATAssets(siteSelectedForGlobal?.siteId);
        } else {
          toast.error(
            "Something went wrong while deleting site asset. Please try again!"
          );
        }
      } else if (result.isDenied) {
        // Swal.fire("Changes are not saved", "", "info");
      }
    });
  };
  const cloneSelectedAsset = () => {
    if (selectedItems?.length === 0) {
      toast.warn("Please select asset to clone.");
    } else if (selectedItems?.length > 1) {
      toast.warn("Please select only one asset.");
    } else {
      setSelectedAssetForClone(selectedItems[0]);
      setShowCloneModal(true);
    }
  };
  const handleCheckboxChange = (e, asset) => {
    const { checked } = e.target;
    if (checked) {
      setSelectedItems([...selectedItems, asset]);
    } else {
      setSelectedItems(
        selectedItems.filter((item) => item.assetId !== asset.assetId)
      );
    }
  };

  const handleSelectAllChange = (e) => {
    const { checked } = e.target;
    if (checked) {
      setSelectedItems(filteredSitePATItems);
    } else {
      setSelectedItems([]);
    }
  };
  const handleFileUpload = async (e) => {
      const file = e.target.files[0];
      if (file) {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: async (results) => {
            const assets = results.data
              .map((row) => {
                const assetId = parseInt(row.assetId);
    
                if (isNaN(assetId) || assetId === null) {
                  return null;
                }
    
                return {
                  assetId: assetId,
                  assetName: row.assetName,
                  manufacturer: row.manufacturer,
                  category: row.category,
                  subCategory: row.subCategory,
                  subCategory2: row.subCategory2 || null,
                  subCategory3: row.subCategory3 || null,
                  model: row.model,
                  deviceId: row.deviceId || null,
                  serialNumber: row.serialNumber || "",
                  relatedAssetId: row.relatedAssetId || "",
                  folderId: row.folderId ? parseInt(row.folderId) : null,
                  patItem: row.patItem?.toLowerCase() === "true",
                  pfpItem: row.pfpItem?.toLowerCase() === "true",
                  doorItem: row.doorItem?.toLowerCase() === "true",
                  barcode: row.barcode || "",
                };
              })
              .filter((asset) => asset !== null);
    
            if (assets.length === 0) {
              toast.error("No valid assets found in the file.");
              return;
            }
    
            try {
              const response = await put("/api/site/296/assets/mutiples", { assets });
    
              if (response.status === 200 || response.status === 201) {
                toast.success("Assets updated successfully!");
                setIsLoading(true);
                await getSitePATAssets(siteSelectedForGlobal?.siteId);
                setTimeout(() => {
                  setIsLoading(false);
                }, 3000);
              } else {
                toast.error("Failed to update assets. Please try again.");
              }
            } catch (error) {
              toast.error("An error occurred while updating assets.");
            }
          },
          error: (error) => {
            toast.error("Error parsing CSV file. Please check the file format.");
            console.error("CSV Parsing Error:", error);
          },
        });
      }
    };
  return (
    <Fragment>
      {showAddModal && (
        <ShowQRCode
          showAddModal={showAddModal}
          setShowAddModal={setShowAddModal}
          selectedAsset={selectedAsset}
        />
      )}
      {showPatModal && (
        <AddPatDetails
          showPatModal={showPatModal}
          setShowPatModal={setShowPatModal}
          selectedAsset={selectedItems}
          refresh={() => {
            getSitePATAssets(siteSelectedForGlobal?.siteId);
          }}
        />
      )}
      {showCloneModal && (
        <ShowCloneModal
          showCloneModal={showCloneModal}
          setShowCloneModal={setShowCloneModal}
          selectedAsset={selectedAssetForClone}
          refresh={() => {
            getSitePATAssets(siteSelectedForGlobal?.siteId);
          }}
        />
      )}
      {showMultiEditModal && (

          <MultiEditModal
              showModal={showMultiEditModal}
              setShowModal={setShowMultiEditModal}
              selectedItems={selectedItems}
              setSelectedItems={setSelectedItems}
              categoryOptions={category}
              subCategoryOptions={subCategory}
              subCategory2Options={subCategory2}
              subCategory3Options={subCategory3}
              floorOptions={floorNode}
              roomOptions={roomNode}
              onSave={handleSaveMultiEdit}
              isLoading={isLoading}
              title="Edit Multiple PAT Assets"
          />
      )}
      <div className="d-flex bd-highlight">
        <div className="pt-2 bd-highlight ">
          <div className="row" style={{ height: "auto" }}>
            <div className="col-md-3 col-sm-4 mt-2">
              <input
                type="text"
                autoComplete="off"
                readOnly
                onFocus={(e) => e.target.removeAttribute("readonly")}
                name="assetName"
                className="form-control"
                placeholder="Asset Name"
                onChange={handleInputChange}
              />
            </div>
            <div className="col-md-3 col-sm-4 mt-2">
              <input
                type="text"
                autoComplete="off"
                readOnly
                onFocus={(e) => e.target.removeAttribute("readonly")}
                name="manufacturer"
                className="form-control"
                placeholder="Manufacturer"
                onChange={handleInputChange}
              />
            </div>
            <div className="col-md-3 col-sm-4 mt-2">
              <select
                name="category"
                className="form-control form-select"
                id="category"
                onChange={handleInputChange}
              >
                <option value="">Category</option>
                {category?.map((itm) => (
                  <option value={itm?.lovValue}>{itm?.lovValue}</option>
                ))}
              </select>
            </div>
            <div
              className="col-md-3 col-sm-4 mt-2"
              style={{ display: formData.category ? "" : "none" }}
            >
              <select
                name="subCategory"
                className="form-control form-select"
                id="subCategory"
                onChange={handleInputChange}
              >
                <option value="">Sub Category</option>
                {subCategoryList?.map((itm) => (
                  <option value={itm?.lovValue}>{itm?.lovValue}</option>
                ))}
              </select>
            </div>
            <div
              className="col-md-3 col-sm-4 mt-2"
              style={{ display: formData.subCategory ? "" : "none" }}
            >
              <select
                name="subCategory2"
                className="form-control form-select"
                id="subCategory2"
                onChange={handleInputChange}
              >
                <option value="">Sub Category 2</option>
                {subCategory2List?.map((itm) => (
                  <option value={itm?.lovValue}>{itm?.lovValue}</option>
                ))}
              </select>
            </div>
            <div
              className="col-md-3 col-sm-4 mt-2"
              style={{ display: formData.subCategory2 ? "" : "none" }}
            >
              <select
                name="subCategory3"
                className="form-control form-select"
                id="subCategory3"
                onChange={handleInputChange}
              >
                <option value="">Sub Category 3</option>
                {subCategory3List?.map((itm) => (
                  <option value={itm?.lovValue}>{itm?.lovValue}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3 col-sm-4 mt-2">
              <select
                name="location"
                className="form-control form-select"
                id="location"
                onChange={(e) => {
                  const { name, value } = e.target;
                  setFormData({
                    ...formData,
                    [name]: value,
                  });
                  const node = siteLayout.filter(
                    (site) => site.nodeName === value
                  );
                  const data = siteLayout.filter(
                    (site) =>
                      site.nodeType === "floor" &&
                      site.parentNode === node?.[0]?.id
                  );
                  setFloorNode(data || []);
                }}
              >
                <option value="">Location</option>
                <option value="Interior">Interior</option>
                <option value="Exterior">Exterior</option>
                {/* {locationFilter.map((site) => (
                  <option value={site.location}>{site.location}</option>
                ))} */}
              </select>
            </div>
            <div
              className="col-md-3 col-sm-4 mt-2"
              style={{ display: formData.location ? "" : "none" }}
            >
              <select
                name="floor"
                className="form-control form-select"
                id="floor"
                onChange={(e) => {
                  const { name, value } = e.target;
                  setFormData({
                    ...formData,
                    [name]: value,
                  });
                  const node = siteLayout.filter(
                    (site) => site.nodeName === value
                  );
                  const data = siteLayout.filter(
                    (site) =>
                      site.nodeType === "room" &&
                      site.parentNode === node?.[0]?.id
                  );
                  setRoomNode(data || []);
                }}
              >
                <option value="">Floor</option>
                {floorNode?.map((itm) => (
                  <option value={itm?.nodeName}>{itm?.nodeName}</option>
                ))}
              </select>
            </div>
            <div
              className="col-md-3 col-sm-4 mt-2"
              style={{ display: formData.floor ? "" : "none" }}
            >
              <select
                name="room"
                className="form-control form-select"
                id="room"
                value={formData.room} // Set the selected value dynamically
                onChange={handleInputChange}
              >
                <option value="">Room</option>
                {roomNode?.map((itm) => (
                  <option value={itm?.nodeName}>{itm?.nodeName}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="ms-auto p-2 bd-highlight w-100">
          <div className="row" style={{ height: "auto" }}>
            <div className="col-md-3 col-sm-6 mt-2">
              <Tooltip title={`Clone`} arrow>
                <button
                  className="btn btn-light text-primary pr-2"
                  onClick={() => {
                    cloneSelectedAsset();
                  }}
                >
                  Clone
                </button>
              </Tooltip>
            </div>
            <div className="col-md-3 col-sm-4 mt-2">
              <CSVLink
                filename={"selected-assets.csv"}
                className="btn btn-light bg-white text-primary"
                data={selectedItems.map((itm) => {
                  return {
                    assetId: itm?.assetId,
                    assetName: itm?.assetName,
                    manufacturer: itm?.manufacturer,
                    category: itm?.category,
                    subCategory: itm?.subCategory,
                    subCategory2: itm?.subCategory2,
                    subCategory3: itm?.subCategory3,
                    model: itm?.model,
                    deviceId: itm?.deviceId,
                    serialNumber: itm?.serialNumber,
                    relatedAssetId: itm?.relatedAssetId,
                    folderId: itm?.folderId,
                    patItem: itm?.patItem,
                    pfpItem: itm?.pfpItem,
                    doorItem: itm?.doorItem,
                    barcode: itm?.barcode,
                  };
                })}
              >
                <Tooltip title={`Export Selected Assets`} arrow>
                  <i className="fas fa-download"></i> Export Selected
                </Tooltip>
              </CSVLink>
            </div>
            <div className="col-md-3 col-sm-4 mt-2">
              <Tooltip title={`Upload CSV to Update Assets`} arrow>
                <input
                  type="file"
                  id="upload-csv"
                  accept=".csv"
                  style={{ display: "none" }}
                  onChange={(e) => handleFileUpload(e)}
                />
                <label
                  htmlFor="upload-csv"
                  className="btn btn-light text-primary"
                >
                  <i className="fas fa-upload"></i> Upload CSV
                </label>
              </Tooltip>
            </div>
            <div className="col-md-2 col-sm-6 mt-2">
              <Tooltip title={`Assign/Update Pat Register`} arrow>
                <button
                  className="btn btn-light bg-white text-primary"
                  onClick={() => {
                    if (selectedItems?.length === 0) {
                      toast.warn(
                        "Please select asset to assign/update pat record."
                      );
                    } else if (selectedItems?.length === 1) {
                      toast.warn(
                        "Please select more than 1 asset to update pat record else you can edit and update pat record for particular asset."
                      );
                    } else {
                      setShowPatModal(true);
                    }
                  }}
                >
                  <i className="fas fa-pen"></i>
                </button>{" "}
              </Tooltip>
            </div>
            <div className="col-md-2 col-sm-6 mt-2">
              <CSVLink
                filename={"site-pat-item-list.csv"}
                className="btn btn-light bg-white text-primary"
                data={sitePATItems?.map((itm) => {
                  return {
                    ...itm,
                    assetDoorSpecifications: Array.isArray(
                      itm?.assetDoorSpecifications
                    )
                      ? itm.assetDoorSpecifications
                          .map(
                            (asset) =>
                              `assetId: ${asset?.assetId}, depth: ${asset?.depth}, finish: ${asset?.finish}, fireRating: ${asset?.fireRating}, frameFinish: ${asset?.frameFinish}, frameMaterial: ${asset?.frameMaterial}, height: ${asset?.height}, visionPanel: ${asset?.visionPanel}, width: ${asset?.width}`
                          )
                          .join("; ")
                      : "", // Provide empty string if not an array
                    assetPFPItem: Array.isArray(itm?.assetPFPItem)
                      ? itm.assetPFPItem
                          .map(
                            (asset) =>
                              `assetId: ${asset?.assetId}, product: ${asset?.product}, quantity: ${asset?.quantity}, material: ${asset?.material}, dimension: ${asset?.dimension}, service: ${asset?.service}`
                          )
                          .join("; ")
                      : "", // Provide empty string if not an array
                    assetPATItems: Array.isArray(itm?.assetPATItems)
                      ? itm.assetPATItems
                          .map(
                            (asset) =>
                              `patId: ${asset?.patId}, patDate: ${asset?.patDate}, patNextDate: ${asset?.patNextDate}, patUserName: ${asset?.patUserName}`
                          )
                          .join("; ")
                      : "", // Provide empty string if not an array
                  };
                })}
              >
                <Tooltip title={`Export`} arrow>
                  <i className="fas fa-download"></i>
                </Tooltip>
              </CSVLink>
            </div>
            <div className="col-md-3 col-sm-4 mt-2">
              <Tooltip
                  title={
                    selectedItems.length < 2
                        ? "Select at least 2 assets to enable multi-edit"
                        : "Multi-Edit"
                  }
                  arrow
              >
                <button
                    className={`btn btn-light text-primary pr-2 ${
                        selectedItems.length < 2 ? "disabled" : ""
                    }`}
                    onClick={() => setShowMultiEditModal(true)}
                    disabled={selectedItems.length < 2}
                    style={
                      selectedItems.length < 2
                          ? { opacity: 0.6, cursor: "not-allowed" }
                          : {}
                    }
                >
                  Multi-Edit
                </button>
              </Tooltip>
            </div>
            <div className="col-md-2 col-sm-4 mt-2">
              <Tooltip title={`Print`} arrow>
                <button
                  className="btn btn-light text-primary"
                  onClick={() => {
                    printMultipleSelectedAsset(selectedItems);
                  }}
                >
                  <i className="fas fa-print"></i>
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
      {/* row start*/}
      <div className="row p-2">
        <div className="col-md-12 table-responsive">
          <table className="table">
            <thead className="table-dark">
              <tr>
                <th>
                  <input
                    type="checkbox"
                    onChange={handleSelectAllChange}
                    className="form-check-input"
                    checked={
                      selectedItems.length === filteredSitePATItems.length
                    }
                  />
                </th>
                <th scope="col">Asset ID</th>
                <th scope="col">Asset Name</th>
                <th scope="col">Manufactrurer</th>
                <th scope="col">Category</th>
                <th scope="col">Location</th>
                <th scope="col">Date Tested</th>
                <th scope="col">Next Test</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!isLoading && currentSiteAssets?.length === 0 && (
                <tr>
                  <td>No Result Found !!</td>
                </tr>
              )}
              {isLoading && (
                <tr>
                  <td>Loading...</td>
                </tr>
              )}
              {!isLoading && currentSiteAssets?.map((asset) => (
                <tr key={asset?.id}>
                  <th>
                    <input
                      type="checkbox"
                      className="form-check-input"
                      onChange={(e) => handleCheckboxChange(e, asset)}
                      checked={selectedItems.some(
                        (item) => item.assetId === asset.assetId
                      )}
                    />
                  </th>
                  <th scope="col">{asset?.assetId}</th>
                  <th scope="col">{asset?.assetName}</th>
                  <th scope="col">{asset?.manufacturer}</th>
                  <th scope="col">{getCategoryLabelValue(asset)}</th>
                  <th scope="col">{asset?.location}</th>
                  <th scope="col">
                    {findAssetWithNearestPatNextDate(asset)?.patItem?.patDate
                      ? moment(
                          findAssetWithNearestPatNextDate(asset)?.patItem
                            ?.patDate
                        ).format("DD-MM-YYYY")
                      : "--"}
                  </th>
                  <th scope="col">
                    {findAssetWithNearestPatNextDate(asset)?.patItem.patNextDate
                      ? moment(
                          findAssetWithNearestPatNextDate(asset)?.patItem
                            .patNextDate
                        ).format("DD-MM-YYYY")
                      : "--"}
                  </th>
                  <th scope="col">{asset?.status}</th>
                  <th scope="col">
                    <Tooltip title={`View ${asset.assetName}`} arrow>
                      <button
                        className="btn btn-sm btn-light"
                        onClick={() => {
                          goTo(`/view-asset?assetId=${asset?.assetId}`);
                        }}
                      >
                        <i className="fas fa-eye"></i>
                      </button>{" "}
                    </Tooltip>
                    <Tooltip title={`Edit ${asset.assetName}`} arrow>
                      <button
                        className="btn btn-sm btn-light"
                        onClick={() => {
                          goTo(`/update-asset?assetId=${asset?.assetId}`);
                        }}
                      >
                        <i className="fas fa-pen"></i>
                      </button>{" "}
                    </Tooltip>
                    <Tooltip
                      title={`View QR Code for ${asset.assetName}`}
                      arrow
                    >
                      <QRCodeSVG
                        onClick={() => {
                          setShowAddModal(true);
                          setSelectedAsset(asset);
                        }}
                        value={`${window.location.origin}/#/view-asset?assetId=${asset?.assetId}`}
                        style={{
                          height: "30px",
                          width: "30px",
                          margin: "0px 6px",
                          cursor: "pointer",
                        }}
                      />
                    </Tooltip>
                    <Tooltip title={`Delete ${asset.assetName}`} arrow>
                      <button
                        className="btn btn-sm btn-light text-danger"
                        onClick={() => deleteAsset(asset)}
                      >
                        <i className="fas fa-trash"></i>
                      </button>{" "}
                    </Tooltip>
                  </th>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="row" style={{ display: isLoading ? "none" : "" }}>
        <Pagination
          totalPages={Math.ceil(
            filteredSitePATItems.length / preActionsPerPage
          )}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      </div>
      {/* row end*/}
    </Fragment>
  );
};

const mapStateToProps = (state) => ({
  sitePATItems: state.site.sitePATItems,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
  siteLayout: state.site.siteLayout,
});
export default connect(mapStateToProps, { getSitePATAssets, deleteSiteAsset, getSiteLayout })(
  Pat
);
