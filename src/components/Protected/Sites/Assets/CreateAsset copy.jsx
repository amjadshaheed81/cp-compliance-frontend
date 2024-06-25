import React, { Fragment, useState } from "react";
import { connect } from "react-redux";
import Box from "@mui/material/Box";
import Header from "../../../common/Header/Header";
import BreadCrumHeader from "../../../common/BreadCrumHeader/BreadCrumHeader";
import SidebarNew from "../../../common/Sidebar/SidebarNew";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import siteDummy from "../../../../images/site-dummy.png";

const CreateAsset = () => {
  const [patRecord, setPatRecord] = useState([]);

  const addPatRecord = () => {
    setPatRecord([
      ...patRecord,
      {
        tester: "",
        testDate: "",
        nextTestDate: "",
      },
    ]);
  };
  return (
    <Fragment>
      <SidebarNew />
      <div className="content">
        <Header />
        <div className="container-fluid">
          <BreadCrumHeader header={"Create New Asset"} page={"Asset Details"} />

          <Box sx={{ width: "100%", typography: "body1" }}>
            <div className="row p-2 border">
              <div className="col-md-12">
                <div className="float-end">
                  <button type="button" className="btn btn-light mb-3 mr-4">
                    Close
                  </button>
                  &nbsp; &nbsp;
                  <button type="submit" className="btn btn-primary mb-3 mr-4">
                    Save
                  </button>
                </div>
              </div>
              <div className="col-md-12 p-2">
                {/* start */}
                <Accordion>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="basic-detail"
                    id="basic-detail"
                  >
                    Basic Detail
                  </AccordionSummary>
                  <AccordionDetails>
                    <div className="row">
                      <div className="col-md-8">
                        <div className="row">
                          <div className="col-md-6">
                            <div className="form-group mt-2">
                              <label for="assetName">Asset Name</label>
                              <input
                                type="text"
                                className="form-control"
                                id="assetName"
                                name="assetName"
                                placeholder=""
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-group mt-2">
                              <label for="manufacturer">Manufacturer</label>
                              <input
                                type="text"
                                className="form-control"
                                id="manufacturer"
                                name="manufacturer"
                                placeholder=""
                              />
                            </div>
                          </div>

                          <div className="col-md-6">
                            <div className="form-group mt-2">
                              <label for="relatedAsset">Related Asset</label>
                              <input
                                type="text"
                                className="form-control"
                                id="relatedAsset"
                                name="relatedAsset"
                                placeholder=""
                              />
                            </div>
                          </div>

                          <div className="col-md-6">
                            <label for="folder">Folder</label>
                            <select
                              name="folder"
                              className="form-control form-select"
                              id="folder"
                            >
                              <option value="">Select Folder</option>
                            </select>
                          </div>

                          <div className="col-md-6">
                            <div className="form-group mt-2">
                              <label for="modal">Modal</label>
                              <input
                                type="text"
                                className="form-control"
                                id="modal"
                                name="modal"
                                placeholder=""
                              />
                            </div>
                          </div>

                          <div className="col-md-6">
                            <div className="form-group mt-2">
                              <label for="serialNumber">Serial Number</label>
                              <input
                                type="text"
                                className="form-control"
                                id="serialNumber"
                                name="serialNumber"
                                placeholder=""
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <img src={siteDummy} className="img img-responsive" />
                      </div>
                    </div>
                  </AccordionDetails>
                </Accordion>
                <Accordion>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="purchase-detail"
                    id="purchase-detail"
                  >
                    Purchase Detail
                  </AccordionSummary>
                  <AccordionDetails>
                    <div className="row">
                      <div className="col-md-4">
                        <div className="form-group mt-2">
                          <label for="purchaseDate">Purchase Date</label>
                          <input
                            type="date"
                            className="form-control"
                            id="purchaseDate"
                            name="purchaseDate"
                            placeholder=""
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group mt-2">
                          <label for="supplier">Supplier</label>
                          <input
                            type="text"
                            className="form-control"
                            id="supplier"
                            name="supplier"
                            placeholder=""
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group mt-2">
                          <label for="transaction-id">Tramsaction ID</label>
                          <input
                            type="number"
                            className="form-control"
                            id="transaction-id"
                            name="transaction-id"
                            placeholder=""
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group mt-2">
                          <label for="cost">Cost</label>
                          <input
                            type="number"
                            className="form-control"
                            id="cost"
                            name="cost"
                            placeholder=""
                          />
                        </div>
                      </div>

                      <div className="col-md-8">
                        <div className="form-group mt-2">
                          <label for="cost">Invoice</label>
                          <input
                            type="file"
                            className="form-control"
                            id="cost"
                            name="cost"
                            placeholder=""
                          />
                        </div>
                      </div>
                    </div>
                  </AccordionDetails>
                </Accordion>
                <Accordion>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="purchase-detail"
                    id="asset-clarification"
                  >
                    Asset Clarification
                  </AccordionSummary>
                  <AccordionDetails>
                    <div className="row">
                      <div className="col-md-4">
                        <label for="category">Category</label>
                        <select
                          name="category"
                          className="form-control form-select"
                          id="category"
                        >
                          <option value="">Select Category</option>
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label for="subcategory2">Sub Category 2</label>
                        <select
                          name="subcategory2"
                          className="form-control form-select"
                          id="subcategory2"
                        >
                          <option value="">Select Sub Category 2</option>
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label for="subcategory2">Sub Category 2</label>
                        <select
                          name="subcategory2"
                          className="form-control form-select"
                          id="subcategory2"
                        >
                          <option value="">Select Sub Category 2</option>
                        </select>
                      </div>
                      <div className="col-md-4 mt-2">
                        <input type="checkbox" id="patItem" />
                        &nbsp;
                        <label for="patItem">
                          PAT item (fill PAT details below)
                        </label>
                      </div>
                      <div className="col-md-4 mt-2">
                        <input type="checkbox" id="passiveFireSchedule" />
                        &nbsp;
                        <label for="passiveFireSchedule">
                          Passive file schedule required (fill PSB details
                          below)
                        </label>
                      </div>
                    </div>
                  </AccordionDetails>
                </Accordion>
                <Accordion>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="location"
                    id="location"
                  >
                    Location
                  </AccordionSummary>
                  <AccordionDetails>
                    <div className="row">
                      <div className="col-md-4">
                        <label for="internal-external">Internal/External</label>
                        <select
                          name="internal-external"
                          className="form-control form-select"
                          id="internal-external"
                        >
                          <option value="">Select Internal/External</option>
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label for="floor">Floor</label>
                        <select
                          name="floor"
                          className="form-control form-select"
                          id="floor"
                        >
                          <option value="">Select Floor</option>
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label for="room">Room</label>
                        <select
                          name="room"
                          className="form-control form-select"
                          id="room"
                        >
                          <option value="">Select Room</option>
                        </select>
                      </div>
                    </div>
                  </AccordionDetails>
                </Accordion>
                <Accordion>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="valudation-disposal"
                    id="valudation-disposal"
                  >
                    Valudation &amp; Disposal
                  </AccordionSummary>
                  <AccordionDetails>
                    <div className="row">
                      <div className="col-md-4">
                        <div className="form-group mt-2">
                          <label for="valudationDate">Valudation Date</label>
                          <input
                            type="date"
                            className="form-control"
                            id="valudationDate"
                            name="valudationDate"
                            placeholder=""
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group mt-2">
                          <label for="valuation">Valuation</label>
                          <input
                            type="number"
                            className="form-control"
                            id="valuation"
                            name="valuation"
                            placeholder=""
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <label for="valuationDoneBy">Valuation Done By</label>
                        <select
                          name="valuationDoneBy"
                          className="form-control form-select"
                          id="valuationDoneBy"
                        >
                          <option value=""></option>
                        </select>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group mt-2">
                          <label for="disposalDate">Disposal Date</label>
                          <input
                            type="date"
                            className="form-control"
                            id="disposalDate"
                            name="disposalDate"
                            placeholder=""
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group mt-2">
                          <label for="disposalValue">Disposal Value</label>
                          <input
                            type="number"
                            className="form-control"
                            id="disposalValue"
                            name="disposalValue"
                            placeholder=""
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group mt-2">
                          <label for="disposalTo">Disposal To</label>
                          <input
                            type="text"
                            className="form-control"
                            id="disposalTo"
                            name="disposalTo"
                            placeholder=""
                          />
                        </div>
                      </div>
                    </div>
                  </AccordionDetails>
                </Accordion>
                <Accordion>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="portal-app-testing"
                    id="portal-app-testing"
                  >
                    Portal Application Testing Details
                  </AccordionSummary>
                  <AccordionDetails>
                    <div className="row">
                      <div>
                        <button
                          onClick={() => addPatRecord()}
                          className="btn btn-light text-primary"
                        >
                          <i className="fas fa-plus"></i>&nbsp;Add PAT Record
                        </button>
                      </div>
                      <div className="col-md-12 mt-2">
                        <div className="table-responsive">
                          <table className="table table-bordered f-11">
                            <thead className="table-lght">
                              <tr>
                                <th scope="col">Tester</th>
                                <th scope="col">Test Date</th>
                                <th scope="col">Next Test Date</th>
                                <th scope="col">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {patRecord?.map((itm) => (
                                <tr>
                                  <td>
                                    <select
                                      name="tester"
                                      className="form-control form-select"
                                      id="tester"
                                    >
                                      <option value="">Select Tester</option>
                                    </select>
                                  </td>
                                  <td>
                                    <input
                                      type="date"
                                      className="form-control"
                                      id="testDate"
                                      name="testDate"
                                      placeholder="dd/mm/yyyy"
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="date"
                                      className="form-control"
                                      id="nextTestDate"
                                      name="nextTestDate"
                                      placeholder="dd/mm/yyyy"
                                    />
                                  </td>
                                  <td>
                                    <i class="fas fa-regular fa-thumbs-up cursor"></i>{" "}
                                    &nbsp;
                                    <i class="fas fa-regular fa-thumbs-down cursor"></i>{" "}
                                    &nbsp;
                                    <i className="fas fa-trash cursor"></i>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </AccordionDetails>
                </Accordion>
                <Accordion>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="passive-fire-protection"
                    id="passive-fire-protection"
                  >
                    Passive Fire Protection
                  </AccordionSummary>
                  <AccordionDetails>
                    <div className="row">
                      <div className="col-md-4">
                        <div className="form-group mt-2">
                          <label for="productName">Product Name</label>
                          <input
                            type="text"
                            className="form-control"
                            id="productName"
                            name="productName"
                            placeholder=""
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group mt-2">
                          <label for="access-position">Access/Position</label>
                          <input
                            type="text"
                            className="form-control"
                            id="access-position"
                            name="access-position"
                            placeholder=""
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group mt-2">
                          <label for="material">Material</label>
                          <select
                            name="material"
                            className="form-control form-select"
                            id="material"
                          >
                            <option value="">Select Material</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group mt-2">
                          <label for="service">Service</label>
                          <input
                            type="text"
                            className="form-control"
                            id="service"
                            name="service"
                            placeholder=""
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group mt-2">
                          <label for="dimension">Dimension</label>
                          <input
                            type="text"
                            className="form-control"
                            id="dimension"
                            name="dimension"
                            placeholder=""
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group mt-2">
                          <label for="quantity">Quantity</label>
                          <input
                            type="text"
                            className="form-control"
                            id="quantity"
                            name="quantity"
                            placeholder=""
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group mt-2">
                          <label for="area">Area (in sq m)</label>
                          <input
                            type="text"
                            className="form-control"
                            id="area"
                            name="area"
                            placeholder=""
                          />
                        </div>
                      </div>
                    </div>
                  </AccordionDetails>
                </Accordion>
                <Accordion>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="door-specification"
                    id="door-specification"
                  >
                    Door Specification
                  </AccordionSummary>
                  <AccordionDetails>
                    <div className="row">
                      <div className="col-md-4">
                        <div className="form-group mt-2">
                          <label for="doorWidth">Door Width (cm)</label>
                          <input
                            type="text"
                            className="form-control"
                            id="doorWidth"
                            name="doorWidth"
                            placeholder=""
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group mt-2">
                          <label for="doorHeight">Door Height (cm)</label>
                          <input
                            type="text"
                            className="form-control"
                            id="doorHeight"
                            name="doorHeight"
                            placeholder=""
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group mt-2">
                          <label for="doorDepth">Door Depth (cm)</label>
                          <input
                            type="text"
                            className="form-control"
                            id="doorDepth"
                            name="doorDepth"
                            placeholder=""
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group mt-2">
                          <label for="doorFinish">Door Finish</label>
                          <input
                            type="text"
                            className="form-control"
                            id="doorFinish"
                            name="doorFinish"
                            placeholder=""
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group mt-2">
                          <label for="visionPanel">Vision Panel</label>
                          <input
                            type="text"
                            className="form-control"
                            id="visionPanel"
                            name="visionPanel"
                            placeholder=""
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group mt-2">
                          <label for="fireRating">Fire Rating</label>
                          <input
                            type="text"
                            className="form-control"
                            id="fireRating"
                            name="fireRating"
                            placeholder=""
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group mt-2">
                          <label for="fireMaterial">Fire Material</label>
                          <input
                            type="text"
                            className="form-control"
                            id="fireMaterial"
                            name="fireMaterial"
                            placeholder=""
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group mt-2">
                          <label for="frameFinish">Frame Finish</label>
                          <input
                            type="text"
                            className="form-control"
                            id="frameFinish"
                            name="frameFinish"
                            placeholder=""
                          />
                        </div>
                      </div>
                    </div>
                  </AccordionDetails>
                </Accordion>

                {/* end */}
              </div>
              <div className="col-md-12">
                <div className="float-end">
                  <button type="button" className="btn btn-light mb-3 mr-4">
                    Close
                  </button>
                  &nbsp; &nbsp;
                  <button type="submit" className="btn btn-primary mb-3 mr-4">
                    Save
                  </button>
                </div>
              </div>
            </div>
          </Box>
          {/*  */}
          {/*  */}
        </div>
      </div>
    </Fragment>
  );
};
const mapStateToProps = () => ({});
export default connect(mapStateToProps, {})(CreateAsset);
