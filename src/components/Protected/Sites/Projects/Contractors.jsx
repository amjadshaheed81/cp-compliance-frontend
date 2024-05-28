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
        <Box>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Text in a modal
          </Typography>
          <Typography id="modal-modal-description" sx={{ mt: 2 }}>
            Duis mollis, est non commodo luctus, nisi erat porttitor ligula.
          </Typography>
        </Box>
      </Modal>
    </Fragment>
  );
};

export default connect(null, {})(Contractors);
