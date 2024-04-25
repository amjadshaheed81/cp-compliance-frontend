import React, { Fragment, useEffect } from "react";
import { connect } from "react-redux";
import Sidebar from "../../common/Sidebar/Sidebar";
import Header from "../../common/Header/Header";
import { getSites } from "../../../store/thunk/site";

const Sites = ({ success, error, getSites, sites }) => {
  useEffect(() => {
    getSites();
  }, []);
  return (
    <Fragment>
      <Sidebar />
      <div class="content">
        <Header />
        <div class="container-fluid">
          <h4 role="heading">Portfolio Management</h4>
          {/* row start*/}
          <div className="row p-2"></div>
          <div className="col-md-12">
            <table class="table">
              <thead class="table-dark">
                <tr>
                  <th scope="col">Site</th>
                  <th scope="col">Address</th>
                  <th scope="col">Status</th>
                  <th scope="col">Outstanding Risk</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sites?.length === 0 && (
                  <tr>
                    <td>No Sites found</td>
                  </tr>
                )}
                {sites?.map((itm, i) => (
                  <tr key={i}>
                    <th scope="col">{itm?.siteName}</th>
                    <th scope="col">{itm?.address1}</th>
                    <th scope="col">
                      <span class="badge rounded-pill bg-success">Open</span>
                    </th>
                    <th scope="col">
                      <span class="badge bg-danger p-2 m-1">1</span>
                      <span class="badge bg-warning p-2 m-1">1</span>
                      <span class="badge bg-info p-2 m-1">1</span>
                      <span class="badge bg-success p-2 m-1">1</span>
                    </th>
                    <th scope="col">
                      <i class="fas fa-pen"></i> &nbsp;
                      <i class="fas fa-trash"></i>
                    </th>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* row end*/}
        </div>
      </div>
    </Fragment>
  );
};
const mapStateToProps = (state) => ({
  success: state.success,
  error: state.error,
  sites: state.sites,
});
export default connect(mapStateToProps, { getSites })(Sites);
