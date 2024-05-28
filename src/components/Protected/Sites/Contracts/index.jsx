import React, { Fragment } from "react";
import { connect } from "react-redux";
import { CSVLink } from "react-csv";
import Header from "../../../common/Header/Header";
import BreadCrumHeader from "../../../common/BreadCrumHeader/BreadCrumHeader";
import SidebarNew from "../../../common/Sidebar/SidebarNew";

const Sites = () => {
  return (
    <Fragment>
      {/* <Sidebar /> */}
      <SidebarNew />
      <div class="content">
        <Header />
        <div class="container-fluid">
          <BreadCrumHeader header={"Contracts"} page={"Contracs"} />
          {/*  */}
          {/*  */}
          <div class="d-flex bd-highlight">
            <div class="pt-2 bd-highlight ">
              <div class="row">
                <div class="col">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Project"
                    name="project"
                  />
                </div>
                <div class="col">
                  <select
                    name="startMonth"
                    className="form-control form-select"
                    id="startMonth"
                  >
                    <option value="" selected disabled>
                      Start Month
                    </option>
                  </select>
                </div>
                <div class="col">
                  <select
                    name="site"
                    className="form-control form-select"
                    id="site"
                  >
                    <option value="" selected disabled>
                      Site
                    </option>
                  </select>
                </div>
                <div className="col">
                  <CSVLink
                    filename={"site-lists"}
                    className="btn btn-light bg-white text-primary"
                    data={[]}
                  >
                    <i class="fas fa-download"></i>&nbsp;Export
                  </CSVLink>
                </div>
              </div>
            </div>
          </div>
          {/* row start*/}
          <div className="row p-2"></div>
          <div className="col-md-12">
            <table class="table">
              <thead class="table-dark">
                <tr>
                  <th scope="col">Project Summary</th>
                  <th scope="col">Site</th>
                  <th scope="col">Manager</th>
                  <th scope="col">Start Date</th>
                  <th scope="col">Recieved Date</th>
                  <th scope="col">Quota (GBP)</th>
                  <th scope="col">Quota Date</th>
                  <th scope="col">Status</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Project to install something</td>
                  <td>Bradford BD1 1EE</td>
                  <td>Malcolm B</td>
                  <td>dd/mm/yyyy</td>
                  <td>dd/mm/yyyy</td>
                  <td>1200</td>
                  <td>dd/mm/yyyy</td>
                  <td>
                    <div
                      class="bg-warning text-light rounded-1 p-1"
                      role="alert"
                    >
                      Recieved
                    </div>
                  </td>
                  <td>
                    <span style={{ color: "gray" }}>
                      <i class="fas fa-eye"></i>
                    </span>
                    &nbsp;
                    <span style={{ color: "gray" }} title="Official Quota">
                      <i class="fas fa-solid fa-paperclip"></i>
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {/* row end*/}
        </div>
      </div>
    </Fragment>
  );
};
const mapStateToProps = (state) => ({});
export default connect(mapStateToProps, {})(Sites);
