// components/Login/LoginForm.js
import React, { Fragment, useState } from "react";
import { connect } from "react-redux";

const Contractors = ({}) => {
  return (
    <Fragment>
      <div>
        <table class="table table-bordered f-11">
          <thead class="table-dark">
            <tr>
              <th scope="col">Contractor Contact</th>
              <th scope="col">Company</th>
              <th scope="col">Quota (GBP)</th>
              <th scope="col">Status</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Jason M</td>
              <td>ACME Ltd</td>
              <td>&#163;</td>
              <td>
                <div class="bg-warning text-light rounded-1 p-1" role="alert">
                  Recieved
                </div>
              </td>
              <td>
                <span style={{ color: "gray" }}>
                  <i class="fas fa-eye fa-2x"></i>
                </span>
                &nbsp;
                <span style={{ color: "gray" }}>
                  <i class="far fa-thumbs-up fa-2x"></i>
                </span>
                &nbsp;
                <span style={{ color: "gray" }}>
                  <i class="far fa-thumbs-down fa-2x"></i>
                </span>
                &nbsp;
                <span style={{ color: "gray" }}>
                  <i class="far fa-trash-alt fa-2x"></i>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Fragment>
  );
};

export default connect(null, {})(Contractors);
