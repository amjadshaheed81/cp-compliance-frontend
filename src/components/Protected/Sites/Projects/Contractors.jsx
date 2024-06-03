// components/Login/LoginForm.js
import React, { Fragment, useState } from "react";
import { connect } from "react-redux";
import { Box, Modal, Typography } from "@mui/material";

const Contractors = ({ contractsList, setSelectedContractors }) => {
  const [open, setOpen] = useState(false);
  const handleOpen = () => {
    setOpen(!open);
  };
  const handleClose = () => {
    setOpen(false);
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
      <div>
        <table className="table table-bordered f-11">
          <thead className="table-dark">
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
              <td>
                <select
                  className="form-control form-select"
                  name="contractor"
                  id="contractor"
                  onChange={(e) => {
                    setSelectedContractors([parseInt(e.target.value)]);
                  }}
                >
                  <option value={""}>Select Contractor</option>
                  {contractsList?.map((itm) => (
                    <option value={itm?.id}>{itm?.name}</option>
                  ))}
                </select>
              </td>
              <td>{/* ACME Ltd */}</td>
              <td>&#163;</td>
              <td>
                <div className="bg-light text-info rounded-1 p-1" role="alert">
                  New
                </div>
                {/* <div className="bg-warning text-light rounded-1 p-1" role="alert">
                  Recieved
                </div> */}
              </td>
              <td>
                {/* <span style={{ color: "gray" }} onClick={() => handleOpen()}>
                  <i className="fas fa-eye fa-2x"></i>
                </span>
                &nbsp;
                <span style={{ color: "gray" }}>
                  <i className="far fa-thumbs-up fa-2x"></i>
                </span>
                &nbsp;
                <span style={{ color: "gray" }}>
                  <i className="far fa-thumbs-down fa-2x"></i>
                </span>
                &nbsp;
                <span style={{ color: "gray" }}>
                  <i className="far fa-trash-alt fa-2x"></i>
                </span> */}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            View Contract &amp; Quote
          </Typography>
          <form className="row border-top">
            <div>
              <span className="badge bg-warning">Recieved</span>
            </div>
            <div className="col-md-6">
              <label for="projectSummary" className="form-label">
                Project Summary
              </label>
              <input
                type="text"
                name="projectSummary"
                className="form-control"
                id="projectSummary"
              />
            </div>
            <div className="col-md-6">
              <label for="contractor" className="form-label">
                Contractor
              </label>
              <input
                type="text"
                name="contractor"
                className="form-control"
                id="contractor"
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
              />
            </div>
            <div className="col-md-6">
              <label for="quoteDate" className="form-label">
                Quote date
              </label>
              <input
                type="date"
                name="quoteDate"
                className="form-control"
                id="quoteDate"
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
              />
            </div>
            <div className="col-md-6">
              <label for="officialQuote" className="form-label">
                Official Quote
              </label>
              <input
                type="text"
                name="officialQuote"
                className="form-control"
                id="officialQuote"
              />
            </div>
            <div className="col-md-6">
              <label for="notes" className="form-label">
                Notes
              </label>
              <textarea
                name="notes"
                className="form-control"
                id="notes"
              ></textarea>
            </div>
            <div>
              <table className="table f-11">
                <thead className="table-dark">
                  <tr>
                    <th scope="col">Mandatory Folder</th>
                    <th scope="col">File</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Asbestos Removal Work</td>
                    <td>
                      <span className="badge bg-light text-primary">
                        File1.pdf
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="col-md-12 pt-4 border-top">
              <div className="float-end">
                <button
                  type="button"
                  className="btn btn-light mb-3 mr-4 text-primary"
                  onClick={() => {
                    setOpen(false);
                  }}
                >
                  Close
                </button>
                &nbsp; &nbsp;
                <button type="button" className="btn btn-success mb-3 mr-4">
                  Approve
                </button>
                &nbsp; &nbsp;
                <button type="button" className="btn btn-danger mb-3 mr-4">
                  Reject
                </button>
              </div>
            </div>
          </form>
        </Box>
      </Modal>
    </Fragment>
  );
};

export default connect(null, {})(Contractors);
