import React, { Fragment, useState, useEffect } from "react";
import { connect } from "react-redux";
import { CSVLink } from "react-csv";
import Header from "../../../common/Header/Header";
import BreadCrumHeader from "../../../common/BreadCrumHeader/BreadCrumHeader";
import SidebarNew from "../../../common/Sidebar/SidebarNew";
import { Box, Modal, Typography } from "@mui/material";
import {
  getSiteContracts,
  getSiteContractDetails,
} from "../../../../store/thunk/contracts";

const Contracts = ({
  getSiteContracts,
  getSiteContractDetails,
  contractsList,
  contractDetail,
  filterContract,
  error,
}) => {
  const [open, setOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState({});
  const handleOpen = () => {
    setOpen(!open);
  };
  const handleClose = () => {
    setOpen(false);
  };

  useEffect(() => {
    getSiteContracts(126);
  }, []);
  const style = {
    position: "absolute",
    overflow: "auto",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 700,
    height: 400,
    bgcolor: "background.paper",
    border: "2px solid #fff",
    boxShadow: 24,
    p: 4,
  };
  return (
    <Fragment>
      {/* <Sidebar /> */}
      <SidebarNew />
      <div class="content">
        <Header />
        <div class="container-fluid">
          <BreadCrumHeader header={"Contracts"} page={"Contracts"} />
          {/*  */}
          {/*  */}
          <div class="d-flex bd-highlight">
            <div class="pt-2 bd-highlight ">
              <div class="row">
                <div class="col">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Project"
                    name="project"
                  />
                </div>
                <div class="col">
                  <select
                    name="startMonth"
                    className="form-control form-select"
                    id="startMonth"
                  >
                    <option value="" selected disabled>
                      Start Month
                    </option>
                  </select>
                </div>
                <div class="col">
                  <select
                    name="site"
                    className="form-control form-select"
                    id="site"
                  >
                    <option value="" selected disabled>
                      Site
                    </option>
                  </select>
                </div>
                <div className="col">
                  <CSVLink
                    filename={"contracts-lists"}
                    className="btn btn-light bg-white text-primary"
                    data={contractsList}
                  >
                    <i class="fas fa-download"></i>&nbsp;Export
                  </CSVLink>
                </div>
              </div>
            </div>
          </div>
          {/* row start*/}
          <div className="row p-2"></div>
          <div className="col-md-12">
            <table class="table">
              <thead class="table-dark">
                <tr>
                  <th scope="col">Project Summary</th>
                  <th scope="col">Site</th>
                  <th scope="col">Manager</th>
                  <th scope="col">Start Date</th>
                  <th scope="col">Recieved Date</th>
                  <th scope="col">Quota (GBP)</th>
                  <th scope="col">Quota Date</th>
                  <th scope="col">Status</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {contractsList?.length === 0 && (
                  <tr>
                    <td>No Contracts Found</td>
                  </tr>
                )}
                {contractsList?.map((itm) => (
                  <tr key={itm?.quote_id}>
                    <td>{itm?.project_summary}</td>
                    <td>{itm?.site}</td>
                    <td>{itm?.manager_first_name}</td>
                    <td>{itm?.start_date}</td>
                    <td>{itm?.recieved_date}</td>
                    <td>{itm?.quote}</td>
                    <td>{itm?.quote_date}</td>
                    <td></td>
                    <td>
                      <span
                        style={{ color: "gray", cursor: "pointer" }}
                        onClick={() => {
                          setSelectedContract(itm);
                          getSiteContractDetails(itm?.quote_id);
                          handleOpen();
                        }}
                      >
                        <i class="fas fa-eye"></i>
                      </span>
                      &nbsp;
                      <span style={{ color: "gray" }} title="Official Quota">
                        <i class="fas fa-solid fa-paperclip"></i>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* row end*/}
        </div>
      </div>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            View Contract
          </Typography>
          <form class="row border-top">
            <div>
              <span class="badge bg-warning">Recieved</span>
            </div>
            <div className="col-md-12">
              <label for="projectSummary" class="form-label">
                Project Summary
              </label>
              <input
                type="text"
                name="projectSummary"
                class="form-control"
                id="projectSummary"
                disabled={true}
              />
            </div>
            <div className="col-md-6">
              <label for="projectManager" class="form-label">
                Project Manager
              </label>
              <input
                type="text"
                name="projectManager"
                class="form-control"
                id="projectManager"
                disabled={true}
              />
            </div>
            <div className="col-md-6">
              <label for="projectStartDate" class="form-label">
                Project Start date
              </label>
              <input
                type="date"
                name="projectStartDate"
                class="form-control"
                id="projectStartDate"
                disabled={true}
              />
            </div>
            <div className="col-md-6">
              <label for="quote" class="form-label">
                Quote (GBP)
              </label>
              <input type="text" name="quote" class="form-control" id="quote" />
            </div>
            <div className="col-md-6">
              <label for="officialQuote" class="form-label">
                Official Quote
              </label>
              <input
                type="file"
                name="officialQuote"
                class="form-control"
                id="officialQuote"
              />
            </div>
            <div className="col-md-12">
              <label for="notes" class="form-label">
                Project Manager Comments
              </label>
              <textarea
                name="notes"
                class="form-control"
                id="notes"
                disabled={true}
              ></textarea>
            </div>
            <div>
              <table class="table f-11 mt-2">
                <thead class="table-dark">
                  <tr>
                    <th scope="col">Mandatory Folder</th>
                    <th scope="col">File (PDF, 1 MB)</th>
                    <th scope="col"></th>
                  </tr>
                </thead>
                <tbody>
                  {contractDetail?.folderDetails?.length === 0 && (
                    <tr>
                      <td>folder details are not available</td>
                    </tr>
                  )}
                  {contractDetail?.folderDetails?.map((itm) => (
                    <tr key={itm?.folder_id}>
                      <td>{itm?.folderName}</td>
                      <td>
                        <input type="file" className="form-control" />
                      </td>
                      <td>
                        {itm?.file && (
                          <span class="badge bg-light text-primary">
                            {itm?.file}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="col-md-12 pt-4 border-top">
              <div class="float-end">
                <button
                  type="button"
                  class="btn btn-light mb-3 mr-4 text-primary"
                  onClick={() => {
                    setOpen(false);
                  }}
                >
                  Cancel
                </button>
                &nbsp; &nbsp;
                <button type="button" class="btn btn-primary mb-3 mr-4">
                  Submit
                </button>
              </div>
            </div>
          </form>
        </Box>
      </Modal>
    </Fragment>
  );
};
const mapStateToProps = (state) => ({
  error: state.siteContracts.error,
  contractsList: state.siteContracts.contractsList,
  filterContract: state.siteContracts.filterContract,
  contractDetail: state.siteContracts.contractDetail,
});
export default connect(mapStateToProps, {
  getSiteContracts,
  getSiteContractDetails,
})(Contracts);
