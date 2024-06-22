import React, { Fragment, useEffect, useState } from "react";
import { Button, Box } from "@mui/material";
import { connect } from "react-redux";
import { useForm } from "react-hook-form";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import CircularProgress from "@mui/material/CircularProgress";
import DialogTitle from "@mui/material/DialogTitle";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";

const AddPreActions = ({ showAddModal, setShowAddModal, refresh }) => {
  const handleOpen = () => setShowAddModal(true);
  const handleClose = () => setShowAddModal(false);
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    reset,
    watch,
    formState: { errors },
    handleSubmit,
  } = useForm({});
  const values = watch();
  useEffect(() => {
    // reset(selectedUser);
  }, []);
  const submitPreActions = async (data) => {
    console.log("data", data);
  };
  return (
    <React.Fragment>
      <Dialog open={showAddModal} onClose={handleClose} maxWidth="lg" fullWidth>
        <form onSubmit={handleSubmit(submitPreActions)}>
          <DialogTitle>Create New Pre-Action</DialogTitle>
          <DialogContent dividers>
            {isLoading && (
              <Box sx={{ display: "flex" }}>
                <CircularProgress />
              </Box>
            )}
            {!isLoading && (
              <Fragment>
                <div className="row">
                  <div className="col-md-8">
                    <div className="row">
                      <div className="col-md-6">
                        <label for="userType">Internal/External</label>
                        <select
                          name="userType"
                          className="form-control form-select"
                          id="userType"
                        >
                          <option value="">Select Internal/External</option>
                          <option value="Internal">Internal</option>
                          <option value="External">External</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mt-2">
                          <label for="floor">Floor</label>
                          <select
                            name="floor"
                            className="form-control form-select"
                            id="floor"
                          >
                            <option value="">Select Floor</option>
                          </select>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="form-group mt-2">
                          <label for="room">Room</label>
                          <select
                            name="room"
                            className="form-control form-select"
                            id="room"
                          >
                            <option value="">Select Room</option>
                          </select>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="form-group mt-2">
                          <label for="status">Status</label>
                          <select
                            name="status"
                            className="form-control form-select"
                            id="status"
                          >
                            <option value="">Select Status</option>
                          </select>
                        </div>
                      </div>

                      <div className="col-md-12">
                        <div className="form-group mt-2 w-50">
                          <label for="taggedAsset">Tagger Asset</label>
                          <input
                            type="text"
                            className="form-control"
                            id="taggedAsset"
                            name="taggedAsset"
                            placeholder=""
                          />
                        </div>
                      </div>

                      <div className="col-md-12">
                        <div className="form-group mt-2">
                          <textarea
                            className="form-control form-text"
                            placeholder="Enter Notes..."
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div
                      className="uploading-outer"
                      style={{
                        backgroundColor: "#f1f5f9",
                        display: "block",
                      }}
                    >
                      <div className="uploadPhotoButton text-center">
                        <FileUploadOutlinedIcon
                          style={{
                            color: "blue",
                            position: "relative",
                            left: "50%",
                            transform: "translate(-50%, 0)",
                          }}
                        />
                        <input
                          className="uploadButton-input mt-4"
                          type="file"
                          name="siteImage"
                          accept="image/*, application/pdf"
                          id="siteImage"
                        />
                        <label
                          htmlFor="siteImage"
                          className="text-primary cursor mt-4"
                        >
                          Click to upload
                        </label>
                        &nbsp;
                        <span>or drag and drop</span>
                        <p>
                          SVG, PNG, JPG or GIF
                          <br />
                          (max 800 * 800 px)
                        </p>
                      </div>
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
        </form>
      </Dialog>
    </React.Fragment>
  );
};

const mapStateToProps = (state) => ({});
export default connect(mapStateToProps, {})(AddPreActions);
