import React, { Fragment, useEffect, useState } from "react";
import { Button, Box } from "@mui/material";
import { connect } from "react-redux";
import { useForm } from "react-hook-form";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import CircularProgress from "@mui/material/CircularProgress";
import DialogTitle from "@mui/material/DialogTitle";
import { getSites, addUser } from "../../../store/thunk/site";
import { getCurrentDate } from "../../../utils/dateMethod";
import { toast } from "react-toastify";
import { Validation } from "../../../Constant/Validation";
import { InputError } from "../../common/InputError";

const AddUser = ({
  showAddModal,
  setShowAddModal,
  refresh,
  selectedUser,
  getSites,
  sites,
  addUser,
}) => {
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
    reset(selectedUser);
    getSites();
  }, []);
  const submitUser = async (formJson) => {
    const data = {
      userId: null,
      firstName: formJson?.firstName || null,
      lastName: formJson?.lastName || null,
      email: formJson?.email || null,
      password: formJson?.password || null,
      phone: Number(formJson?.phone) || null,
      role: formJson?.role || null,
      userType: formJson?.userType || null,
      defaultSiteId:
        formJson?.userType === "Internal" ? Number(formJson?.tagSite) : null,
      company: formJson?.company || null,
      trade: formJson?.userType === "External" ? formJson?.trade : null,
      status: formJson?.status || null,
    };
    setIsLoading(true);
    try {
      const res = await addUser(data);
      if (res === "success") {
        toast.success(`${formJson?.firstName} has been added successfully.`);
        refresh();
        reset({});
        handleClose();
      } else {
        toast.error(
          `Something went wrong while adding ${formJson?.firstName}.`
        );
      }
      setIsLoading(false);
    } catch (e) {
      setIsLoading(false);
    }
  };
  return (
    <React.Fragment>
      <Dialog open={showAddModal} onClose={handleClose} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(submitUser)}>
          <DialogTitle>Add User</DialogTitle>
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
                        {...register("firstName", {
                          required: {
                            value: true,
                            message: `${Validation.REQUIRED} first name`,
                          },
                        })}
                      />
                      {errors?.firstName && (
                        <InputError
                          message={errors?.firstName?.message}
                          key={errors?.firstName?.message}
                        />
                      )}
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
                        {...register("email", {
                          required: {
                            value: true,
                            message: `${Validation.REQUIRED} email`,
                          },
                        })}
                      />
                      {errors?.email && (
                        <InputError
                          message={errors?.email?.message}
                          key={errors?.email?.message}
                        />
                      )}
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label for="password">Password</label>
                      <input
                        type="password"
                        className="form-control"
                        id="password"
                        {...register("password", {
                          required: {
                            value: true,
                            message: `${Validation.REQUIRED} password`,
                          },
                        })}
                      />
                      {errors?.password && (
                        <InputError
                          message={errors?.password?.message}
                          key={errors?.password?.message}
                        />
                      )}
                    </div>
                  </div>
                  <div className="col-md-4 mt-2">
                    <div className="form-group">
                      <label for="phone">Phone Number</label>
                      <input
                        type="text"
                        className="form-control"
                        id="phone"
                        {...register("phone", {
                          required: {
                            value: true,
                            message: `${Validation.REQUIRED} phone`,
                          },
                        })}
                      />
                      {errors?.phone && (
                        <InputError
                          message={errors?.phone?.message}
                          key={errors?.phone?.message}
                        />
                      )}
                    </div>
                  </div>
                  <div className="col-md-4 mt-2">
                    <div className="form-group">
                      <label for="role">Role</label>
                      <select
                        {...register("role", {
                          required: {
                            value: true,
                            message: `Please select role.`,
                          },
                        })}
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
                      {errors?.role && (
                        <InputError
                          message={errors?.role?.message}
                          key={errors?.role?.message}
                        />
                      )}
                    </div>
                  </div>
                  <div className="col-md-4 mt-2">
                    <div className="form-group">
                      <label for="userType">Internal/External</label>
                      <select
                        id="userType"
                        name="userType"
                        {...register("userType", {
                          required: {
                            value: true,
                            message: `Please select user type.`,
                          },
                        })}
                        className="form-control form-select"
                      >
                        <option value={""} selected disabled>
                          Select Internal/External
                        </option>
                        <option value={"Internal"}>Internal</option>
                        <option value={"External"}>External</option>
                      </select>
                      {errors?.userType && (
                        <InputError
                          message={errors?.userType?.message}
                          key={errors?.userType?.message}
                        />
                      )}
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
                        {...register("company", {
                          required: {
                            value: true,
                            message: `Please enter company name.`,
                          },
                        })}
                      />
                      {errors?.company && (
                        <InputError
                          message={errors?.company?.message}
                          key={errors?.company?.message}
                        />
                      )}
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
                        {...register("status", {
                          required: {
                            value: true,
                            message: `Please select user status.`,
                          },
                        })}
                        className="form-control form-select"
                      >
                        <option value={""} disabled selected>
                          Select Status
                        </option>
                        <option value={"Active"}>Active</option>
                        <option value={"Inactive"}>Inactive</option>
                      </select>
                      {errors?.status && (
                        <InputError
                          message={errors?.status?.message}
                          key={errors?.status?.message}
                        />
                      )}
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

const mapStateToProps = (state) => ({
  sites: state.site.sites,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
});
export default connect(mapStateToProps, { getSites, addUser })(AddUser);
