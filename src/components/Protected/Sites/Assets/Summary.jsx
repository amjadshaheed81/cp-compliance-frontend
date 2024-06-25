import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import { useNavigate } from "react-router-dom";
import { CSVLink } from "react-csv";
import Tooltip from "@mui/material/Tooltip";
import { QRCodeSVG } from "qrcode.react";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { deleteSiteAsset, getSiteAssets } from "../../../../store/thunk/site";

const Summary = ({
  siteAssets,
  deleteSiteAsset,
  getSiteAssets,
  siteSelectedForGlobal,
}) => {
  useEffect(() => {
    getSiteAssets(siteSelectedForGlobal?.siteId);
  }, []);
  const navigate = useNavigate();
  const goTo = (link) => {
    navigate(link);
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
              &nbsp;
            </div>
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
                filename={"site-assets-lists"}
                className="btn btn-light bg-white text-primary"
                data={siteAssets}
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
              <th scope="col">Manufacturer</th>
              <th scope="col">Category</th>
              <th scope="col">Location</th>
              <th scope="col">Passive Fire Sch</th>
              <th scope="col">PAT Item</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {siteAssets?.length === 0 && (
              <tr>
                <td>No Result Found !!</td>
              </tr>
            )}
            {siteAssets?.map((asset) => (
              <tr key={asset?.assetId}>
                <th scope="col">
                  <input type="checkbox" />
                  &nbsp;{asset?.assetName}
                </th>
                <th scope="col">{asset?.manufacturer}</th>
                <th scope="col">{asset?.category}</th>
                <th scope="col">{asset?.location}</th>
                <th scope="col">{asset?.passiveFireSch ? "YES" : "NO"}</th>
                <th scope="col">{asset?.patItem ? "YES" : "NO"}</th>
                <th scope="col">
                  <Tooltip title={`View ${asset.assetName}`} arrow>
                    <button className="btn btn-sm btn-light" onClick={() => {
                      goTo(`/update-asset?assetId=${asset?.assetId}`)
                    }}>
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
  siteAssets: state.site.siteAssets,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
});
export default connect(mapStateToProps, { deleteSiteAsset, getSiteAssets })(
  Summary
);
