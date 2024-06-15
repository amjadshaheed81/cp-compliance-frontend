import React, { Fragment, useState } from "react";
import { connect } from "react-redux";
import { CSVLink } from "react-csv";
import Tooltip from "@mui/material/Tooltip";
import { QRCodeSVG } from "qrcode.react";

const Summary = ({}) => {
  const [assetList, setAssetList] = useState([
    {
      assetName: "Joe Bloggs",
      manufacturer: "joe@gmai.com",
      category: "Site 1",
      location: "Property Manager",
      passiveFireSch: "21/May/1992",
      patItem: "type",
      id: 1,
    },
  ]);
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
              <button
                className="btn btn-primary text-white pr-2"
                onClick={() => {}}
              >
                Add New Asset
              </button>
              &nbsp;
            </div>
            <div className="col">
              <button
                className="btn btn-light text-primary pr-2"
                onClick={() => {}}
              >
                Clone
              </button>
            </div>
            <div className="col">
              <CSVLink
                filename={"site-lists"}
                className="btn btn-light bg-white text-primary"
                data={[]}
              >
                <i className="fas fa-download"></i>&nbsp;
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
            {assetList?.map((asset) => (
              <tr key={asset?.id}>
                <th scope="col">
                  <input type="checkbox" />
                  &nbsp;{asset?.assetName}
                </th>
                <th scope="col">{asset?.manufacturer}</th>
                <th scope="col">{asset?.category}</th>
                <th scope="col">{asset?.location}</th>
                <th scope="col">{asset?.passiveFireSch}</th>
                <th scope="col">{asset?.patItem}</th>
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
                      onClick={() => {}}
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

const mapStateToProps = () => ({});
export default connect(mapStateToProps, {})(Summary);
