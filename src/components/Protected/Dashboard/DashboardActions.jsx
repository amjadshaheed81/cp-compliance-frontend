// components/Login/LoginForm.js
import React, { Fragment } from "react";
import { connect } from "react-redux";
const DashboardActions = () => {
  return (
    <Fragment>
      <div className="card">
        <div className="card-body p-2">
          <div className="d-flex bd-highlight p-0">
            <div className="bd-highlight">
              <h5 className="card-title">Actions</h5>
            </div>
            <div className="ms-auto bd-highlight">
              <button
                type="button"
                className="btn btn-sm btn-light text-primary"
              >
                View All
              </button>
            </div>
          </div>
          <div className="table-responsive">
            <table className="table table-bordered f-11">
              <thead className="table-dark">
                <tr>
                  <th scope="col">Action</th>
                  <th scope="col">Owner</th>
                  <th scope="col">End Date</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Action A</td>
                  <td>Joe B</td>
                  <td>31 Dec 24</td>
                  <td>
                    <div
                      className="bg-warning text-light rounded-1 p-1"
                      role="alert"
                    >
                      In Progress
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>Action B</td>
                  <td>Joe B</td>
                  <td>31 Dec 24</td>
                  <td>
                    <div
                      className="bg-warning text-light rounded-1 p-1"
                      role="alert"
                    >
                      In Progress
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>Action B</td>
                  <td>Joe B</td>
                  <td>31 Dec 24</td>
                  <td>
                    <div
                      className="bg-success text-light rounded-1 p-1"
                      role="alert"
                    >
                      Completed
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default connect(null, {})(DashboardActions);
