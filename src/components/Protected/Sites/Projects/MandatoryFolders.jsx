import React, { Fragment, useState } from "react";
import { Box, Modal, Typography } from "@mui/material";
import { connect } from "react-redux";

const MandatoryFolders = ({}) => {
  const [openFolder, setFolderOpen] = useState(false);
  const handleFolderOpen = () => {
    setFolderOpen(!openFolder);
  };
  const handleFolderClose = () => {
    setFolderOpen(false);
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
      <div className="row mb-2" style={{ height: "auto" }}>
        <div className="col-md-3">
          <p>
            <strong>Add Mandatory Folders</strong>
          </p>
          <div>
            <button
              className="btn btn-sm btn-light text-primary w-100"
              onClick={handleFolderOpen}
            >
              <i className="fas fa-plus"></i>&nbsp; Select Folder
            </button>
          </div>
        </div>
      </div>
      <Modal
        open={openFolder}
        onClose={handleFolderClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Select Mandatory Folders
          </Typography>
          <form class="row border-top">
            <div className="col-md-12 pt-4 border-top">
              <div class="float-end">
                <button type="button" class="btn btn-light text-primary">
                  <i class="fas fa-solid fa-home"></i> Root
                </button>
                &nbsp; &nbsp;
                <button type="button" class="btn btn-light text-primary">
                  <i class="fas fa-solid fa-arrow-left"></i> Back
                </button>
              </div>
            </div>
            <table class="table f-11">
              <thead class="table-dark">
                <tr>
                  <th scope="col">Folder</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <i
                      style={{ color: "#384BD3" }}
                      class="fas fa-folder fa-2x"
                    ></i>
                    <span class="p-3">Folder Name</span>
                  </td>
                  <td>
                    <span className="text-primary">
                      <i class="fas fa-plus" size="sm"></i>
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
            <div>
              <span class="badge bg-light text-primary">
                Key Structural Princiles <i class="fas fa-times" size="sm"></i>
              </span>{" "}
              &nbsp;
              <span class="badge bg-light text-primary">
                Asbestos Removal Work <i class="fas fa-times" size="sm"></i>
              </span>{" "}
              &nbsp;
            </div>
            <div className="col-md-12 pt-4 border-top">
              <div class="float-end">
                <button
                  type="button"
                  class="btn btn-light mb-3 mr-4 text-primary"
                  onClick={() => {
                    setFolderOpen(false);
                  }}
                >
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

export default connect(null, {})(MandatoryFolders);
