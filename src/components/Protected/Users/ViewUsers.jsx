import React, { Fragment, useState } from "react";
import { Button, Box } from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import CircularProgress from "@mui/material/CircularProgress";
import DialogTitle from "@mui/material/DialogTitle";
import { connect } from "react-redux";

const ViewUsers = ({
  showViewModal,
  setShowViewModal,
  refresh,
  selectedUser,
}) => {
  const handleOpen = () => setShowViewModal(true);
  const handleClose = () => setShowViewModal(false);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <React.Fragment>
      <Button variant="outlined" onClick={handleOpen}>
        Vuew User Detail
      </Button>
      <Dialog
        open={showViewModal}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          component: "form",
          onSubmit: (event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const formJson = Object.fromEntries(formData.entries());
            console.log("formJson", formJson);
            // formJson.parentUserId = userId
            // console.log(formJson);
            //handleClose();
          },
        }}
      >
        <DialogTitle>View User Details</DialogTitle>
        <DialogContent dividers>
          {isLoading && (
            <Box sx={{ display: "flex" }}>
              <CircularProgress />
            </Box>
          )}
          {!isLoading && (
            <Fragment>
              <ul class="list-group">
                <li class="list-group-item d-flex justify-content-between align-items-center">
                  Full Name
                  <span class="badge bg-primary rounded-pill">
                    {selectedUser?.fullName}
                  </span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                  Email
                  <span class="badge bg-primary rounded-pill">
                    {selectedUser?.email}
                  </span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                  Site
                  <span class="badge bg-primary rounded-pill">
                    {selectedUser?.site}
                  </span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                  Role
                  <span class="badge bg-primary rounded-pill">
                    {selectedUser?.role}
                  </span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                  Creation Date
                  <span class="badge bg-primary rounded-pill">
                    {selectedUser?.creationDate}
                  </span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                  Type
                  <span class="badge bg-primary rounded-pill">
                    {selectedUser?.type}
                  </span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                  Company
                  <span class="badge bg-primary rounded-pill">
                    {selectedUser?.company}
                  </span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                  Status
                  <span class="badge bg-primary rounded-pill">
                    {selectedUser?.status}
                  </span>
                </li>
              </ul>
            </Fragment>
          )}
        </DialogContent>
        {!isLoading && (
          <DialogActions>
            <Button onClick={handleClose}>Close</Button>
          </DialogActions>
        )}
      </Dialog>
    </React.Fragment>
  );
};

const mapStateToProps = () => ({});
export default connect(mapStateToProps, {})(ViewUsers);
