import React, { Fragment } from "react";
import { connect } from "react-redux";
import Header from "../../Header/Header";
import Sidebar from "../../Sidebar/Sidebar";

const AddSite = () => {
  return (
    <Fragment>
      <Sidebar />
      <div class="content">
        <Header />

        <div class="container-fluid">
          <h2>Welcome</h2>
          <h5>Smantha</h5>
          <div className="row">
            <div className="col-md-12">Add Site</div>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default connect(null, {})(AddSite);
