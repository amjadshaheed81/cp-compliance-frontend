import React, { Fragment, useEffect, useState } from "react";
import { Button, Box } from "@mui/material";
import { connect } from "react-redux";
import { useForm } from "react-hook-form";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import CircularProgress from "@mui/material/CircularProgress";
import DialogTitle from "@mui/material/DialogTitle";

const ViewUsers = ({
  showEditModal,
  setShowEditModal,
  refresh,
  selectedUser,
}) => {
  const handleOpen = () => setShowEditModal(true);
  const handleClose = () => setShowEditModal(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register, reset } = useForm({});
  useEffect(() => {
    reset(selectedUser);
  }, []);
  return (
    <React.Fragment>
      <Dialog
        open={showEditModal}
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
          },
        }}
      >
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent dividers>
          {isLoading && (
            <Box sx={{ display: "flex" }}>
              <CircularProgress />
            </Box>
          )}
          {!isLoading && (
            <Fragment>
              <div className="row">
                <div className="col-md-4">
                  <div className="form-group">
                    <label for="firstName">First Name</label>
                    <input
                      type="text"
                      className="form-control"
                      id="firstName"
                      {...register("firstName")}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group">
                    <label for="lastName">Last Name</label>
                    <input
                      type="text"
                      className="form-control"
                      id="lastName"
                      {...register("lastName")}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group">
                    <label for="email">Email ID</label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      {...register("email")}
                    />
                  </div>
                </div>
                <div className="col-md-4 mt-2">
                  <div className="form-group">
                    <label for="phone">Phone Number</label>
                    <input
                      type="text"
                      className="form-control"
                      id="phone"
                      {...register("phone")}
                    />
                  </div>
                </div>
                <div className="col-md-4 mt-2">
                  <div className="form-group">
                    <label for="email">Role</label>
                    <select
                      {...register("role")}
                      className="form-control form-select"
                    >
                      <option value={""}>Select Role</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-4 mt-2">
                  <div className="form-group">
                    <label for="internalExternal">Internal/External</label>
                    <select
                      id="internalExternal"
                      name="internalExternal"
                      {...register("internalExternal")}
                      className="form-control form-select"
                    >
                      <option value={"Internal"}>Internal</option>
                      <option value={"External"}>External</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-4 mt-2">
                  <div className="form-group">
                    <label for="tagSite">Tag Site (if internal)</label>
                    <select
                      id="tagSite"
                      name="tagSite"
                      {...register("tagSite")}
                      className="form-control form-select"
                    >
                      <option value={""}>Tag Site</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-4 mt-2">
                  <div className="form-group">
                    <label for="companyName">Company Name</label>
                    <input
                      type="text"
                      className="form-control"
                      id="companyName"
                      {...register("companyName")}
                    />
                  </div>
                </div>
                <div className="col-md-4 mt-2">
                  <div className="form-group">
                    <label for="trade">Trade (if external)</label>
                    <select
                      id="trade"
                      name="trade"
                      {...register("trade")}
                      className="form-control form-select"
                    >
                      <option value={""}>NA</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-4 mt-2">
                  <div className="form-group">
                    <label for="trade">Selected Sites</label>
                  </div>
                </div>
                <div className="col-md-4 mt-2">
                  <div className="form-group">
                    <label for="status">Status</label>
                    <select
                      id="status"
                      name="status"
                      {...register("status")}
                      className="form-control form-select"
                    >
                      <option value={""}>Select Status</option>
                      <option value={"active"}>Active</option>
                      <option value={"inactive"}>Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
            </Fragment>
          )}
        </DialogContent>
        {!isLoading && (
          <DialogActions>
            <Button onClick={handleClose} className="bg-light text-primary">
              Close
            </Button>
            <Button type="submit" className="bg-primary text-white">
              Save
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </React.Fragment>
  );
};

const mapStateToProps = () => ({});
export default connect(mapStateToProps, {})(ViewUsers);
