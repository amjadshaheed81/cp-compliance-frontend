import React, { Fragment, useEffect, useState } from "react";
import { Button, Box } from "@mui/material";
import { connect } from "react-redux";
import { useForm } from "react-hook-form";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import CircularProgress from "@mui/material/CircularProgress";
import DialogTitle from "@mui/material/DialogTitle";
import { addUser, getSites } from "../../../store/thunk/site";
import { toast } from "react-toastify";

const ViewUsers = ({
  showEditModal,
  setShowEditModal,
  refresh,
  selectedUser,
  sites,
  getSites,
  addUser,
}) => {
  const handleOpen = () => setShowEditModal(true);
  const handleClose = () => setShowEditModal(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register, reset, watch } = useForm({});
  const values = watch();
  useEffect(() => {
    console.log("selectedUser", selectedUser);
    reset(selectedUser);
    getSites();
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
          onSubmit: async (event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const formJson = Object.fromEntries(formData.entries());
            console.log("formJson", formJson)
            const data = {
              userId: selectedUser?.id,
              firstName: formJson?.firstName || null,
              lastName: formJson?.lastName || null,
              email: formJson?.email || null,
              phone: Number(formJson?.phone) || null,
              role: formJson?.role || null,
              userType: formJson?.userType || null,
              defaultSiteId: formJson?.userType === 'Internal' ? Number(formJson?.tagSite) : null,
              company: formJson?.company || null,
              trade: formJson?.userType === 'External' ? formJson?.trade : null,
              status: formJson?.status || null,
            };
            setIsLoading(true);
            try {
              const res = await addUser(data);
              if (res === "success") {
                toast.success("User has been added successfully.");
                refresh();
                reset({});
                handleClose();
              } else {
                toast.error("Something went wrong while adding user.");
              }
              setIsLoading(false);
            } catch (e) {
              setIsLoading(false);
            }
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
                    <label for="role">Role</label>
                    <select
                      {...register("role")}
                      className="form-control form-select"
                    >
                      <option value={""} disabled selected>
                        Select Action Manager
                      </option>
                      <option value={"Admin"}>Admin</option>
                      <option value={"Property Manager"}>
                        Property Manager
                      </option>
                      <option value={"Site Action Manager"}>
                        Site Action Manager
                      </option>
                      <option value={"Site Users"}>Site Users</option>
                      <option value={"Care Taker"}>Care Taker</option>
                      <option value={"Contractor"}>Contractor</option>
                      <option value={"Surveyor"}>Surveyor</option>
                      <option value={"Tradesman"}>Tradesman</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-4 mt-2">
                  <div className="form-group">
                    <label for="userType">Internal/External</label>
                    <select
                      id="userType"
                      name="userType"
                      {...register("userType")}
                      className="form-control form-select"
                    >
                      <option value={"Internal"}>Internal</option>
                      <option value={"External"}>External</option>
                    </select>
                  </div>
                </div>
                {values?.userType === "Internal" && (
                  <div className="col-md-4 mt-2">
                    <div className="form-group">
                      <label for="tagSite">Tag Site (if internal)</label>
                      <select
                        id="tagSite"
                        name="tagSite"
                        {...register("tagSite")}
                        className="form-control form-select"
                      >
                        <option value={""} selected disabled>
                          Tag Site
                        </option>
                        {sites?.map((itm) => (
                          <option value={itm?.siteId} key={itm?.siteId}>
                            {itm?.siteName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
                <div className="col-md-4 mt-2">
                  <div className="form-group">
                    <label for="company">Company Name</label>
                    <input
                      type="text"
                      className="form-control"
                      id="company"
                      {...register("company")}
                    />
                  </div>
                </div>
                {values?.userType === "External" && (
                  <div className="col-md-4 mt-2">
                    <div className="form-group">
                      <label for="trade">Trade (if external)</label>
                      <select
                        id="trade"
                        name="trade"
                        {...register("trade")}
                        className="form-control form-select"
                      >
                        <option value={""} selected>
                          NA
                        </option>
                        <option value={"Electrician"}>Electrician</option>
                        <option value={"Gas Engineer"}>Gas Engineer</option>
                        <option value={"Asbestos Surveyor"}>
                          Asbestos Surveyor
                        </option>
                        <option value={"AC Engineer"}>AC Engineer</option>
                        <option value={"Fire Door Install"}>
                          Fire Door Install
                        </option>
                        <option value={"General Company"}>
                          General Company
                        </option>
                        <option value={"Life Maintenance"}>
                          Life Maintenance
                        </option>
                        <option value={"Plumber"}>Plumber</option>
                        <option value={"Auto Door Maintanance"}>
                          Auto Door Maintanance
                        </option>
                        <option value={"Refuse Collector"}>
                          Refuse Collector
                        </option>
                        <option value={"Fire Alarm"}>Fire Alarm</option>
                      </select>
                    </div>
                  </div>
                )}
                {values?.tagSite && (
                  <div className="col-md-4 mt-2">
                    <div className="form-group">
                      <label for="trade">Selected Sites</label>
                      <div>
                        <button className="btn btn-sm btn-light text-primary">
                          {
                            sites?.filter(
                              (itm) => itm.siteId == values?.tagSite
                            )?.[0]?.siteName
                          }
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                <div className="col-md-4 mt-2">
                  <div className="form-group">
                    <label for="status">Status</label>
                    <select
                      id="status"
                      name="status"
                      {...register("status")}
                      className="form-control form-select"
                    >
                      <option value={""} disabled selected>
                        Select Status
                      </option>
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

const mapStateToProps = (state) => ({
  sites: state.site.sites,
});
export default connect(mapStateToProps, { getSites, addUser })(ViewUsers);
