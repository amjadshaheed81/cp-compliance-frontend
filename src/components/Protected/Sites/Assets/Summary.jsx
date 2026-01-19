import React, { Fragment, useEffect, useMemo, useState, useRef } from "react";
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
import { del, get, put } from "../../../../api";
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
    const prevSiteIdRef = useRef(siteSelectedForGlobal?.siteId || null);

    const [formData, setFormData] = useState(() => {
        const savedFilters = localStorage.getItem('assetFilters');

        if (savedFilters) {
            try {
                return JSON.parse(savedFilters);
            } catch (error) {
                console.error('Error parsing saved filters:', error);
                localStorage.removeItem('assetFilters');
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
            location: searchParams.get('location') || "",
            floor: searchParams.get('floor') || "",
            room: searchParams.get('room') || "",
            powerOutput: searchParams.get('powerOutput') || "",
        };
    });
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
    }, [siteSelectedForGlobal?.siteId]);


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
                    location: "",
                    floor: "",
                    room: "",
                    powerOutput: "",
                };

                setFormData(emptyFilters);

                localStorage.removeItem('assetFilters');

                window.history.replaceState({}, '', window.location.pathname);

                setCurrentPage(1);
            }
        }

        if (currentSiteId) {
            prevSiteIdRef.current = currentSiteId;
        }
    }, [siteSelectedForGlobal?.siteId]);



    useEffect(() => {
        if (!siteLayout) return;

        // Handle URL parameter for room selection
        const queryParams = new URLSearchParams(location.search);
        const label = queryParams.get("roomLabel");

        if (label) {
            const roomNumber = label; // Extract the part after '-'
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
                location: `${itm?.position || "NA"} > ${itm?.floor || "NA"} > ${itm?.room || "NA"}`,
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


    // Update URL when filters change
    // Save filters to localStorage when they change
    useEffect(() => {
        const searchParams = new URLSearchParams();

        Object.entries(formData).forEach(([key, value]) => {
            if (value) {
                searchParams.set(key, value);
            }
        });

        // Save filters to localStorage and update URL
        localStorage.setItem('assetFilters', JSON.stringify(formData));
        navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
    }, [formData, location.pathname, navigate]);


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
        localStorage.setItem('assetFilters', JSON.stringify(formData));
    }, [formData]);

    // Load filters when component mounts
    useEffect(() => {
        const savedFilters = localStorage.getItem('assetFilters');
        if (savedFilters) {
            try {
                const parsedFilters = JSON.parse(savedFilters);
                setFormData(parsedFilters);

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
                localStorage.removeItem('assetFilters');
            }
        }
    }, []);


    useEffect(() => {
        if (formData?.category && subCategory?.length > 0) {
            const filtered = subCategory.filter((itm) => itm?.attribite1 === formData.category);
            setSubCategoryList(filtered || []);
        }

        if (formData?.subCategory && subCategory2?.length > 0) {
            const filtered2 = subCategory2.filter((itm) => itm?.attribite1 === formData.subCategory);
            setSubCategory2List(filtered2 || []);
        }

        if (formData?.subCategory2 && subCategory3?.length > 0) {
            const filtered3 = subCategory3.filter((itm) => itm?.attribite1 === formData.subCategory2);
            setSubCategory3List(filtered3 || []);
        }

        // Populate floors/rooms based on selected position/floor and available siteLayout
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
    }, [subCategory, subCategory2, subCategory3, siteLayout, formData?.category, formData?.subCategory, formData?.subCategory2, formData?.position, formData?.floor]);


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
            powerOutput: "",
        };

        setFormData(emptyFilters);
        setFloorNode([]);  // Clear floors
        setRoomNode([]);   // Clear rooms
        localStorage.setItem('assetFilters', JSON.stringify(emptyFilters));
        navigate(location.pathname);
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
            room,
            powerOutput
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

        if (powerOutput) {
            filtered = filtered.filter(x =>
                String(x?.powerOutput || '').toLowerCase().includes(powerOutput.toLowerCase())
            );
        }

        setCurrentPage(1);
        setFilteredSiteAssets(filtered);
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
        formData.powerOutput
    ]);


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

                        // Refresh the assets list
                        getSiteAssets(siteSelectedForGlobal?.siteId);
                        window.location.reload();

                        // Clear selection
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

    const cloneSelectedAsset = () => {
        if (selectedItems?.length === 0) {
            toast.warn("Please select asset to clone.");
        } else if (selectedItems?.length > 1) {
            toast.warn("Please select only one asset.");
        } else {
            setSelectedAssetForClone(selectedItems[0]);
            setShowCloneModal(true);
            getSiteAssets(siteSelectedForGlobal?.siteId);
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


    //Multi Asset edit handlers
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
                    powerOutput: item.powerOutput,
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
                getSiteAssets(siteSelectedForGlobal?.siteId);

                // Reset selection and close modal
                setSelectedItems([]);
                setShowMultiEditModal(false);
                getSiteAssets(siteSelectedForGlobal?.siteId);
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
                                            <th style={{ width: "400px", minWidth: "400px" }}>
                                                Asset Name
                                            </th>
                                            <th style={{ width: "50px", minWidth: "50px" }}>
                                                Manufacturer
                                            </th>
                                            <th style={{ width: "50px", minWidth: "50px" }}>
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
                                            <th style={{ width: "100px", minWidth: "100px" }}>
                                                Position
                                            </th>
                                            <th style={{ width: "200px", minWidth: "200px" }}>
                                                Floor
                                            </th>
                                            <th style={{ width: "200px", minWidth: "200px" }}>
                                                Room
                                            </th>
                                            <th style={{ width: "50px", minWidth: "50px" }}>
                                                Power Output (KW)
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
                                                    <td style={{ width: "300px", minWidth: "300px" }}>
                                                        <input
                                                            type="text"
                                                            className="form-control form-control-sm"
                                                            value={asset.powerOutput || ""}
                                                            onChange={(e) =>
                                                                handleFieldUpdate(
                                                                    asset.assetId,
                                                                    "powerOutput",
                                                                    e.target.value
                                                                )
                                                            }
                                                        />
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
                                placeholder="Asset Name | Asset Id"
                                value={formData?.assetName}
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
                                value={formData?.manufacturer}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="col-md-4 col-sm-4 mt-2">
                            <select
                                name="category"
                                className="form-control form-select"
                                id="category"
                                onChange={handleInputChange}
                                value={formData?.category}
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
                                name="position"
                                className="form-control form-select"
                                id="position"
                                onChange={handleInputChange}
                                value={formData?.position}
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
                        <div
                            className="col-md-4 col-sm-4 mt-2"
                            style={{ display: formData?.position?.length > 0 ? "" : "none" }}
                        >
                            <select
                                name="floor"
                                className="form-control form-select"
                                id="floor"
                                onChange={handleInputChange}
                                value={formData?.floor}
                            >
                                <option value="">Floor</option>
                                {floorNode?.map((floor) => (
                                    <option key={floor.id} value={floor.nodeName}>
                                        {floor.nodeName}
                                    </option>
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
                                        className={`btn btn-light text-primary pr-2 ${selectedItems.length < 2 ? "disabled" : ""
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