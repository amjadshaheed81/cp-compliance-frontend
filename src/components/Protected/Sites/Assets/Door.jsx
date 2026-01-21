import React, { Fragment, useEffect, useState, useRef } from "react";
import { connect } from "react-redux";
import { CSVLink } from "react-csv";
import Tooltip from "@mui/material/Tooltip";
import { QRCodeSVG } from "qrcode.react";
import {
  deleteSiteAsset,
  getSiteDoorAssets,
  getSiteLayout,
} from "../../../../store/thunk/site";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { del, get, put } from "../../../../api";
import ShowQRCode from "./ShowQRCode";
import ShowCloneModal from "./ShowCloneModal";
import Pagination from "../../../common/Pagination/Pagination";
import { printMultipleSelectedAsset } from "../../../../utils/export-qr-code";
import { useLocation } from "react-router-dom";
import Papa from "papaparse";
import moment from "moment";

const Door = ({
                siteDoorItems,
                siteSelectedForGlobal,
                getSiteDoorAssets,
                deleteSiteAsset,
                getSiteLayout,
                siteLayout,
              }) => {
  const [filteredSiteDoorItems, setFilteredSiteDoorItems] = useState([]);
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
  const [showMultiEditModal, setShowMultiEditModal] = useState(false);
  const navigate = useNavigate();
  const [preActionsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const indexOfLastPreAction = currentPage * preActionsPerPage;
  const indexOfFirstPreAction = indexOfLastPreAction - preActionsPerPage;
  const [floorNode, setFloorNode] = useState([]);
  const [roomNode, setRoomNode] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const prevSiteIdRef = useRef(siteSelectedForGlobal?.siteId || null);
  const currentSiteAssets = filteredSiteDoorItems?.slice(
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
  const goTo = (link) => {
    navigate(link);
  };

  useEffect(() => {
    if (siteDoorItems) {
      const formattedDoorItems = siteDoorItems?.map((itm) => ({
        ...itm,
        location: `${itm?.position || "NA"} > ${itm?.floor || "NA"} > ${itm?.room || "NA"}`,
      }));

      Promise.all([
        setFilteredSiteDoorItems(formattedDoorItems),
        setSiteAssetsList(formattedDoorItems),
      ]).then(() => {
        searchAssets();
      });
    }
  }, [siteDoorItems]);



  const [formData, setFormData] = useState(() => {
    const savedFilters = localStorage.getItem('doorAssetFilters');

    if (savedFilters) {
      try {
        return JSON.parse(savedFilters);
      } catch (error) {
        console.error('Error parsing saved filters:', error);
        localStorage.removeItem('doorAssetFilters');
      }
    }

    const searchParams = new URLSearchParams(location.search);
    return {
      assetName: searchParams.get('assetName') || "",
      manufacturer: searchParams.get('manufacturer') || "",
      category: searchParams.get('category') || "",
      subCategory: searchParams.get('subCategory') || "",
      subCategory2: searchParams.get('subCategory2') || "",
      subCategory3: searchParams.get('subCategory3') || "",
      position: searchParams.get('position') || "",
      floor: searchParams.get('floor') || "",
      room: searchParams.get('room') || "",
    };
  });

  // Update URL and save filters to localStorage when they change
  useEffect(() => {
    const searchParams = new URLSearchParams();

    Object.entries(formData).forEach(([key, value]) => {
      if (value) {
        searchParams.set(key, value);
      }
    });

    // Save filters to localStorage
    localStorage.setItem('doorAssetFilters', JSON.stringify(formData));
    
    // Replace current URL with updated search params
    navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });

    // Cleanup function to clear filters when component unmounts
    return () => {
      localStorage.removeItem('doorAssetFilters');
    };
  }, [formData, location.pathname, navigate]);


  useEffect(() => {
    const savedFilters = localStorage.getItem('doorAssetFilters');
    if (savedFilters) {
      try {
        const parsedFilters = JSON.parse(savedFilters);
        setFormData(parsedFilters);

        // Also update URL to reflect the loaded filters
        const searchParams = new URLSearchParams();
        Object.entries(parsedFilters).forEach(([key, value]) => {
          if (value) {
            searchParams.set(key, value);
          }
        });

        if (searchParams.toString()) {
          navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
        }
      } catch (error) {
        console.error('Error loading saved filters:', error);
        localStorage.removeItem('doorAssetFilters');
      }
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "position") {
      // When position changes, reset floor and room
      const positionNode = siteLayout.find(node =>
        node.nodeType === "type" && node.nodeName === value
      );
      
      // Filter floors based on the selected position
      const floors = siteLayout.filter(node => 
        node.nodeType === "floor" && node.parentNode === positionNode?.id
      );

      setFormData({
        ...formData,
        [name]: value,
        floor: "",
        room: ""
      });
      setFloorNode(floors);  // Set only floors belonging to this position
      setRoomNode([]);
    }
    else if (name === "floor") {
      // When floor changes, reset room and update available rooms
      const selectedFloor = floorNode.find(f => f.nodeName === value);
      const rooms = siteLayout.filter(
        node => node.nodeType === "room" && node.parentNode === selectedFloor?.id
      );

      setFormData({
        ...formData,
        [name]: value,
        room: ""
      });
      setRoomNode(rooms);
    }
    else if (name === "category") {
      setFormData({
        ...formData,
        [name]: value,
        subCategory: "",
        subCategory2: "",
        subCategory3: ""
      });

      const subCategoryData = subCategory?.filter(
          (itm) => itm?.attribite1 === value
      );
      setSubCategoryList(subCategoryData);
      setSubCategory2List([]);
      setSubCategory3List([]);
    }
    else if (name === "subCategory") {
      setFormData({
        ...formData,
        [name]: value,
        subCategory2: "",
        subCategory3: ""
      });

      const subCategoryData = subCategory2?.filter(
          (itm) => itm?.attribite1 === value
      );
      setSubCategory2List(subCategoryData);
      setSubCategory3List([]);
    }
    else if (name === "subCategory2") {
      setFormData({
        ...formData,
        [name]: value,
        subCategory3: ""
      });

      const subCategoryData = subCategory3?.filter(
          (itm) => itm?.attribite1 === value
      );
      setSubCategory3List(subCategoryData);
    }
    else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const searchAssets = () => {
    const {
      assetName,
      category,
      subCategory,
      subCategory2,
      subCategory3,
      position,
      manufacturer,
      floor,
      room
    } = formData;

    // Start with all assets
    let filtered = [...siteAssetsList];

    // Apply each filter only if it has a value
    if (assetName) {
      filtered = filtered.filter(x =>
        String(x?.assetName || '').toLowerCase().includes(assetName.toLowerCase()) ||
        String(x?.assetId || '').toLowerCase().includes(assetName.toLowerCase())
      );
    }

    if (category) {
      filtered = filtered.filter(x =>
        String(x?.category || '') === category
      );
    }

    if (subCategory) {
      filtered = filtered.filter(x =>
        String(x?.subCategory || '') === subCategory
      );
    }

    if (subCategory2) {
      filtered = filtered.filter(x =>
        String(x?.subCategory2 || '') === subCategory2
      );
    }

    if (subCategory3) {
      filtered = filtered.filter(x =>
        String(x?.subCategory3 || '') === subCategory3
      );
    }

    if (position) {
      filtered = filtered.filter(x =>
        String(x?.position || '').toLowerCase() === position.toLowerCase()
      );
    }

    if (manufacturer) {
      filtered = filtered.filter(x =>
        String(x?.manufacturer || '').toLowerCase().includes(manufacturer.toLowerCase())
      );
    }

    if (floor) {
      filtered = filtered.filter(x =>
        String(x?.floor || '').toLowerCase() === floor.toLowerCase()
      );
    }

    if (room) {
      filtered = filtered.filter(x =>
        String(x?.room || '').toLowerCase() === room.toLowerCase()
      );
    }

    setCurrentPage(1);
    setFilteredSiteDoorItems(filtered);
  };

  useEffect(() => {
    searchAssets();
  }, [
    formData.assetName,
    formData.category,
    formData.subCategory,
    formData.subCategory2,
    formData.subCategory3,
    formData.position,
    formData.manufacturer,
    formData.floor,
    formData.room,
  ]);



  useEffect(() => {
    getSiteDoorAssets(siteSelectedForGlobal?.siteId);
    getCategory();
    getSiteLayout(siteSelectedForGlobal?.siteId)
  }, [siteSelectedForGlobal?.siteId]);

  // Clear saved asset filters when the active site changes
  useEffect(() => {
    const currentSiteId = siteSelectedForGlobal?.siteId;
    const previousSiteId = prevSiteIdRef.current;


    if (currentSiteId && previousSiteId !== null && previousSiteId !== undefined) {
      const siteIdChanged = String(previousSiteId) !== String(currentSiteId);

      if (siteIdChanged) {
        const emptyFilters = {
          assetName: "",
          manufacturer: "",
          category: "",
          subCategory: "",
          subCategory2: "",
          subCategory3: "",
          position: "",
          floor: "",
          room: "",
        };

        setFormData(emptyFilters);
        setFloorNode([]);  // Clear floors
        setRoomNode([]);   // Clear rooms
        localStorage.setItem('doorAssetFilters', JSON.stringify(emptyFilters));
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
    // Update the ref with the current siteId AFTER checking
    if (currentSiteId) {
      prevSiteIdRef.current = currentSiteId;
    }
  }, [siteSelectedForGlobal]);

  useEffect(() => {
    // Handle URL parameter for room selection
    const queryParams = new URLSearchParams(location.search);
    const label = queryParams.get("roomLabel");

    if (label) {
      const roomNumber = label;
      // Find room by matching the exact name part after splitting
      const matchedRoom = siteLayout.find(
        (room) => room.nodeType === "room" && room.nodeName?.split(" ")[1] === roomNumber
      );
      if (matchedRoom) {
        // Find the floor for this room
        const parentFloor = siteLayout.find(f => f.id === matchedRoom.parentNode);
        // Find the position (type) for this floor
        const parentPosition = siteLayout.find(p => p.id === parentFloor?.parentNode);
        
        if (parentPosition && parentFloor) {
          setFormData((prevFormData) => ({
            ...prevFormData,
            position: parentPosition.nodeName,
            floor: parentFloor.nodeName,
            room: matchedRoom?.nodeName,
          }));
        }
      }
    }

    // Populate floors/rooms based on selected position/floor
    if (formData?.position && siteLayout?.length > 0) {
      const positionNode = siteLayout.find(node => 
        node.nodeType === "type" && node.nodeName === formData.position
      );
      const floors = siteLayout.filter(node => 
        node.nodeType === "floor" && node.parentNode === positionNode?.id
      );
      setFloorNode(floors);

      if (formData?.floor) {
        const floor = floors.find(f => f.nodeName === formData.floor);
        const rooms = siteLayout.filter(node => 
          node.nodeType === "room" && node.parentNode === floor?.id
        );
        setRoomNode(rooms);
      } else {
        setRoomNode([]);
      }
    } else {
      setFloorNode([]);
      setRoomNode([]);
    }
  }, [siteLayout, location.search, formData?.position, formData?.floor]);

  const getCategory = async () => {
    const categoryList = await get("/api/lov/ASSET_CATEGORY");
    const subCategoryList = await get("/api/lov/ASSET_SUB_CATEGORY");
    const subCategory2List = await get("/api/lov/ASSET_SUB_CATEGORY_2");
    const subCategory3List = await get("/api/lov/ASSET_SUB_CATEGORY_3");
    setCategory(categoryList);
    setSubCategory(subCategoryList);
    setSubCategory2(subCategory2List);
    setSubCategory3(subCategory3List);

    const defaultCategory = "Internal Finishes";
    const defaultSubCategory = "Internal Doors";

    const filteredSubCategories = subCategoryList?.filter(
        (itm) => itm?.attribite1 === defaultCategory
    );

    const filteredSubCategories2 = subCategory2List?.filter(
        (itm) => itm?.attribite1 === defaultSubCategory
    );

    setSubCategoryList(filteredSubCategories);
    setSubCategory2List(filteredSubCategories2);
    setSubCategory3List([]);
    setFormData({
      ...formData,
      category: defaultCategory,
      subCategory: defaultSubCategory
    });
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
              `${itm?.assetName} site asset has been deleted successfully`
          );
          getSiteDoorAssets(siteSelectedForGlobal?.siteId);
        } else {
          toast.error(
              "Something went wrong while deleting site asset. Please try again!"
          );
        }
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
      setSelectedItems(filteredSiteDoorItems);
    } else {
      setSelectedItems([]);
    }
  };

  // Multi Asset edit handlers - Same as Summary component
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

  // Add this function after the handleFieldUpdate function
  const handleDoorSpecUpdate = (assetId, field, value) => {
    setSelectedItems((prevItems) =>
      prevItems.map((item) => {
        if (item.assetId === assetId) {
          const updatedItem = {
            ...item,
            assetDoorSpecifications: {
              ...item.assetDoorSpecifications,
              [field]: value,
            },
          };
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
          powerOutput: item.powerOutput,
          // Include door specifications if they exist
          ...(item.assetDoorSpecifications && {
            assetDoorSpecifications: {
              assetId: item.assetId,
              width: item.assetDoorSpecifications.width,
              height: item.assetDoorSpecifications.height,
              depth: item.assetDoorSpecifications.depth,
              fireRating: item.assetDoorSpecifications.fireRating,
              finish: item.assetDoorSpecifications.finish,
              visionPanel: item.assetDoorSpecifications.visionPanel,
              frameMaterial: item.assetDoorSpecifications.frameMaterial,
              frameFinish: item.assetDoorSpecifications.frameFinish,
            }
          })
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
        getSiteDoorAssets(siteSelectedForGlobal?.siteId);
        getSiteDoorAssets(siteSelectedForGlobal?.siteId);
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


  // Multi Asset delete handler
  const handleMultiDelete = async () => {
    if (selectedItems.length === 0) {
      toast.warn("Please select at least one asset to delete.");
      return;
    }

    Swal.fire({
      title: `Delete ${selectedItems.length} Assets?`,
      html: `You are about to delete <strong>${selectedItems.length}</strong> assets. This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          setIsLoading(true);

          // Prepare the delete payload - send array of asset IDs directly
          const assetIds = selectedItems.map(item => item.assetId);

          // Send the bulk delete request
          const response = await del(
            `/api/site/assets/delete-multiple`,
            assetIds, // Send array directly, not wrapped in object
            { headers: { "Content-Type": "application/json" } }
          );

          if (response.status === 200 || response.status === 201) {
            toast.success(`Successfully deleted ${selectedItems.length} assets`);

            getSiteDoorAssets(siteSelectedForGlobal?.siteId);
            getSiteDoorAssets(siteSelectedForGlobal?.siteId);
            setSelectedItems([]);
          } else {
            throw new Error("Failed to delete assets");
          }
        } catch (error) {
          //console.error("Asset delete error:", error);
          toast.error(`Error deleting assets: ${error.message}`);
        } finally {
          setIsLoading(false);
        }
      }
    });
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
                  assetDoorSpecifications: {
                    assetId: assetId,
                    width: row.doorWidth || "",
                    height: row.doorHeight || "",
                    depth: row.doorDepth || "",
                    fireRating: row.doorFireRating || "",
                    finish: row.doorFinish || "",
                    visionPanel: row.doorVisionPanel || "",
                    frameMaterial: row.doorFrameMaterial || "",
                    frameFinish: row.doorFrameFinish || "",
                  },
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
              await getSiteDoorAssets(siteSelectedForGlobal?.siteId);
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
      });
    }
  };

  const clearFilters = () => {
    const emptyFilters = {
      assetName: "",
      manufacturer: "",
      category: "",
      subCategory: "",
      subCategory2: "",
      subCategory3: "",
      position: "",
      floor: "",
      room: "",
    };

    setFormData(emptyFilters);
    setFloorNode([]);  // Clear floors
    setRoomNode([]);   // Clear rooms
    localStorage.setItem('doorAssetFilters', JSON.stringify(emptyFilters));

    // Reset cascading dropdown states to show all options
    setSubCategoryList(subCategory || []);
    setSubCategory2List(subCategory2 || []);
    setSubCategory3List(subCategory3 || []);

    navigate(location.pathname);
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
                  getSiteDoorAssets(siteSelectedForGlobal?.siteId);
                }}
            />
        )}

      {showMultiEditModal && (
        <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(86, 86, 86, 0.2)" }}>
          <div className="modal-dialog modal-dialog-scrollable" style={{ width: "90vw", maxWidth: "90vw" }}>
            <div className="modal-content" style={{ minHeight: "90vh", minWidth: "90vw" }}>
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
                        <th style={{ width: "100px" }}>Asset ID</th>
                        <th style={{ width: "200px" }}>Asset Name</th>
                        <th style={{ width: "150px" }}>Manufacturer</th>
                        {/* Door Specification Fields */}
                        <th style={{ width: "120px" }}>Door Ref</th>
                        <th style={{ width: "120px" }}>Door Size</th>
                        <th style={{ width: "120px" }}>Core Durability</th>
                        <th style={{ width: "100px" }}>Fire Rating</th>
                        <th style={{ width: "100px" }}>DB Rating</th>
                        <th style={{ width: "120px" }}>Door Facing</th>
                        <th style={{ width: "120px" }}>Door Finish</th>
                        <th style={{ width: "120px" }}>Vision Panel</th>
                        <th style={{ width: "120px" }}>Glazing Size</th>
                        <th style={{ width: "120px" }}>Glass Type</th>
                        <th style={{ width: "150px" }}>Flush Bolt Cut Out</th>
                        <th style={{ width: "120px" }}>Lock Cut Out</th>
                        <th style={{ width: "120px" }}>Rebated MS</th>
                        <th style={{ width: "120px" }}>CDC Cut Out</th>
                        <th style={{ width: "120px" }}>Hinge Cut Out</th>
                        <th style={{ width: "100px" }}>Hinges</th>
                        <th style={{ width: "120px" }}>Frame Section</th>
                        <th style={{ width: "100px" }}>Stop Size</th>
                        <th style={{ width: "100px" }}>Four Sided</th>
                        <th style={{ width: "100px" }}>Fan Light</th>
                        <th style={{ width: "100px" }}>Screen</th>
                        <th style={{ width: "120px" }}>Architraves</th>
                        <th style={{ width: "120px" }}>Frame Material</th>
                        <th style={{ width: "120px" }}>Frame Finish</th>
                        <th style={{ width: "150px" }}>Screen/Fan Light Material</th>
                        <th style={{ width: "100px" }}>Door Width</th>
                        <th style={{ width: "100px" }}>Door Height</th>
                        <th style={{ width: "100px" }}>Door Depth</th>
                      </tr>
                    </thead>
                    <tbody style={{ overflowY: "auto" }}>
                      {selectedItems.map((asset) => (
                        <tr key={asset.assetId}>
                          <td>{asset.assetId}</td>
                          <td>
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
                          <td>
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

                          {/* Door Specification Fields */}
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={asset.assetDoorSpecifications?.doorRef || ""}
                              onChange={(e) =>
                                handleDoorSpecUpdate(
                                  asset.assetId,
                                  "doorRef",
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={asset.assetDoorSpecifications?.doorSize || ""}
                              onChange={(e) =>
                                handleDoorSpecUpdate(
                                  asset.assetId,
                                  "doorSize",
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={asset.assetDoorSpecifications?.coreDurability || ""}
                              onChange={(e) =>
                                handleDoorSpecUpdate(
                                  asset.assetId,
                                  "coreDurability",
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={asset.assetDoorSpecifications?.fireRating || ""}
                              onChange={(e) =>
                                handleDoorSpecUpdate(
                                  asset.assetId,
                                  "fireRating",
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={asset.assetDoorSpecifications?.dbRating || ""}
                              onChange={(e) =>
                                handleDoorSpecUpdate(
                                  asset.assetId,
                                  "dbRating",
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={asset.assetDoorSpecifications?.doorFacing || ""}
                              onChange={(e) =>
                                handleDoorSpecUpdate(
                                  asset.assetId,
                                  "doorFacing",
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={asset.assetDoorSpecifications?.doorFinish || ""}
                              onChange={(e) =>
                                handleDoorSpecUpdate(
                                  asset.assetId,
                                  "doorFinish",
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={asset.assetDoorSpecifications?.visionPanel || ""}
                              onChange={(e) =>
                                handleDoorSpecUpdate(
                                  asset.assetId,
                                  "visionPanel",
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={asset.assetDoorSpecifications?.glazingSize || ""}
                              onChange={(e) =>
                                handleDoorSpecUpdate(
                                  asset.assetId,
                                  "glazingSize",
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={asset.assetDoorSpecifications?.glassType || ""}
                              onChange={(e) =>
                                handleDoorSpecUpdate(
                                  asset.assetId,
                                  "glassType",
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={asset.assetDoorSpecifications?.flushBoltCutOut || ""}
                              onChange={(e) =>
                                handleDoorSpecUpdate(
                                  asset.assetId,
                                  "flushBoltCutOut",
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={asset.assetDoorSpecifications?.lockCutOut || ""}
                              onChange={(e) =>
                                handleDoorSpecUpdate(
                                  asset.assetId,
                                  "lockCutOut",
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={asset.assetDoorSpecifications?.rebatedMS || ""}
                              onChange={(e) =>
                                handleDoorSpecUpdate(
                                  asset.assetId,
                                  "rebatedMS",
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={asset.assetDoorSpecifications?.cDCCutOut || ""}
                              onChange={(e) =>
                                handleDoorSpecUpdate(
                                  asset.assetId,
                                  "cDCCutOut",
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={asset.assetDoorSpecifications?.hingeCutOut || ""}
                              onChange={(e) =>
                                handleDoorSpecUpdate(
                                  asset.assetId,
                                  "hingeCutOut",
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={asset.assetDoorSpecifications?.hinges || ""}
                              onChange={(e) =>
                                handleDoorSpecUpdate(
                                  asset.assetId,
                                  "hinges",
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={asset.assetDoorSpecifications?.frameSection || ""}
                              onChange={(e) =>
                                handleDoorSpecUpdate(
                                  asset.assetId,
                                  "frameSection",
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={asset.assetDoorSpecifications?.stopSize || ""}
                              onChange={(e) =>
                                handleDoorSpecUpdate(
                                  asset.assetId,
                                  "stopSize",
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={asset.assetDoorSpecifications?.fourSided || ""}
                              onChange={(e) =>
                                handleDoorSpecUpdate(
                                  asset.assetId,
                                  "fourSided",
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={asset.assetDoorSpecifications?.fanLight || ""}
                              onChange={(e) =>
                                handleDoorSpecUpdate(
                                  asset.assetId,
                                  "fanLight",
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={asset.assetDoorSpecifications?.screen || ""}
                              onChange={(e) =>
                                handleDoorSpecUpdate(
                                  asset.assetId,
                                  "screen",
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={asset.assetDoorSpecifications?.architraves || ""}
                              onChange={(e) =>
                                handleDoorSpecUpdate(
                                  asset.assetId,
                                  "architraves",
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={asset.assetDoorSpecifications?.frameMaterial || ""}
                              onChange={(e) =>
                                handleDoorSpecUpdate(
                                  asset.assetId,
                                  "frameMaterial",
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={asset.assetDoorSpecifications?.frameFinish || ""}
                              onChange={(e) =>
                                handleDoorSpecUpdate(
                                  asset.assetId,
                                  "frameFinish",
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={asset.assetDoorSpecifications?.ScreenFanLightMaterial || ""}
                              onChange={(e) =>
                                handleDoorSpecUpdate(
                                  asset.assetId,
                                  "ScreenFanLightMaterial",
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={asset.assetDoorSpecifications?.doorWidth || ""}
                              onChange={(e) =>
                                handleDoorSpecUpdate(
                                  asset.assetId,
                                  "doorWidth",
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={asset.assetDoorSpecifications?.doorHeight || ""}
                              onChange={(e) =>
                                handleDoorSpecUpdate(
                                  asset.assetId,
                                  "doorHeight",
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={asset.assetDoorSpecifications?.doorDepth || ""}
                              onChange={(e) =>
                                handleDoorSpecUpdate(
                                  asset.assetId,
                                  "doorDepth",
                                  e.target.value
                                )
                              }
                            />
                          </td>
                        </tr>
                      ))}
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
                      if (window.confirm("Are you sure you want to discard all changes?")) {
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
                  Showing {selectedItems.length} of {selectedItems.length} selected assets
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

        <div className="d-flex bd-highlight">
          <div className="pt-2 bd-highlight">
            <div className="row" style={{ height: "auto" }}>
            <div className="col-md-4 col-sm-4 mt-2">
                <input
                    type="text"
                    autoComplete="off"
                    readOnly
                    onFocus={(e) => e.target.removeAttribute("readonly")}
                    name="assetName"
                className="form-control"
                value={formData?.assetName}
                placeholder="Asset No. \ Name"
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
                value={formData?.manufacturer}
                    onChange={handleInputChange}
                />
              </div>
              <div className="col-md-3 col-sm-4 mt-2">
                <select
                    name="category"
                    value={formData?.category}
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
              <div className="col-md-3 col-sm-4 mt-2" style={{ display: formData.category ? "" : "none"}}>
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
              <div className="col-md-3 col-sm-4 mt-2" style={{ display: formData.subCategory ? "" : "none"}}>
                <select
                    name="subCategory2"
                    className="form-control form-select"
                    id="subCategory2"
                    onChange={handleInputChange}
                value={formData?.subCategory2}
                >
                  <option value="">Sub Category 2</option>
                  {subCategory2List?.map((itm) => (
                      <option value={itm?.lovValue}>{itm?.lovValue}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3 col-sm-4 mt-2" style={{ display: formData.subCategory2 ? "" : "none"}}>
                <select
                    name="subCategory3"
                    className="form-control form-select"
                    id="subCategory3"
                onChange={handleInputChange}
                value={formData?.subCategory3}
                >
                  <option value="">Sub Category 3</option>
                  {subCategory3List?.map((itm) => (
                      <option value={itm?.lovValue}>{itm?.lovValue}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3 col-sm-4 mt-2">
                <select
                    name="position"
                    className="form-control form-select"
                id="position"
                value={formData.position}
                    onChange={handleInputChange}
                >
                  <option value="">Location</option>
                  {siteLayout
                    ?.filter(node =>
                      node.nodeType === "type" &&
                      (node.nodeName === "Interior" || node.nodeName === "Exterior")
                    )
                    ?.map((node) => (
                      <option key={node.id} value={node.nodeName}>
                        {node.nodeName}
                      </option>
                    ))}
                </select>
              </div>
              <div className="col-md-3 col-sm-4 mt-2" style={{ display: formData.position ? "" : "none"}}>
                <select
                    name="floor"
                    className="form-control form-select"
                id="floor"
                value={formData.floor}
                    onChange={handleInputChange}
                >
                  <option value="">Floor</option>
                  {floorNode?.map(floor => (
                    <option key={floor.id} value={floor.nodeName}>
                      {floor.nodeName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3 col-sm-4 mt-2" style={{ display: formData.floor ? "" : "none"}}>
                <select
                    name="room"
                    className="form-control form-select"
                    id="room"
                value={formData.room}
                    onChange={handleInputChange}
                >
                  <option value="">Room</option>
                  {roomNode
                    .filter(room => {
                      // Find the selected floor from the filtered floorNode
                      const selectedFloor = floorNode.find(f => f.nodeName === formData.floor);
                      // Only show rooms that belong to the selected floor
                      return selectedFloor ? room.parentNode === selectedFloor.id : false;
                    })
                    .map((room) => (
                      <option key={room.id} value={room.nodeName}>
                        {room.nodeName}
                      </option>
                    ))}
                </select>
            </div>
            <div className="col-md-2 col-sm-4 mt-2">
              <button
                className="btn btn-outline-secondary px-5 py-1"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            </div>
            </div>
          </div>
          <div className="ms-auto p-2 bd-highlight w-100">
            <div className="row" style={{ height: "auto" }}>
              <div className="col-md-2 col-sm-4 mt-2">
                <Tooltip title={`Add New Door`} arrow>
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
            {/* Add Multi-Delete Button Here */}
            <div className="col-md-3 col-sm-4 mt-2">
              <Tooltip
                title={
                  selectedItems.length === 0
                    ? "Select at least one asset to delete"
                    : `Delete ${selectedItems.length} selected assets`
                }
                arrow
              >
                <button
                  className={`btn btn-light text-danger pr-2 ${selectedItems.length === 0 ? "disabled" : ""}`}
                  onClick={handleMultiDelete}
                  disabled={selectedItems.length === 0 || isLoading}
                  style={
                    selectedItems.length === 0
                      ? { opacity: 0.6, cursor: "not-allowed" }
                      : {}
                  }
                >
                  <i className="fas fa-trash me-1"></i>
                  Delete ({selectedItems.length})
                </button>
              </Tooltip>
            </div>
              <div className="col-md-2 col-sm-4 mt-2">
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
                    // deviceId: itm?.deviceId,
                    serialNumber: itm?.serialNumber,
                    position: itm?.position || "",
                    floor: itm?.floor || "",
                    room: itm?.room || "",
                    purchaseDate: itm?.purchaseDate 
                      ? moment(itm.purchaseDate).format("DD-MM-YYYY") 
                      : "",
                    supplier: itm?.supplier || "",
                    cost: itm?.cost || "",
                    // relatedAssetId: itm?.relatedAssetId,
                    // folderId: itm?.folderId,
                    // patItem: itm?.patItem,
                    // pfpItem: itm?.pfpItem,
                    // doorItem: itm?.doorItem,
                    // barcode: itm?.barcode,
                    // New door specification fields
                    doorRef: itm?.assetDoorSpecifications?.doorRef,
                    doorSize: itm?.assetDoorSpecifications?.doorSize,
                    coreDurability: itm?.assetDoorSpecifications?.coreDurability,
                    fireRating: itm?.assetDoorSpecifications?.fireRating,
                    dbRating: itm?.assetDoorSpecifications?.dbRating,
                    doorFacing: itm?.assetDoorSpecifications?.doorFacing,
                    doorFinish: itm?.assetDoorSpecifications?.doorFinish,
                    visionPanel: itm?.assetDoorSpecifications?.visionPanel,
                    glazingSize: itm?.assetDoorSpecifications?.glazingSize,
                    glassType: itm?.assetDoorSpecifications?.glassType,
                    flushBoltCutOut: itm?.assetDoorSpecifications?.flushBoltCutOut,
                    lockCutOut: itm?.assetDoorSpecifications?.lockCutOut,
                    rebatedMS: itm?.assetDoorSpecifications?.rebatedMS,
                    cDCCutOut: itm?.assetDoorSpecifications?.cDCCutOut,
                    hingeCutOut: itm?.assetDoorSpecifications?.hingeCutOut,
                    hinges: itm?.assetDoorSpecifications?.hinges,
                    frameSection: itm?.assetDoorSpecifications?.frameSection,
                    stopSize: itm?.assetDoorSpecifications?.stopSize,
                    fourSided: itm?.assetDoorSpecifications?.fourSided,
                    fanLight: itm?.assetDoorSpecifications?.fanLight,
                    screen: itm?.assetDoorSpecifications?.screen,
                    architraves: itm?.assetDoorSpecifications?.architraves,
                    frameMaterial: itm?.assetDoorSpecifications?.frameMaterial,
                    frameFinish: itm?.assetDoorSpecifications?.frameFinish,
                    screenFanLightMaterial: itm?.assetDoorSpecifications?.ScreenFanLightMaterial,
                    doorWidth: itm?.assetDoorSpecifications?.doorWidth,
                    doorHeight: itm?.assetDoorSpecifications?.doorHeight,
                    doorDepth: itm?.assetDoorSpecifications?.doorDepth,
                  };
                })}
              >
                <Tooltip title={`Export Selected Assets`} arrow>
                  <i className="fas fa-download"></i> Export Selected
                </Tooltip>
              </CSVLink>
              </div>
              <div className="col-md-2 col-sm-4 mt-2">
                <Tooltip title={`Upload CSV to Update Assets`} arrow>
                  <input
                      type="file"
                      id="upload-csv"
                      accept=".csv"
                      style={{ display: "none" }}
                      onChange={(e) => handleFileUpload(e)}
                  />
                  <label htmlFor="upload-csv" className="btn btn-light text-primary">
                    <i className="fas fa-upload"></i> Upload CSV
                  </label>
                </Tooltip>
              </div>
              <div className="col-md-2 col-sm-4 mt-2">
                <CSVLink
                    filename={"site-door-assets.csv"}
                    className="btn btn-light bg-white text-primary"
                    data={siteDoorItems.map((itm) => {
                      return {
                        ...itm,
                        assetDoorSpecifications: Array.isArray(itm?.assetDoorSpecifications)
                            ? itm.assetDoorSpecifications.map(
                                (asset) =>
                                    `assetId: ${asset?.assetId}, depth: ${asset?.depth}, finish: ${asset?.finish}, fireRating: ${asset?.fireRating}, frameFinish: ${asset?.frameFinish}, frameMaterial: ${asset?.frameMaterial}, height: ${asset?.height}, visionPanel: ${asset?.visionPanel}, width: ${asset?.width}`
                            ).join("; ")
                            : '', // Provide empty string if not an array
                        assetPFPItem: Array.isArray(itm?.assetPFPItem)
                            ? itm.assetPFPItem.map(
                                (asset) =>
                                    `assetId: ${asset?.assetId}, product: ${asset?.product}, quantity: ${asset?.quantity}, material: ${asset?.material}, dimension: ${asset?.dimension}, service: ${asset?.service}`
                            ).join("; ")
                            : '', // Provide empty string if not an array
                        assetPATItems: Array.isArray(itm?.assetPATItems)
                            ? itm.assetPATItems.map(
                                (asset) =>
                                    `patId: ${asset?.patId}, patDate: ${asset?.patDate}, patNextDate: ${asset?.patNextDate}, patUserName: ${asset?.patUserName}`
                            ).join("; ")
                            : '', // Provide empty string if not an array
                      };
                    })}
                >
                  <Tooltip title={`Export`} arrow>
                    <i className="fas fa-download"></i>
                  </Tooltip>
                </CSVLink>
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
                    checked={selectedItems.length === filteredSiteDoorItems.length}
                  />
                </th>
                <th scope="col">Asset ID</th>
                <th scope="col">Asset Name</th>
                <th scope="col">Door Ref</th>
                <th scope="col">Door Size</th>
                <th scope="col">Fire Rating</th>
                <th scope="col">DB Rating</th>
                <th scope="col">Location</th>
                <th scope="col">Door Finish</th>
                <th scope="col">Vision Panel</th>
                <th scope="col">Frame Material</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>

            <tbody>
              {!isLoading && currentSiteAssets?.length === 0 && (
                <tr>
                  <td colSpan="12">No Result Found !!</td>
                </tr>
              )}
              {isLoading && (
                <tr>
                  <td colSpan="12">Loading...</td>
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
                  <th scope="col">{asset?.assetDoorSpecifications?.doorRef}</th>
                  <th scope="col">{asset?.assetDoorSpecifications?.doorSize}</th>
                  <th scope="col">{asset?.assetDoorSpecifications?.fireRating}</th>
                  <th scope="col">{asset?.assetDoorSpecifications?.dbRating}</th>
                  <th scope="col">{asset?.location}</th>
                  <th scope="col">{asset?.assetDoorSpecifications?.doorFinish}</th>
                  <th scope="col">{asset?.assetDoorSpecifications?.visionPanel}</th>
                  <th scope="col">{asset?.assetDoorSpecifications?.frameMaterial}</th>
                  <th scope="col">
                    {/* Actions remain the same */}
                    <Tooltip title={`View ${asset.assetName}`} arrow>
                      <button
                        className="btn btn-sm btn-light"
                        onClick={() => {
                          goTo(`/view-asset?assetId=${asset?.assetId}`);
                        }}
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                    </Tooltip>
                    <Tooltip title={`Edit ${asset.assetName}`} arrow>
                      <button
                        className="btn btn-sm btn-light"
                        onClick={() => {
                          goTo(`/update-asset?assetId=${asset?.assetId}`);
                        }}
                      >
                        <i className="fas fa-pen"></i>
                      </button>
                    </Tooltip>
                    <Tooltip title={`View QR code for ${asset.assetName}`} arrow>
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
                      </button>
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
                  filteredSiteDoorItems.length / preActionsPerPage
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
  siteDoorItems: state.site.siteDoorItems,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
  siteLayout: state.site.siteLayout,
});
export default connect(mapStateToProps, { getSiteDoorAssets, deleteSiteAsset, getSiteLayout })(
    Door
);