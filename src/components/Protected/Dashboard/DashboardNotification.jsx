// components/Login/LoginForm.js
import React, { Fragment } from "react";
import { connect } from "react-redux";
const DashboardNotification = () => {
  return (
    <Fragment>
      <div class="card">
        <div class="card-body p-2">
          <div class="d-flex bd-highlight p-0">
            <div class="bd-highlight">
              <h5 class="card-title">Notification</h5>
            </div>
            <div class="ms-auto bd-highlight">
              <button type="button" class="btn btn-sm btn-light text-primary">
                View All
              </button>
            </div>
          </div>

          <table class="table table-bordered f-11">
            <thead class="table-dark">
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
            </tbody>
          </table>
        </div>
      </div>
    </Fragment>
  );
};

export default connect(null, {})(DashboardNotification);
