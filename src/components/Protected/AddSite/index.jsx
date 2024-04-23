import React, { Fragment } from "react";
import { connect } from "react-redux";
import Header from "../../Header/Header";
import Sidebar from "../../Sidebar/Sidebar";
import "./AddSite.css";

const AddSite = () => {
  return (
    <Fragment>
      <Sidebar />
      <div class="content">
        <Header />
        <div class="container-fluid">
          <h4 role="heading">Create New Site</h4>
          {/* row start*/}
          <div className="row p-2">
            <div className="col-md-8 bg-light">
              <div className="row">
                <p class="fs-6 mt-2 border-bottom">Property Detail</p>
                <form className="p-2">
                  <div className="row">
                    <div className="col-md-12">
                      <div class="mb-3">
                        <label for="siteName" class="form-label">
                          Site Name
                        </label>
                        <input
                          type="text"
                          name="siteName"
                          class="form-control"
                          id="siteName"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div class="mb-3">
                        <label for="address1" class="form-label">
                          Address Line 1
                        </label>
                        <input
                          type="text"
                          name="address1"
                          class="form-control"
                          id="address1"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div class="mb-3">
                        <label for="address2" class="form-label">
                          Address Line 2
                        </label>
                        <input
                          type="text"
                          name="address2"
                          class="form-control"
                          id="address2"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div class="mb-3">
                        <label for="city" class="form-label">
                          City
                        </label>
                        <input
                          type="text"
                          name="city"
                          class="form-control"
                          id="city"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div class="mb-3">
                        <label for="area" class="form-label">
                          Area
                        </label>
                        <input
                          type="text"
                          name="area"
                          class="form-control"
                          id="area"
                        />
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div class="mb-3">
                        <label for="postCode" class="form-label">
                          Post Code
                        </label>
                        <input
                          type="text"
                          name="postCode"
                          class="form-control"
                          id="postCode"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div class="mb-3">
                        <label for="country" class="form-label">
                          Country
                        </label>
                        <input
                          type="text"
                          name="country"
                          class="form-control"
                          id="country"
                        />
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div class="mb-3">
                        <label for="mapViewUrl" class="form-label">
                          Map View URL
                        </label>
                        <input
                          type="text"
                          name="mapViewUrl"
                          class="form-control"
                          id="mapViewUrl"
                        />
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div class="mb-3">
                        <label for="streetViewURL" class="form-label">
                          Street View URL
                        </label>
                        <input
                          type="text"
                          name="streetViewURL"
                          class="form-control"
                          id="streetViewURL"
                        />
                      </div>
                    </div>
                  </div>
                  <div class="float-end">
                    <button type="button" class="btn btn-light mb-3 mr-4">
                      Cancel
                    </button>
                    &nbsp; &nbsp;
                    <button type="submit" class="btn btn-primary mb-3 mr-4">
                      Submit
                    </button>
                  </div>
                </form>
              </div>
            </div>
            <div className="col-md-4"></div>
          </div>
          {/* row end*/}
        </div>
      </div>
    </Fragment>
  );
};

export default connect(null, {})(AddSite);
