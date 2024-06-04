// components/Login/LoginForm.js
import React, { Fragment } from "react";
import { connect } from "react-redux";
const DashboardNotification = () => {
  return (
    <Fragment>
      <div className="card">
        <div className="card-body p-2">
          <div className="d-flex bd-highlight p-0">
            <div className="bd-highlight">
              <h5 className="card-title">Notification</h5>
            </div>
            <div className="ms-auto bd-highlight">
              <button type="button" className="btn btn-sm btn-light text-primary">
                View All
              </button>
            </div>
          </div>

          <table className="table table-bordered f-11">
            <thead className="table-dark">
              <tr>
                <th scope="col">Notification</th>
                <th scope="col">Date</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Renew Gas Safety Certificate</td>
                <td>31 Dec 24</td>
              </tr>
              <tr>
                <td>Recieved quote from supplier A</td>
                <td>31 Dec 24</td>
              </tr>
              <tr>
                <td>Recieved quote from supplier A</td>
                <td>31 Dec 24</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Fragment>
  );
};

export default connect(null, {})(DashboardNotification);
