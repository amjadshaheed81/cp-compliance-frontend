import React, { Fragment, useEffect, useMemo, useState } from "react";
import { connect } from "react-redux";
import { useNavigate } from "react-router-dom";
import { CSVLink } from "react-csv";
import Tooltip from "@mui/material/Tooltip";
import { QRCodeSVG } from "qrcode.react";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import {
  deleteSiteAsset,
  getSiteAssets,
  getSiteLayout,
  setLoaderForAssetsLanding,
} from "../../../../store/thunk/site";
import { get, put } from "../../../../api";
import ShowQRCode from "./ShowQRCode";
import ShowCloneModal from "./ShowCloneModal";
import Pagination from "../../../common/Pagination/Pagination";
import { isManagerAdminLogin } from "../../../../utils/isManagerAdminLogin";
import { printMultipleSelectedAsset } from "../../../../utils/export-qr-code";
import { getCategoryLabelValue } from "../../../../utils/getCategoryLabelValue";
import { useLocation } from "react-router-dom";
import Papa from "papaparse";
import "./AssetStyle.css";

const Summary = ({
  siteAssets,
  deleteSiteAsset,
  getSiteAssets,
  siteSelectedForGlobal,
  loggedInUserData,
  getSiteLayout,
  siteLayout,
}) => {
  const [filteredSiteAssets, setFilteredSiteAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
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
  const [preActionsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [floorNode, setFloorNode] = useState([]);
  const [roomNode, setRoomNode] = useState([]);
  const [showMultiEditModal, setShowMultiEditModal] = useState(false);

  const location = useLocation();
  const indexOfLastPreAction = currentPage * preActionsPerPage;
  const indexOfFirstPreAction = indexOfLastPreAction - preActionsPerPage;
  const currentSiteAssets = filteredSiteAssets
    ?.filter((itm) => itm?.doorItem !== true && itm?.patItem !== true)
    ?.slice(indexOfFirstPreAction, indexOfLastPreAction);
  const locationFilter = siteAssetsList
    ?.map((itm) => {
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
    const getDetails = async () => {
      if (siteSelectedForGlobal?.siteId) {
        setIsLoading(true);
        await getSiteAssets(siteSelectedForGlobal?.siteId);
        await getCategory();
        await getSiteLayout(siteSelectedForGlobal?.siteId);
        setTimeout(() => {
          setIsLoading(false);
        }, 3000);
      }
    };
    getDetails();
  }, [siteSelectedForGlobal]);

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
      const matchedRoom = roomNodes.find(
        (room) => room.nodeName?.split(" ")[1] === roomNumber
      );
      if (matchedRoom) {
        setFormData((prevFormData) => ({
          ...prevFormData,
          room: matchedRoom?.nodeName,
        }));
      }
    }
  }, [siteLayout, location.search]);

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
    if (siteAssets) {
      const formattedAssets = siteAssets.map((itm) => ({
        ...itm,
        location: `${itm?.position || "NA"} > ${itm?.floor || "NA"} > ${
          itm?.room || "NA"
        }`,
      }));

      // Use Promise.all to wait for state updates, then call searchAssets
      Promise.all([
        setFilteredSiteAssets(formattedAssets),
        setSiteAssetsList(formattedAssets),
      ]).then(() => {
        searchAssets(); // Trigger search after both states are updated
      });
    }
  }, [siteAssets]);

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

    if (name === "category") {
      const subCategoryData = subCategory?.filter(
        (itm) => itm?.attribite1 === value
      );
      setSubCategoryList(subCategoryData);
      setSubCategory2List([]);
      setSubCategory3List([]);
      setFormData({
        ...formData,
        [name]: value,
        subCategory: "",
        subCategory2: "",
        subCategory3: "",
      });
    } else if (name === "subCategory") {
      const subCategoryData = subCategory2?.filter(
        (itm) => itm?.attribite1 === value
      );
      setSubCategory2List(subCategoryData);
      setSubCategory3List([]);
      setFormData({
        ...formData,
        [name]: value,
        subCategory2: "",
        subCategory3: "",
      });
    } else if (name === "subCategory2") {
      const subCategoryData = subCategory3?.filter(
        (itm) => itm?.attribite1 === value
      );
      setSubCategory3List(subCategoryData);
      setFormData({
        ...formData,
        [name]: value,
        subCategory3: "",
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
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
    if (
      assetName ||
      category ||
      subCategory ||
      subCategory2 ||
      subCategory3 ||
      location ||
      manufacturer ||
      floor ||
      room
    ) {
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
          String(x?.room).toLowerCase().includes(String(room).toLowerCase())
      );
      setCurrentPage(1); //calculateLastPageIndex(list?.length, preActionsPerPage)
      setFilteredSiteAssets(list);
    } else {
      setFilteredSiteAssets(siteAssetsList);
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
          getSiteAssets(siteSelectedForGlobal?.siteId);
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
      setSelectedItems(
        filteredSiteAssets?.filter(
          (itm) => itm?.doorItem !== true && itm?.patItem !== true
        )
      );
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
            const response = await put("/api/site/296/assets/mutiples", {
              assets,
            });

            if (response.status === 200 || response.status === 201) {
              toast.success("Assets updated successfully!");
              setIsLoading(true);
              await getSiteAssets(siteSelectedForGlobal?.siteId);
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

  //Multi Asset edit handlers
  // Add this helper function outside your component
  const handleFieldUpdate = (assetId, field, value) => {
    setSelectedItems((prevItems) =>
      prevItems.map((item) => {
        if (item.assetId === assetId) {
          const updatedItem = { ...item, [field]: value };

          // Reset dependent fields when parent changes
          if (field === "category") {
            updatedItem.subCategory = "";
            updatedItem.subCategory2 = "";
            updatedItem.subCategory3 = "";
          } else if (field === "subCategory") {
            updatedItem.subCategory2 = "";
            updatedItem.subCategory3 = "";
          } else if (field === "subCategory2") {
            updatedItem.subCategory3 = "";
          } else if (field === "position") {
            updatedItem.floor = "";
            updatedItem.room = "";
          } else if (field === "floor") {
            updatedItem.room = "";
          }

          return updatedItem;
        }
        return item;
      })
    );
  };

  const handleSaveMultiEdit = async () => {
    try {
      setIsLoading(true);

      // Prepare the update payload
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
        })),
      };

      // Send the bulk update request
      const response = await put(
        `/api/site/${siteSelectedForGlobal?.siteId}/assets/mutiples`,
        updatePayload,
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.status === 200 || response.status === 201) {
        toast.success(`Successfully updated ${selectedItems.length} assets`);

        // Safari-specific reload logic
        const isSafari = /^((?!chrome|android).)*safari/i.test(
          navigator.userAgent
        );

        if (isSafari) {
          // For Safari - preserves session
          window.location.href = window.location.href;
        } else {
          // For other browsers - force reload
          window.location.reload(true);
        }

        // Reset selection and close modal
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
  

  return (
    <Fragment>
      {showAddModal && (
        <ShowQRCode
          showAddModal={showAddModal}
          setShowAddModal={setShowAddModal}
          selectedAsset={selectedAsset}
        />
      )}
      {showCloneModal && (
        <ShowCloneModal
          showCloneModal={showCloneModal}
          setShowCloneModal={setShowCloneModal}
          selectedAsset={selectedAssetForClone}
          refresh={() => {
            getSiteAssets(siteSelectedForGlobal?.siteId);
          }}
        />
      )}

      {showMultiEditModal && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(86, 86, 86, 0.2)" }}
        >
          <div
            className="modal-dialog modal-dialog-scrollable"
            style={{ width: "90vw", maxWidth: "90vw" }}
          >
            <div
              className="modal-content"
              style={{ minHeight: "90vh", minWidth: "90vw" }}
            >
              <div className="modal-header">
                <h5 className="modal-title">
                  Edit Multiple Assets ({selectedItems.length} selected)
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowMultiEditModal(false)}
                  disabled={isLoading}
                ></button>
              </div>
              <div className="modal-body p-0">
                <div className="table-responsive" style={{ maxHeight: "70vh" }}>
                  <table className="table table-hover mb-0">
                    <thead className="sticky-top bg-light">
                      <tr>
                        <th style={{ width: "100px", minWidth: "100px" }}>
                          Asset ID
                        </th>
                        <th style={{ width: "100px", minWidth: "100px" }}>
                          Asset Name
                        </th>
                        <th style={{ width: "100px", minWidth: "100px" }}>
                          Manufacturer
                        </th>
                        <th style={{ width: "200px", minWidth: "200px" }}>
                          Category
                        </th>
                        <th style={{ width: "200px", minWidth: "200px" }}>
                          Sub Category
                        </th>
                        <th style={{ width: "200px", minWidth: "200px" }}>
                          Sub Cat 2
                        </th>
                        <th style={{ width: "200px", minWidth: "200px" }}>
                          Sub Cat 3
                        </th>
                        <th style={{ width: "200px", minWidth: "200px" }}>
                          Position
                        </th>
                        <th style={{ width: "200px", minWidth: "200px" }}>
                          Floor
                        </th>
                        <th style={{ width: "200px", minWidth: "200px" }}>
                          Room
                        </th>
                      </tr>
                    </thead>
                    <tbody style={{ overflowY: "auto" }}>
                      {selectedItems.map((asset) => {
                        const subCategoryOptions =
                          subCategory?.filter(
                            (itm) => itm.attribite1 === asset.category
                          ) || [];
                        const subCategory2Options =
                          subCategory2?.filter(
                            (itm) => itm.attribite1 === asset.subCategory
                          ) || [];
                        const subCategory3Options =
                          subCategory3?.filter(
                            (itm) => itm.attribite1 === asset.subCategory2
                          ) || [];

                        return (
                          <tr key={asset.assetId}>
                            <td style={{ width: "200px", minWidth: "200px" }}>
                              {asset.assetId}
                            </td>
                            <td style={{ width: "200px", minWidth: "200px" }}>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={asset.assetName || ""}
                                onChange={(e) =>
                                  handleFieldUpdate(
                                    asset.assetId,
                                    "assetName",
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                            <td style={{ width: "300px", minWidth: "300px" }}>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={asset.manufacturer || ""}
                                onChange={(e) =>
                                  handleFieldUpdate(
                                    asset.assetId,
                                    "manufacturer",
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                            <td style={{ width: "300px", minWidth: "300px" }}>
                              <select
                                className="form-select form-select-sm"
                                value={asset.category || ""}
                                onChange={(e) => {
                                  handleFieldUpdate(
                                    asset.assetId,
                                    "category",
                                    e.target.value
                                  );
                                  handleFieldUpdate(
                                    asset.assetId,
                                    "subCategory",
                                    ""
                                  );
                                  handleFieldUpdate(
                                    asset.assetId,
                                    "subCategory2",
                                    ""
                                  );
                                  handleFieldUpdate(
                                    asset.assetId,
                                    "subCategory3",
                                    ""
                                  );
                                }}
                              >
                                <option value="">Select</option>
                                {category?.map((opt) => (
                                  <option
                                    key={opt.lovValue}
                                    value={opt.lovValue}
                                  >
                                    {opt.lovValue}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td style={{ width: "300px", minWidth: "300px" }}>
                              <select
                                className="form-select form-select-sm"
                                value={asset.subCategory || ""}
                                onChange={(e) => {
                                  handleFieldUpdate(
                                    asset.assetId,
                                    "subCategory",
                                    e.target.value
                                  );
                                  handleFieldUpdate(
                                    asset.assetId,
                                    "subCategory2",
                                    ""
                                  );
                                  handleFieldUpdate(
                                    asset.assetId,
                                    "subCategory3",
                                    ""
                                  );
                                }}
                                disabled={!asset.category}
                              >
                                <option value="">Select</option>
                                {subCategoryOptions.map((opt) => (
                                  <option
                                    key={opt.lovValue}
                                    value={opt.lovValue}
                                  >
                                    {opt.lovValue}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td style={{ width: "300px", minWidth: "300px" }}>
                              <select
                                className="form-select form-select-sm"
                                value={asset.subCategory2 || ""}
                                onChange={(e) => {
                                  handleFieldUpdate(
                                    asset.assetId,
                                    "subCategory2",
                                    e.target.value
                                  );
                                  handleFieldUpdate(
                                    asset.assetId,
                                    "subCategory3",
                                    ""
                                  );
                                }}
                                disabled={!asset.subCategory}
                              >
                                <option value="">Select</option>
                                {subCategory2Options.map((opt) => (
                                  <option
                                    key={opt.lovValue}
                                    value={opt.lovValue}
                                  >
                                    {opt.lovValue}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td style={{ width: "300px", minWidth: "300px" }}>
                              <select
                                className="form-select form-select-sm"
                                value={asset.subCategory3 || ""}
                                onChange={(e) =>
                                  handleFieldUpdate(
                                    asset.assetId,
                                    "subCategory3",
                                    e.target.value
                                  )
                                }
                                disabled={!asset.subCategory2}
                              >
                                <option value="">Select</option>
                                {subCategory3Options.map((opt) => (
                                  <option
                                    key={opt.lovValue}
                                    value={opt.lovValue}
                                  >
                                    {opt.lovValue}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td style={{ width: "300px", minWidth: "300px" }}>
                              <select
                                className="form-select form-select-sm"
                                value={asset.position || ""}
                                onChange={(e) => {
                                  handleFieldUpdate(
                                    asset.assetId,
                                    "position",
                                    e.target.value
                                  );
                                  handleFieldUpdate(asset.assetId, "floor", "");
                                  handleFieldUpdate(asset.assetId, "room", "");
                                }}
                              >
                                <option value="">Select</option>
                                <option value="Interior">Interior</option>
                                <option value="Exterior">Exterior</option>
                              </select>
                            </td>
                            <td style={{ width: "300px", minWidth: "300px" }}>
                              <select
                                className="form-select form-select-sm"
                                value={asset.floor || ""}
                                onChange={(e) => {
                                  handleFieldUpdate(
                                    asset.assetId,
                                    "floor",
                                    e.target.value
                                  );
                                  handleFieldUpdate(asset.assetId, "room", "");
                                }}
                                disabled={!asset.position}
                              >
                                <option value="">Select</option>
                                {floorNode?.map((node) => (
                                  <option
                                    key={node.nodeName}
                                    value={node.nodeName}
                                  >
                                    {node.nodeName}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td style={{ width: "300px", minWidth: "300px" }}>
                              <select
                                className="form-select form-select-sm"
                                value={asset.room || ""}
                                onChange={(e) =>
                                  handleFieldUpdate(
                                    asset.assetId,
                                    "room",
                                    e.target.value
                                  )
                                }
                                disabled={!asset.floor}
                              >
                                <option value="">Select</option>
                                {roomNode
                                  ?.filter(
                                    (node) =>
                                      node.parentNode ===
                                      floorNode.find(
                                        (f) => f.nodeName === asset.floor
                                      )?.id
                                  )
                                  ?.map((node) => (
                                    <option
                                      key={node.nodeName}
                                      value={node.nodeName}
                                    >
                                      {node.nodeName}
                                    </option>
                                  ))}
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer d-flex justify-content-between">
                <div>
                  <button
                    type="button"
                    className="btn btn-outline-secondary me-2"
                    onClick={() => {
                      if (
                        window.confirm(
                          "Are you sure you want to discard all changes?"
                        )
                      ) {
                        setShowMultiEditModal(false);
                      }
                    }}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSaveMultiEdit}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Saving...
                      </>
                    ) : (
                      `Save ${selectedItems.length} Assets`
                    )}
                  </button>
                </div>
                <div className="text-muted small">
                  Showing {selectedItems.length} of {selectedItems.length}{" "}
                  selected assets
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="d-flex bd-highlight">
        <div className="pt-2 bd-highlight ">
          <div className="row" style={{ height: "auto" }}>
            <div className="col-md-4 col-sm-4 mt-2">
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
            <div className="col-md-4 col-sm-4 mt-2">
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
            <div className="col-md-4 col-sm-4 mt-2">
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
              className="col-md-4 col-sm-4 mt-2"
              style={{ display: formData?.category?.length > 0 ? "" : "none" }}
            >
              <select
                name="subCategory"
                className="form-control form-select"
                id="subCategory"
                onChange={handleInputChange}
                value={formData?.subCategory}
              >
                <option value="">Sub Category</option>
                {subCategoryList?.map((itm) => (
                  <option value={itm?.lovValue}>{itm?.lovValue}</option>
                ))}
              </select>
            </div>
            <div
              className="col-md-4 col-sm-4 mt-2"
              style={{
                display: formData?.subCategory?.length > 0 ? "" : "none",
              }}
            >
              <select
                name="subCategory2"
                className="form-control form-select"
                id="subCategory2"
                value={formData?.subCategory2}
                onChange={handleInputChange}
              >
                <option value="">Sub Category 2</option>
                {subCategory2List?.map((itm) => (
                  <option value={itm?.lovValue}>{itm?.lovValue}</option>
                ))}
              </select>
            </div>
            <div
              className="col-md-4 col-sm-4 mt-2"
              style={{
                display: formData?.subCategory2?.length > 0 ? "" : "none",
              }}
            >
              <select
                name="subCategory3"
                className="form-control form-select"
                id="subCategory3"
                value={formData?.subCategory3}
                onChange={handleInputChange}
              >
                <option value="">Sub Category 3</option>
                {subCategory3List?.map((itm) => (
                  <option value={itm?.lovValue}>{itm?.lovValue}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4 col-sm-4 mt-2">
              <select
                name="location"
                className="form-control form-select"
                id="location"
                // onChange={handleInputChange}
                value={formData?.location}
                onChange={(e) => {
                  const { name, value } = e.target;
                  setFormData({
                    ...formData,
                    [name]: value,
                    floor: "",
                    room: "",
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
              className="col-md-4 col-sm-4 mt-2"
              style={{ display: formData?.location?.length > 0 ? "" : "none" }}
            >
              <select
                name="floor"
                className="form-control form-select"
                id="floor"
                // onChange={handleInputChange}
                value={formData?.floor}
                onChange={(e) => {
                  const { name, value } = e.target;
                  setFormData({
                    ...formData,
                    [name]: value,
                    room: "",
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
              className="col-md-4 col-sm-4 mt-2"
              style={{ display: formData.floor?.length > 0 ? "" : "none" }}
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

        {isManagerAdminLogin(loggedInUserData) && (
          <div className="ms-auto p-2 bd-highlight w-100">
            <div className="row" style={{ height: "auto" }}>
              <div className="col-md-2 col-sm-4 mt-2">
                <Tooltip title={`Add New Asset`} arrow>
                  <button
                    className="btn btn-primary text-white pr-2"
                    onClick={() => {
                      goTo("/create-asset");
                    }}
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                </Tooltip>
              </div>
              <div className="col-md-3 col-sm-4 mt-2">
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
              {/* <div className="col-md-3 col-sm-4 mt-2">
                {selectedItems.length > 0 ? (
                  <CSVLink
                    disabaled={selectedItems.length === 0}
                    filename={"selected-assets.csv"}
                    className="btn btn-light bg-white text-primary"
                    data={selectedItems
                      .sort((a, b) => a.assetId - b.assetId)
                      .map((itm) => {
                        return {
                          assetId: itm?.assetId,
                          assetName: itm?.assetName,
                          location: itm?.location,
                          manufacturer: itm?.manufacturer,
                          category: itm?.category,
                          subCategory: itm?.subCategory,
                          subCategory2: itm?.subCategory2,
                          subCategory3: itm?.subCategory3,
                          model: itm?.model,
                          deviceId: itm?.deviceId,
                          serialNumber: itm?.serialNumber,
                        };
                      })}
                  >
                    <Tooltip title={`Export Selected Assets`} arrow>
                      <i className="fas fa-download"></i> Export Selected
                    </Tooltip>
                  </CSVLink>
                ) : (
                  <button
                    disabled
                    style={{ opacity: 0.6, cursor: "not-allowed" }}
                    className="btn btn-light bg-white text-primary"
                  >
                    <i className="fas fa-download"></i>
                    &nbsp; Export Selected
                  </button>
                )}
              </div> */}
              {/* <div className="col-md-3 col-sm-4 mt-2">
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
              </div> */}
              <div className="col-md-2 col-sm-4 mt-2">
                <CSVLink
                  filename={"site-assets-lists.csv"}
                  className="btn btn-light bg-white text-primary"
                  data={filteredSiteAssets
                    ?.filter(
                      (itm) => itm?.doorItem !== true && itm?.patItem !== true
                    )
                    .sort((a, b) => a.assetId - b.assetId)
                    .map((itm) => {
                      return {
                        "Asset Id": itm?.assetId,
                        "Site Id": itm?.siteId,
                        "Site Name": itm?.siteName,
                        "Asset Name": itm?.assetName,
                        Manufacturer: itm?.manufacturer,
                        Category: itm?.category,
                        "Sub Category": itm?.subCategory,
                        "Sub Category 2": itm?.subCategory2,
                        "Folder Name": itm?.folderName,
                        "Is PAT Item": itm?.patItem,
                        "Is PFP Item": itm?.pfpItem,
                        "Is Door Item": itm?.doorItem,
                        Position: itm?.position,
                        Floor: itm?.floor,
                        "Purchase Date": itm?.purchaseDate,
                        Location: itm?.location,
                        Model: itm?.model,
                        "Serial Number": itm?.serialNumber,

                        // ...itm,
                        // assetDoorSpecifications: Array.isArray(
                        //   itm?.assetDoorSpecifications
                        // )
                        //   ? itm.assetDoorSpecifications
                        //       .map(
                        //         (asset) =>
                        //           `assetId: ${asset?.assetId}, depth: ${asset?.depth}, finish: ${asset?.finish}, fireRating: ${asset?.fireRating}, frameFinish: ${asset?.frameFinish}, frameMaterial: ${asset?.frameMaterial}, height: ${asset?.height}, visionPanel: ${asset?.visionPanel}, width: ${asset?.width}`
                        //       )
                        //       .join("; ")
                        //   : "", // Provide empty string if not an array
                        // assetPFPItem: Array.isArray(itm?.assetPFPItem)
                        //   ? itm.assetPFPItem
                        //       .map(
                        //         (asset) =>
                        //           `assetId: ${asset?.assetId}, product: ${asset?.product}, quantity: ${asset?.quantity}, material: ${asset?.material}, dimension: ${asset?.dimension}, service: ${asset?.service}`
                        //       )
                        //       .join("; ")
                        //   : "", // Provide empty string if not an array
                        // assetPATItems: Array.isArray(itm?.assetPATItems)
                        //   ? itm.assetPATItems
                        //       .map(
                        //         (asset) =>
                        //           `patId: ${asset?.patId}, patDate: ${asset?.patDate}, patNextDate: ${asset?.patNextDate}, patUserName: ${asset?.patUserName}`
                        //       )
                        //       .join("; ")
                        //   : "", // Provide empty string if not an array
                      };
                    })}
                >
                  <Tooltip title={`Export`} arrow>
                    <i className="fas fa-download"></i>
                  </Tooltip>
                </CSVLink>
              </div>
              <div className="col-md-3 col-sm-4 mt-2">
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
        )}
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
                    className="form-check-input"
                    onChange={handleSelectAllChange}
                    checked={
                      selectedItems.length ===
                      filteredSiteAssets?.filter(
                        (itm) => itm?.doorItem !== true && itm?.patItem !== true
                      ).length
                    }
                  />
                </th>
                <th scope="col">Asset ID</th>
                <th scope="col">Asset Name</th>
                <th scope="col">Manufacturer</th>
                <th scope="col">Category</th>
                <th scope="col">Location</th>
                {/* <th scope="col">Passive Fire Sch</th>
                <th scope="col">PAT Item</th> */}
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

              {!isLoading &&
                currentSiteAssets?.map((asset) => (
                  <tr key={asset?.assetId}>
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
                    {/* <th scope="col">{asset?.pfpItem ? "YES" : "NO"}</th>
                  <th scope="col">{asset?.patItem ? "YES" : "NO"}</th> */}
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
                      {isManagerAdminLogin(loggedInUserData) && (
                        <>
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
                          <Tooltip title={`Edit ${asset.assetName}`} arrow>
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
                        </>
                      )}
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
            filteredSiteAssets.filter(
              (itm) => itm?.doorItem !== true && itm?.patItem !== true
            ).length / preActionsPerPage
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
  siteAssets: state.site.siteAssets,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
  loggedInUserData: state.site.loggedInUserData,
  siteLayout: state.site.siteLayout,
});
export default connect(mapStateToProps, {
  deleteSiteAsset,
  getSiteAssets,
  getSiteLayout,
})(Summary);
