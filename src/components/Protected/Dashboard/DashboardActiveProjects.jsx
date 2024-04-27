// components/Login/LoginForm.js
import React, { Fragment } from "react";
import { connect } from "react-redux";
const DashboardActiveProjects = () => {
  return (
    <Fragment>
      <div class="card">
        <div class="card-body p-2">
          <div class="d-flex bd-highlight p-0">
            <div class="bd-highlight">
              <h5 class="card-title">Active Projects</h5>
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
                <th scope="col">Project</th>
                <th scope="col">Start Date</th>
                <th scope="col">End Date</th>
                <th scope="col">Budget</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Project A</td>
                <td>01 Jan 24</td>
                <td>31 May 24</td>
                <td>&#8364; 2000</td>
              </tr>
              <tr>
                <td>Project B</td>
                <td>01 Jan 24</td>
                <td>31 May 24</td>
                <td>&#8364; 2000</td>
              </tr>
              <tr>
                <td>Project C</td>
                <td>01 Jan 24</td>
                <td>31 May 24</td>
                <td>&#8364; 4000</td>
              </tr>
              <tr>
                <td>Project D</td>
                <td>01 Jan 24</td>
                <td>31 May 24</td>
                <td>
                &#8364;	3000
                </td>
              </tr>
              <tr>
                <td>Project D</td>
                <td>01 Jan 24</td>
                <td>31 May 24</td>
                <td>
                &#8364;	3000
                </td>
              </tr>
              <tr>
                <td>Project D</td>
                <td>01 Jan 24</td>
                <td>31 May 24</td>
                <td>
                &#8364;	3000
                </td>
              </tr>
              <tr>
                <td>Project D</td>
                <td>01 Jan 24</td>
                <td>31 May 24</td>
                <td>
                &#8364;	3000
                </td>
              </tr>
              <tr>
                <td>Project D</td>
                <td>01 Jan 24</td>
                <td>31 May 24</td>
                <td>
                &#8364;	3000
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Fragment>
  );
};

export default connect(null, {})(DashboardActiveProjects);
