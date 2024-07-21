import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import { CSVLink } from "react-csv";
import Tooltip from "@mui/material/Tooltip";
import { QRCodeSVG } from "qrcode.react";
import {
  deleteSiteAsset,
  getSitePFPAssets,
} from "../../../../store/thunk/site";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { get } from "../../../../api";
import ShowQRCode from "./ShowQRCode";
import ShowCloneModal from "./ShowCloneModal";
import Pagination from "../../../common/Pagination/Pagination";

const PassiveFireProtection = ({
  sitePFPItems,
  siteSelectedForGlobal,
  deleteSiteAsset,
  getSitePFPAssets,
}) => {
  const [filteredSitePFPItems, setfilteredSitePFPItems] = useState([]);
  const [category, setCategory] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState({});
  const [selectedAssetForClone, setSelectedAssetForClone] = useState({});
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [preActionsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const indexOfLastPreAction = currentPage * preActionsPerPage;
  const indexOfFirstPreAction = indexOfLastPreAction - preActionsPerPage;
  const currentSiteAssets = filteredSitePFPItems.slice(
    indexOfFirstPreAction,
    indexOfLastPreAction
  );
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };
  useEffect(() => {
    if (sitePFPItems) {
      setfilteredSitePFPItems(sitePFPItems);
    }
  }, [sitePFPItems]);
  const [formData, setFormData] = useState({
    assetName: "",
    manufacturer: "",
    category: "",
    location: "",
  });
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  useEffect(() => {
    searchAssets();
  }, [
    formData.assetName,
    formData.category,
    formData.location,
    formData.manufacturer,
  ]);
  const searchAssets = () => {
    const assetName = formData?.assetName;
    const category = formData?.category;
    const location = formData?.location;
    const manufacturer = formData?.manufacturer;
    if (assetName || category || location || manufacturer) {
      const list = sitePFPItems?.filter(
        (x) =>
          String(x?.assetName)
            .toLowerCase()
            .includes(String(assetName).toLowerCase()) &&
          String(x?.category)
            .toLowerCase()
            .includes(String(category).toLowerCase()) &&
          String(x?.location)
            .toLowerCase()
            .includes(String(location).toLowerCase()) &&
          String(x?.manufacturer)
            .toLowerCase()
            .includes(String(manufacturer).toLowerCase())
      );
      setfilteredSitePFPItems(list);
    } else {
      setfilteredSitePFPItems(sitePFPItems);
    }
  };
  const navigate = useNavigate();
  const goTo = (link) => {
    navigate(link);
  };
  useEffect(() => {
    getSitePFPAssets(siteSelectedForGlobal?.siteId);
    getCategory();
  }, []);
  const getCategory = async () => {
    const category = await get("/api/lov/ASSET_CATEGORY");
    setCategory(category);
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
          getSitePFPAssets(siteSelectedForGlobal?.siteId);
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
      setSelectedItems(filteredSitePFPItems);
    } else {
      setSelectedItems([]);
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
            getSitePFPAssets(siteSelectedForGlobal?.siteId);
          }}
        />
      )}
      <div className="d-flex bd-highlight">
        <div className="pt-2 bd-highlight ">
          <div className="row" style={{ height: "auto" }}>
            <div className="col">
              <input
                type="text"
                name="assetName"
                className="form-control"
                placeholder="Asset Name"
                onChange={handleInputChange}
              />
            </div>
            <div className="col">
              <input
                type="text"
                name="manufacturer"
                className="form-control"
                placeholder="Manufacturer"
                onChange={handleInputChange}
              />
            </div>
            <div className="col">
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
            <div className="col">
              <select
                name="location"
                className="form-control form-select"
                id="location"
                onChange={handleInputChange}
              >
                <option value="">Location</option>
              </select>
            </div>
          </div>
        </div>
        <div className="ms-auto p-2 bd-highlight">
          <div className="row" style={{ height: "auto" }}>
            <div className="col">
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
            <div className="col">
              <CSVLink
                filename={"site-pfp-item-list"}
                className="btn btn-light bg-white text-primary"
                data={sitePFPItems}
              >
                <Tooltip title={`Export`} arrow>
                  <i className="fas fa-download"></i>
                </Tooltip>
              </CSVLink>
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
                    disabled
                    onChange={handleSelectAllChange}
                    className="form-check-input"
                    checked={
                      selectedItems.length === filteredSitePFPItems.length
                    }
                  />
                </th>
                <th scope="col">Asset Name</th>
                <th scope="col">Material</th>
                <th scope="col">Product</th>
                <th scope="col">Location</th>
                <th scope="col">Service</th>
                <th scope="col">Dim</th>
                <th scope="col">Qty</th>
                <th scope="col">Area</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentSiteAssets?.length === 0 && (
                <tr>
                  <td>No Result Found !!</td>
                </tr>
              )}
              {currentSiteAssets?.map((asset) => (
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
                  <th scope="col">{asset?.assetName}</th>
                  <th scope="col">{asset?.assetPFPItem?.material}</th>
                  <th scope="col">{asset?.assetPFPItem?.product}</th>
                  <th scope="col">
                    {asset.position ? `${asset.position}` : ""}
                    {asset.floor ? ` > ${asset.floor}` : ""}
                    {asset.room ? ` > ${asset.room}` : ""}
                  </th>
                  <th scope="col">{asset?.assetPFPItem?.service}</th>
                  <th scope="col">{asset?.assetPFPItem?.dimension}</th>
                  <th scope="col">{asset?.assetPFPItem?.quantity}</th>
                  <th scope="col">{asset?.assetPFPItem?.area}</th>
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
                      title={`View QR code for ${asset.assetName}`}
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
      <div className="row">
        <Pagination
          totalPages={Math.ceil(
            filteredSitePFPItems.length / preActionsPerPage
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
  sitePFPItems: state.site.sitePFPItems,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
});
export default connect(mapStateToProps, { deleteSiteAsset, getSitePFPAssets })(
  PassiveFireProtection
);
