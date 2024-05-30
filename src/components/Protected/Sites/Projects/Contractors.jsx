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
      <div className="col-md-3">
        <p>
          <strong>Add Contractor</strong>
        </p>
        <div>
          <button
            className="btn btn-sm btn-light text-primary w-100 mb-2"
            onClick={() => handleOpen()}
          >
            <i className="fas fa-plus"></i>&nbsp;Add
          </button>
        </div>
      </div>
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
            <div class="col-md-12">
              
            </div>
            <div className="col-md-12 pt-4 border-top">
              <div class="float-end">
                        <button type="button" class="btn btn-light mb-3 mr-4 text-primary">
                          Cancel
                        </button>
                        &nbsp; &nbsp;
                        <button type="submit" class="btn btn-primary mb-3 mr-4">
                          Save
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
