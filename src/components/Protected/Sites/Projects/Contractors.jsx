// components/Login/LoginForm.js
import React, { Fragment, useState } from "react";
import { connect } from "react-redux";
import { Box, Modal, Typography } from "@mui/material";

const Contractors = ({}) => {
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
                <span style={{ color: "gray" }} onClick={() => handleOpen()}>
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
          <form class="row border-top">
            <div>
              <span class="badge bg-warning">Recieved</span>
            </div>
            <div className="col-md-6">
              <label for="projectSummary" class="form-label">
                Project Summary
              </label>
              <input
                type="text"
                name="projectSummary"
                class="form-control"
                id="projectSummary"
              />
            </div>
            <div className="col-md-6">
              <label for="contractor" class="form-label">
                Contractor
              </label>
              <input
                type="text"
                name="contractor"
                class="form-control"
                id="contractor"
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
              />
            </div>
            <div className="col-md-6">
              <label for="quoteDate" class="form-label">
                Quote date
              </label>
              <input
                type="date"
                name="quoteDate"
                class="form-control"
                id="quoteDate"
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
                type="text"
                name="officialQuote"
                class="form-control"
                id="officialQuote"
              />
            </div>
            <div className="col-md-6">
              <label for="notes" class="form-label">
                Notes
              </label>
              <textarea name="notes" class="form-control" id="notes"></textarea>
            </div>
            <div>
              <table class="table f-11">
                <thead class="table-dark">
                  <tr>
                    <th scope="col">Mandatory Folder</th>
                    <th scope="col">File</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Asbestos Removal Work</td>
                    <td>
                      <span class="badge bg-light text-primary">File1.pdf</span>
                    </td>
                  </tr>
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
                  Close
                </button>
                &nbsp; &nbsp;
                <button type="button" class="btn btn-success mb-3 mr-4">
                  Approve
                </button>
                &nbsp; &nbsp;
                <button type="button" class="btn btn-danger mb-3 mr-4">
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
