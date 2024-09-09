import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import { useNavigate } from "react-router-dom";
import { CSVLink } from "react-csv";
import Tooltip from "@mui/material/Tooltip";
import { getSiteAssets, getSiteLayout } from "../../../../store/thunk/site";
import Pagination from "../../../common/Pagination/Pagination";
import { isManagerAdminLogin } from "../../../../utils/isManagerAdminLogin";
import { getCategoryLabelValue } from "../../../../utils/getCategoryLabelValue";
import { calculateLastPageIndex } from "../../../../utils/calculateSearchedPageNumber";
import { get } from "../../../../api";

const Summary = ({
  siteAssets,
  getSiteAssets,
  siteSelectedForGlobal,
  loggedInUserData,
  getSiteLayout,
  siteLayout,
}) => {
  const [filteredSiteAssets, setFilteredSiteAssets] = useState([]);
  const [siteAssetsList, setSiteAssetsList] = useState([]);
  const [category, setCategory] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [preActionsPerPage] = useState(7);
  const [currentPage, setCurrentPage] = useState(1);
  const [floorNode, setFloorNode] = useState([]);
  const [roomNode, setRoomNode] = useState([]);
  const indexOfLastPreAction = currentPage * preActionsPerPage;
  const indexOfFirstPreAction = indexOfLastPreAction - preActionsPerPage;
  const currentSiteAssets = filteredSiteAssets
    ?.filter((itm) => itm?.doorItem !== true && itm?.patItem !== true)
    .slice(indexOfFirstPreAction, indexOfLastPreAction);
  const locationFilter = siteAssetsList
    .map((itm) => {
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
    getSiteAssets(siteSelectedForGlobal?.siteId);
    getCategory();
    getSiteLayout(siteSelectedForGlobal?.siteId);
  }, [siteSelectedForGlobal]);
  useEffect(() => {
    const floorNodes =
      siteLayout?.filter((itm) => itm?.nodeType === "floor") || [];
    const roomNodes =
      siteLayout?.filter((itm) => itm?.nodeType === "room") || [];
    setFloorNode(floorNodes);
    setRoomNode(roomNodes);
  }, [siteLayout]);
  const getCategory = async () => {
    const category = await get("/api/lov/ASSET_CATEGORY");
    setCategory(category);
  };
  useEffect(() => {
    if (siteAssets) {
      setFilteredSiteAssets(
        siteAssets?.map((itm) => {
          return {
            ...itm,
            location: `${itm?.position || "NA"} > ${itm?.floor || "NA"} > ${
              itm?.room || "NA"
            }`,
          };
        })
      );
      setSiteAssetsList(
        siteAssets?.map((itm) => {
          return {
            ...itm,
            location: `${itm?.position || "NA"} > ${itm?.floor || "NA"} > ${
              itm?.room || "NA"
            }`,
          };
        })
      );
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
  };
  useEffect(() => {
    searchAssets();
  }, [
    formData.assetName,
    formData.category,
    formData.location,
    formData.manufacturer,
    formData.floor,
    formData.room,
  ]);
  const searchAssets = () => {
    const assetName = formData?.assetName;
    const category = formData?.category;
    const location = formData?.location;
    const manufacturer = formData?.manufacturer;
    const floor = formData?.floor;
    const room = formData?.room;
    if (assetName || category || location || manufacturer || floor || room) {
      const list = siteAssetsList?.filter(
        (x) =>
          String(x?.assetName)
            .toLowerCase()
            .includes(String(assetName).toLowerCase()) &&
          String(x?.category)
            .toLowerCase()
            .includes(String(category).toLowerCase()) &&
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
      setCurrentPage(calculateLastPageIndex(list?.length, preActionsPerPage));
      setFilteredSiteAssets(list);
    } else {
      setFilteredSiteAssets(siteAssetsList);
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
  return (
    <Fragment>
      <div className="d-flex bd-highlight">
        <div className="pt-2 bd-highlight ">
          <div className="row" style={{ height: "auto" }}>
            <div className="col-md-4 col-sm-4 mt-2">
              <input
                type="text"
                name="assetName"
                className="form-control"
                placeholder="Asset Name"
                onChange={handleInputChange}
              />
            </div>
            <div className="col-md-4 col-sm-4 mt-2">
              <input
                type="text"
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
            <div className="col-md-4 col-sm-4 mt-2">
              <select
                name="location"
                className="form-control form-select"
                id="location"
                onChange={handleInputChange}
              >
                <option value="">Location</option>
                <option value="External">External</option>
                <option value="Internal">Internal</option>
                {/* {locationFilter.map((site) => (
                  <option value={site.location}>{site.location}</option>
                ))} */}
              </select>
            </div>
            <div className="col-md-4 col-sm-4 mt-2">
              <select
                name="floor"
                className="form-control form-select"
                id="floor"
                onChange={handleInputChange}
              >
                <option value="">Floor</option>
                {floorNode?.map((itm) => (
                  <option value={itm?.nodeName}>{itm?.nodeName}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4 col-sm-4 mt-2">
              <select
                name="room"
                className="form-control form-select"
                id="room"
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
          <div className="ms-auto p-2 bd-highlight">
            <div className="row" style={{ height: "auto" }}>
              <div className="col-md-2 col-sm-4 mt-2">
                <CSVLink
                  filename={"site-assets-lists.csv"}
                  className="btn btn-light bg-white text-primary"
                  data={filteredSiteAssets
                    ?.filter(
                      (itm) => itm?.doorItem !== true && itm?.patItem !== true
                    )
                    .map((itm) => {
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
              {currentSiteAssets?.length === 0 && (
                <tr>
                  <td>No Result Found !!</td>
                </tr>
              )}
              {currentSiteAssets?.map((asset) => (
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
  getSiteAssets,
  getSiteLayout,
})(Summary);
