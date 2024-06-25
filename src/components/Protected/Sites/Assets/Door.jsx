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

const Door = ({
  siteDoorItems,
  siteSelectedForGlobal,
  getSiteDoorAssets,
  deleteSiteAsset,
}) => {
  useEffect(() => {
    getSiteDoorAssets(siteSelectedForGlobal?.siteId);
  }, []);
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
  return (
    <Fragment>
      <div className="d-flex bd-highlight">
        <div className="pt-2 bd-highlight ">
          <div className="row" style={{ height: "auto" }}>
            <div className="col">
              <input
                type="text"
                name="assetName"
                className="form-control"
                placeholder="Asset Name"
              />
            </div>
            <div className="col">
              <input
                type="text"
                name="manufacturer"
                className="form-control"
                placeholder="Manufacturer"
              />
            </div>
            <div className="col">
              <select
                name="category"
                className="form-control form-select"
                id="category"
              >
                <option value="">Category</option>
              </select>
            </div>
            <div className="col">
              <select
                name="location"
                className="form-control form-select"
                id="location"
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
                  onClick={() => {}}
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
      <div className="row p-2"></div>
      <div className="col-md-12 table-responsive">
        <table className="table">
          <thead className="table-dark">
            <tr>
              <th scope="col">
                <input type="checkbox" />
                &nbsp;Asset Name
              </th>
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
            {siteDoorItems?.length === 0 && (
              <tr>
                <td>No Result Found !!</td>
              </tr>
            )}
            {siteDoorItems?.map((asset) => (
              <tr key={asset?.id}>
                <th scope="col">
                  <input type="checkbox" />
                  &nbsp;{asset?.assetName}
                </th>
                <th scope="col">{asset?.doorSize}</th>
                <th scope="col">{asset?.fireRating}</th>
                <th scope="col">{asset?.location}</th>
                <th scope="col">{asset?.doorFinish}</th>
                <th scope="col">{asset?.visionPanel}</th>
                <th scope="col">{asset?.frame}</th>
                <th scope="col">
                  <Tooltip title={`View ${asset.assetName}`} arrow>
                    <button className="btn btn-sm btn-light" onClick={() => {}}>
                      <i className="fas fa-eye"></i>
                    </button>{" "}
                  </Tooltip>
                  <Tooltip title={`Edit ${asset.assetName}`} arrow>
                    <QRCodeSVG
                      value="https://reactjs.org/"
                      style={{
                        height: "30px",
                        width: "30px",
                        margin: "0px 6px",
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
