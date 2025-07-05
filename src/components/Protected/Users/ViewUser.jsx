import React, { Fragment, useState } from "react";
import { Button, Box } from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import CircularProgress from "@mui/material/CircularProgress";
import DialogTitle from "@mui/material/DialogTitle";
import { connect } from "react-redux";
import moment from "moment";
import TagSites from "./TagSites";

const ViewUsers = ({ showViewModal, setShowViewModal, selectedUser }) => {
  const handleClose = () => setShowViewModal(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSiteTagModal, setShowSiteTagModal] = useState(false);

  return (
    <React.Fragment>
      {showSiteTagModal && (
        <TagSites
          taggedSites={selectedUser?.taggedSites}
          showSiteTagModal={showSiteTagModal}
          setShowSiteTagModal={setShowSiteTagModal}
        />
      )}
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
                    {selectedUser?.name || "--"}
                  </span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                  Email
                  <span class="badge bg-primary rounded-pill">
                    {selectedUser?.email || "--"}
                  </span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                  Site
                  {selectedUser?.taggedSites?.length > 3 && (
                    <>
                      <button
                        type="button"
                        className="btn btn-sm btn-light text-primary"
                        onClick={() => {
                          setShowSiteTagModal(true);
                        }}
                      >
                        {selectedUser?.taggedSites?.length} Sites
                      </button>
                    </>
                  )}
                  {selectedUser?.taggedSites?.length < 4 &&
                    selectedUser?.taggedSites?.map((itm) => (
                      <span className="badge bg-primary">{itm?.name}</span>
                    ))}
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                  Role
                  <span class="badge bg-primary rounded-pill">
                    {selectedUser?.role || "--"}
                  </span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                  Creation Date
                  <span class="badge bg-primary rounded-pill">
                    {selectedUser?.creationDate
                      ? moment(selectedUser?.creationDate).format("DD-MM-YYYY")
                      : "--"}
                  </span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                  Type
                  <span class="badge bg-primary rounded-pill">
                    {selectedUser?.userType || "--"}
                  </span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                  Company
                  <span class="badge bg-primary rounded-pill">
                    {selectedUser?.companyName || "--"}
                  </span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                  Trade
                  <span class="badge bg-primary rounded-pill">
                    {selectedUser?.trade || "--"}
                  </span>
                </li>
                {selectedUser?.userType === "External" &&
                  selectedUser?.trade === "Gas Engineer" && (
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                      Gas Safety Reg No.
                      <span class="badge bg-primary rounded-pill">
                        {selectedUser?.gasSafetyRegNo || "--"}
                      </span>
                    </li>
                  )}
                <li class="list-group-item d-flex justify-content-between align-items-center">
                  Status
                  <span class="badge bg-primary rounded-pill">
                    {selectedUser?.status || "--"}
                  </span>
                </li>
                  {selectedUser?.signature && (
                      <li className="list-group-item d-flex justify-content-between align-items-center">
                          Signature
                          <div
                              className="border rounded bg-white d-flex align-items-center"
                              style={{ height: "38px", padding: "2px" }}
                          >
                          <img
                              width="100%"
                              height="100%"
                              style={{ objectFit: "contain" }}
                              src={selectedUser?.signature}
                              alt="Signature"
                          />
                      </div>
                          </li>
                      )}
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
