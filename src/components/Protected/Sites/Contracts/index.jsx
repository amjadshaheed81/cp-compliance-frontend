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
  updateContractDetail,
} from "../../../../store/thunk/contracts";
import Success from "../../../common/Alert/Success";
import Error from "../../../common/Alert/Error";

const Contracts = ({
  getSiteContracts,
  getSiteContractDetails,
  updateContractDetail,
  contractsList,
  contractDetail,
  filterContract,
  error,
  success,
  siteSelectedForGlobal,
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
    getSiteContracts(3); // TODO: need to change it to loggedIn user id or siteSelectedForGlobal?.siteId
  }, []);

  const updateContractDetails = () => {
    updateContractDetail(selectedContract);
  };
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
      <div className="content">
        <Header />
        <div className="container-fluid">
          <BreadCrumHeader header={"Contracts"} page={"Contracts"} />
          {/*  */}
          {/*  */}
          <div className="d-flex bd-highlight">
            <div className="pt-2 bd-highlight ">
              <div className="row">
                <div className="col">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Project"
                    name="project"
                  />
                </div>
                <div className="col">
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
                <div className="col">
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
                    <i className="fas fa-download"></i>&nbsp;Export
                  </CSVLink>
                </div>
              </div>
            </div>
          </div>
          {/* row start*/}
          <div className="row p-2"></div>
          <div className="col-md-12">
            <table className="table">
              <thead className="table-dark">
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
                        style={{ color: "gray" }}
                        className="cursor"
                        onClick={() => {
                          setSelectedContract(itm);
                          getSiteContractDetails(itm?.quote_id);
                          handleOpen();
                        }}
                      >
                        <i className="fas fa-eye"></i>
                      </span>
                      &nbsp;&nbsp;&nbsp;
                      <CSVLink
                        filename={"contracts-quote"}
                        className="btn btn-light bg-white text-primary"
                        data={[itm]}
                      >
                        <i className="fas fa-solid fa-paperclip"></i>
                      </CSVLink>
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
          <form className="row border-top">
            <div>
              <span className="badge bg-warning">Recieved</span>
            </div>
            <div className="col-md-12">
              <label for="projectSummary" className="form-label">
                Project Summary
              </label>
              <input
                type="text"
                name="projectSummary"
                className="form-control"
                id="projectSummary"
                disabled={true}
                value={contractDetail?.project_summary}
              />
            </div>
            <div className="col-md-6">
              <label for="projectManager" className="form-label">
                Project Manager
              </label>
              <input
                type="text"
                name="projectManager"
                className="form-control"
                id="projectManager"
                disabled={true}
                value={contractDetail?.manager_first_name}
              />
            </div>
            <div className="col-md-6">
              <label for="projectStartDate" className="form-label">
                Project Start date
              </label>
              <input
                type="date"
                name="projectStartDate"
                className="form-control"
                id="projectStartDate"
                disabled={true}
                value={contractDetail?.start_date}
              />
            </div>
            <div className="col-md-6">
              <label for="quote" className="form-label">
                Quote (GBP)
              </label>
              <input
                type="text"
                name="quote"
                className="form-control"
                id="quote"
                value={contractDetail?.quote}
              />
            </div>
            <div className="col-md-6">
              <label for="officialQuote" className="form-label">
                Official Quote
              </label>
              <input
                type="file"
                name="officialQuote"
                className="form-control"
                id="officialQuote"
              />
            </div>
            <div className="col-md-12">
              <label for="notes" className="form-label">
                Project Manager Comments
              </label>
              <textarea
                name="notes"
                className="form-control"
                id="notes"
                disabled={true}
                value={contractDetail?.project_comments}
              ></textarea>
            </div>
            <div>
              <table className="table f-11 mt-2">
                <thead className="table-dark">
                  <tr>
                    <th scope="col">Mandatory Folder</th>
                    <th scope="col">File (PDF, 1 MB)</th>
                    <th scope="col"></th>
                  </tr>
                </thead>
                <tbody>
                  {contractDetail?.folder_details?.length === 0 && (
                    <tr>
                      <td>folder details are not available</td>
                    </tr>
                  )}
                  {contractDetail?.folder_details?.map((itm) => (
                    <tr key={itm?.folder_id}>
                      <td>{itm?.folder_name}</td>
                      <td>
                        <input
                          type="file"
                          className="form-control"
                          disabled={
                            contractDetail?.status !== "Awarded" ? true : false
                          }
                        />
                      </td>
                      <td>
                        {itm?.file && (
                          <span className="badge bg-light text-primary">
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
              <div>
                {success && <Success msg={success} />}
                {error && <Error msg={error} />}
              </div>
              <div className="float-end">
                <button
                  type="button"
                  className="btn btn-light mb-3 mr-4 text-primary"
                  onClick={() => {
                    setOpen(false);
                  }}
                >
                  Cancel
                </button>
                &nbsp; &nbsp;
                <button
                  type="button"
                  className="btn btn-primary mb-3 mr-4"
                  onClick={() => {
                    updateContractDetails();
                  }}
                >
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
  success: state.siteContracts.success,
  contractsList: state.siteContracts.contractsList,
  filterContract: state.siteContracts.filterContract,
  contractDetail: state.siteContracts.contractDetail,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
});
export default connect(mapStateToProps, {
  getSiteContracts,
  getSiteContractDetails,
  updateContractDetail,
})(Contracts);
