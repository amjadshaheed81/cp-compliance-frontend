import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import { CSVLink } from "react-csv";
import moment from "moment";
import Header from "../../../common/Header/Header";
import BreadCrumHeader from "../../../common/BreadCrumHeader/BreadCrumHeader";
import SidebarNew from "../../../common/Sidebar/SidebarNew";
import Tooltip from "@mui/material/Tooltip";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import siteDummy from "../../../../images/site-dummy.png";

const ViewCreatePreActions = ({}) => {
  return (
    <Fragment>
      <SidebarNew />
      <div className="content">
        <Header />
        <div className="container-fluid">
          <BreadCrumHeader
            header={"Update/View Pre Actions"}
            page={"Pre-Action / View"}
          />
          {/*  */}
          {/*  */}
          {/* row start*/}
          <div className="row">
            <div className="col-md-8">
              <div className="row">
                <div className="col-md-6">
                  <label for="userType">Internal/External</label>
                  <select
                    name="userType"
                    className="form-control form-select"
                    id="userType"
                  >
                    <option value="">Select Internal/External</option>
                    <option value="Internal">Internal</option>
                    <option value="External">External</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <div className="form-group mt-2">
                    <label for="floor">Floor</label>
                    <select
                      name="floor"
                      className="form-control form-select"
                      id="floor"
                    >
                      <option value="">Select Floor</option>
                    </select>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-group mt-2">
                    <label for="room">Room</label>
                    <select
                      name="room"
                      className="form-control form-select"
                      id="room"
                    >
                      <option value="">Select Room</option>
                    </select>
                  </div>
                </div>

                <div className="col-md-6">
                <div className="form-group mt-2">
                    <label for="status">Status</label>
                    <select
                      name="status"
                      className="form-control form-select"
                      id="status"
                    >
                      <option value="">Select Status</option>
                    </select>
                  </div>
                </div>

                <div className="col-md-12">
                  <div className="form-group mt-2 w-50">
                    <label for="taggedAsset">Tagger Asset</label>
                    <input
                      type="text"
                      className="form-control"
                      id="taggedAsset"
                      name="taggedAsset"
                      placeholder=""
                    />
                  </div>
                </div>

                <div className="col-md-12">
                  <div className="form-group mt-2">
                    <textarea className="form-control form-text" placeholder="Enter Notes..."></textarea>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <img src={siteDummy} className="img img-responsive" />
            </div>
            <div className="col-md-12 p-4">
              <div className="float-end">
                <button type="button" className="btn btn-light mb-3 mr-4">
                  Close
                </button>
                &nbsp; &nbsp;
                <button type="submit" className="btn btn-primary mb-3 mr-4">
                  Save
                </button>
              </div>
            </div>
          </div>

          {/* row end*/}
        </div>
      </div>
    </Fragment>
  );
};
const mapStateToProps = () => ({});
export default connect(mapStateToProps, {})(ViewCreatePreActions);
