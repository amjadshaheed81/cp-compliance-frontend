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

export default connect(null, {})(MandatoryFolders);
