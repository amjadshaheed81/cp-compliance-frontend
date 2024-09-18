import React, { Fragment, useState } from "react";
import { Button, Box } from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import CircularProgress from "@mui/material/CircularProgress";
import DialogTitle from "@mui/material/DialogTitle";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import { put} from "../../../api";
import moment from "moment";

const ViewUsers = ({
  showModal,
  setShowModal,
  refresh,
  selectedUser
}) => {
  const handleOpen = () => setShowModal(true);
  const handleClose = () => setShowModal(false);

  const [password, setPassword] = useState()
  const [isLoading, setIsLoading] = useState(false);

  const resetPassword = async(event) => {
    event.preventDefault();
    const form = event.target;
    if (!form.checkValidity()) {
      form.reportValidity();
    }
    const data = {
      userId: selectedUser?.id,
     password: password
    };
    setIsLoading(true);
    await put("/api/user/password",data);
    setIsLoading(false);
    handleClose();
    toast.success(
      `Password has been updated successfully.`
    );

  }
  

  return (
    <React.Fragment>
       <form onSubmit={resetPassword}>
      <Dialog
        open={showModal}
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
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent dividers>
          {isLoading && (
            <Box sx={{ display: "flex" }}>
              <CircularProgress />
            </Box>
          )}
          {!isLoading && (
            <Fragment>
              <div className="row">
                  
                  <div className="col-md-12">
                    <div className="form-group">
                      <label for="email">Email ID</label>
                      <input
                        type="email"
                        className="form-control"
                        id="email"
                        value={selectedUser?.email}
                        disabled
                      />
      
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="form-group">
                      <label for="password">Password</label>
                      <input
                        type="password"
                        className="form-control"
                        id="password"
                        required
                        onChange={(e)=>setPassword(e.target.value)}
                      />
                      
                    </div>
                  </div>
                  </div>
            </Fragment>
          )}
        </DialogContent>
        {!isLoading && (
          <DialogActions>
            <Button type="button" onClick={handleClose}>Close</Button>
            <Button type="submit" className="bg-primary text-white">
                Save
              </Button>
          </DialogActions>
          
        )}
      </Dialog>
      </form>
    </React.Fragment>
  );
};

const mapStateToProps = () => ({});
export default connect(mapStateToProps, {})(ViewUsers);
