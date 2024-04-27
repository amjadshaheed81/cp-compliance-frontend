// components/Login/LoginForm.js
import React, { Fragment } from "react";
import { connect } from "react-redux";
const DashboardTender = () => {
  return (
    <Fragment>
      <div class="card">
        <div class="card-body p-2">
          <div class="d-flex bd-highlight p-0">
            <div class="bd-highlight">
              <h5 class="card-title">Tender &amp; Quotes</h5>
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
                <th scope="col">Tender ID</th>
                <th scope="col"># of Quotes</th>
                <th scope="col">End Date</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>T1001</td>
                <td>2</td>
                <td>31 May 24</td>
                <td>
                  <div class="bg-warning text-light rounded-1 p-1" role="alert">
                    In Progress
                  </div>
                </td>
              </tr>
              <tr>
                <td>T1001</td>
                <td>2</td>
                <td>31 May 24</td>
                <td>
                  <div class="bg-warning text-light rounded-1 p-1" role="alert">
                    In Progress
                  </div>
                </td>
              </tr>
              <tr>
                <td>T1001</td>
                <td>2</td>
                <td>31 May 24</td>
                <td>
                  <div class="bg-warning text-light rounded-1 p-1" role="alert">
                    In Progress
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Fragment>
  );
};

export default connect(null, {})(DashboardTender);
