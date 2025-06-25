import React from 'react';

const MultiEditModal = ({
                            showModal,
                            setShowModal,
                            selectedItems,
                            setSelectedItems,
                            categoryOptions,
                            subCategoryOptions,
                            subCategory2Options,
                            subCategory3Options,
                            floorOptions,
                            roomOptions,
                            onSave,
                            isLoading,
                            title = "Edit Multiple Assets"
                        }) => {
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

    return (
        <div
            className="modal fade show"
            style={{ display: showModal ? "block" : "none", backgroundColor: "rgba(86, 86, 86, 0.2)" }}
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
                            {title} ({selectedItems.length} selected)
                        </h5>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={() => setShowModal(false)}
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
                                    <th style={{ width: "200px", minWidth: "200px" }}>
                                        Power Output (KW)
                                    </th>
                                </tr>
                                </thead>
                                <tbody style={{ overflowY: "auto" }}>
                                {selectedItems.map((asset) => {
                                    const subCategoryList = subCategoryOptions?.filter(
                                        (itm) => itm.attribite1 === asset.category
                                    ) || [];
                                    const subCategory2List = subCategory2Options?.filter(
                                        (itm) => itm.attribite1 === asset.subCategory
                                    ) || [];
                                    const subCategory3List = subCategory3Options?.filter(
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
                                                    {categoryOptions?.map((opt) => (
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
                                                    {subCategoryList.map((opt) => (
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
                                                    {subCategory2List.map((opt) => (
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
                                                    {subCategory3List.map((opt) => (
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
                                                    {floorOptions?.map((node) => (
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
                                                    {roomOptions
                                                        ?.filter(
                                                            (node) =>
                                                                node.parentNode ===
                                                                floorOptions.find(
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
                                        setShowModal(false);
                                    }
                                }}
                                disabled={isLoading}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={onSave}
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
    );
};

export default MultiEditModal;