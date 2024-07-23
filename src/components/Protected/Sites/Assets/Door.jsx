import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import { CSVLink } from "react-csv";
import Tooltip from "@mui/material/Tooltip";
import { QRCodeSVG } from "qrcode.react";
import {
  deleteSiteAsset,
  getSiteDoorAssets,
} from "../../../../store/thunk/site";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { get } from "../../../../api";
import ShowQRCode from "./ShowQRCode";
import ShowCloneModal from "./ShowCloneModal";
import Pagination from "../../../common/Pagination/Pagination";

const Door = ({
  siteDoorItems,
  siteSelectedForGlobal,
  getSiteDoorAssets,
  deleteSiteAsset,
}) => {
  const [filteredSiteDoorItems, setFilteredSiteDoorItems] = useState([]);
  const [siteAssetsList, setSiteAssetsList] = useState([]);
  const [category, setCategory] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState({});
  const [selectedAssetForClone, setSelectedAssetForClone] = useState({});
  const [showCloneModal, setShowCloneModal] = useState(false);
  const navigate = useNavigate();
  const [preActionsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const indexOfLastPreAction = currentPage * preActionsPerPage;
  const indexOfFirstPreAction = indexOfLastPreAction - preActionsPerPage;
  const currentSiteAssets = filteredSiteDoorItems.slice(
    indexOfFirstPreAction,
    indexOfLastPreAction
  );
  const locationFilter = siteAssetsList.map((itm) => {
    return { location: itm.location };
  }).filter((obj1, i, arr) => 
    arr.findIndex(obj2 => (obj2.location === obj1.location)) === i
  );
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };
  const goTo = (link) => {
    navigate(link);
  };

  useEffect(() => {
    if (siteDoorItems) {
      setFilteredSiteDoorItems(siteDoorItems?.map((itm) => {
        return { ...itm, location: `${itm?.position} > ${itm?.floor} > ${itm?.room}` };
      }));
      setSiteAssetsList(siteDoorItems?.map((itm) => {
        return { ...itm, location: `${itm?.position} > ${itm?.floor} > ${itm?.room}` };
      }));
    }
  }, [siteDoorItems]);

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
      const list = siteAssetsList?.filter(
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
      setFilteredSiteDoorItems(list);
    } else {
      setFilteredSiteDoorItems(siteAssetsList);
    }
  };

  useEffect(() => {
    getSiteDoorAssets(siteSelectedForGlobal?.siteId);
    getCategory();
  }, [siteSelectedForGlobal]);

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
            `${itm?.assetName} site asset has been deleted successfully`
          );
          getSiteDoorAssets(siteSelectedForGlobal?.siteId);
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
      setSelectedItems(filteredSiteDoorItems);
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
            getSiteDoorAssets(siteSelectedForGlobal?.siteId);
          }}
        />
      )}
      <div className="d-flex bd-highlight">
        <div className="pt-2 bd-highlight">
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
                {locationFilter.map((site) => (
                  <option value={site.location}>{site.location}</option>
                ))}
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
                filename={"site-door-assets"}
                className="btn btn-light bg-white text-primary"
                data={siteDoorItems}
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
                      selectedItems.length === filteredSiteDoorItems.length
                    }
                  />
                </th>
                <th scope="col">Asset Name</th>
                <th scope="col">Door Size</th>
                <th scope="col">Fire Rating</th>
                <th scope="col">Location</th>
                <th scope="col">Door Finish</th>
                <th scope="col">Vision Panel</th>
                <th scope="col">Frame</th>
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
                  <th scope="col">
                    {asset?.assetDoorSpecifications?.width} *{" "}
                    {asset?.assetDoorSpecifications?.height}
                  </th>
                  <th scope="col">
                    {asset?.assetDoorSpecifications?.fireRating}
                  </th>
                  <th scope="col">
                    {asset?.location}
                  </th>
                  <th scope="col">
                    {asset?.assetDoorSpecifications?.frameFinish}
                  </th>
                  <th scope="col">
                    {asset?.assetDoorSpecifications?.visionPanel}
                  </th>
                  <th scope="col">
                    {asset?.assetDoorSpecifications?.frameMaterial}
                  </th>
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
});
export default connect(mapStateToProps, { getSiteDoorAssets, deleteSiteAsset })(
  Door
);
