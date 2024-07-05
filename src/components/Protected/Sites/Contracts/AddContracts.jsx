import React, { Fragment, useState } from "react";
import { Button, Box } from "@mui/material";
import { connect } from "react-redux";
import { useForm } from "react-hook-form";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import CircularProgress from "@mui/material/CircularProgress";
import DialogTitle from "@mui/material/DialogTitle";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import { InputError } from "../../../common/InputError";
import { toast } from "react-toastify";
import { Validation } from "../../../../Constant/Validation";

const AddContracts = ({
  showAddModal,
  setShowAddModal,
  refresh,
  createUpdatePreActions,
  loggedInUserData,
  siteSelectedForGlobal,
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
  const submitPreActions = async (data) => {
    // let form_data = new FormData();
    if (!siteSelectedForGlobal?.siteId) {
      toast.error("Please select site from site search to proceed.");
      return;
    }
    if (loggedInUserData?.id) {
      console.log("data", data);
      setIsLoading(false);
      handleClose();
      refresh();
    } else {
      toast.error("Please login with valid user details to proceed.");
    }
  };
  return (
    <React.Fragment>
      <Dialog open={showAddModal} onClose={handleClose} maxWidth="lg" fullWidth>
        <form onSubmit={handleSubmit(submitPreActions)}>
          <DialogTitle>New Contract</DialogTitle>
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
                    <div className="row">
                      <div className="col-md-3">
                        <div className="form-group">
                          <label for="summary">Summary</label>
                          <input
                            type="text"
                            className="form-control"
                            id="summary"
                            {...register("summary", {
                              required: {
                                value: true,
                                message: `${Validation.REQUIRED} summary`,
                              },
                            })}
                          />
                          {errors?.summary && (
                            <InputError
                              message={errors?.summary?.message}
                              key={errors?.summary?.message}
                            />
                          )}
                        </div>
                      </div>
                      <div className="col-md-3">
                        <label for="category">Category</label>
                        <select
                          name="category"
                          className="form-control form-select"
                          id="category"
                          {...register("category", {
                            required: {
                              value: true,
                              message: `Please select category`,
                            },
                          })}
                        >
                          <option value="" selected disabled>
                            Select category
                          </option>
                        </select>
                        {errors?.category && (
                          <InputError
                            message={errors?.category?.message}
                            key={errors?.category?.message}
                          />
                        )}
                      </div>
                      <div className="col-md-3">
                        <label for="subCategory">Sub Category</label>
                        <select
                          name="subCategory"
                          className="form-control form-select"
                          id="subCategory"
                          {...register("subCategory", {
                            required: {
                              value: true,
                              message: `Please select sub category`,
                            },
                          })}
                        >
                          <option value="" selected disabled>
                            Select sub category
                          </option>
                        </select>
                        {errors?.subCategory && (
                          <InputError
                            message={errors?.subCategory?.message}
                            key={errors?.subCategory?.message}
                          />
                        )}
                      </div>
                      <div className="col-md-3">
                        <label for="company">Company</label>
                        <select
                          name="company"
                          className="form-control form-select"
                          id="company"
                          {...register("company", {
                            required: {
                              value: true,
                              message: `Please select company`,
                            },
                          })}
                        >
                          <option value="" selected disabled>
                            Select company
                          </option>
                        </select>
                        {errors?.company && (
                          <InputError
                            message={errors?.company?.message}
                            key={errors?.company?.message}
                          />
                        )}
                      </div>
                      <div className="col-md-3">
                        <div className="form-group">
                          <label for="budget">Budget (GBP)</label>
                          <input
                            type="number"
                            className="form-control"
                            id="budget"
                            {...register("budget", {
                              required: {
                                value: true,
                                message: `${Validation.REQUIRED} budget`,
                              },
                            })}
                          />
                          {errors?.budget && (
                            <InputError
                              message={errors?.budget?.message}
                              key={errors?.budget?.message}
                            />
                          )}
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="form-group">
                          <label for="cost">Cost</label>
                          <input
                            type="number"
                            className="form-control"
                            id="cost"
                            {...register("cost", {
                              required: {
                                value: true,
                                message: `${Validation.REQUIRED} cost`,
                              },
                            })}
                          />
                          {errors?.cost && (
                            <InputError
                              message={errors?.cost?.message}
                              key={errors?.cost?.message}
                            />
                          )}
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="form-group">
                          <label for="startDate">Start Date</label>
                          <input
                            type="date"
                            className="form-control date-input"
                            id="startDate"
                            {...register("startDate", {
                              required: {
                                value: true,
                                message: `${Validation.REQUIRED} start date`,
                              },
                            })}
                          />
                          {errors?.startDate && (
                            <InputError
                              message={errors?.startDate?.message}
                              key={errors?.startDate?.message}
                            />
                          )}
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="form-group">
                          <label for="endDate">End Date</label>
                          <input
                            type="date"
                            className="form-control date-input"
                            id="endDate"
                            {...register("endDate", {
                              required: {
                                value: true,
                                message: `${Validation.REQUIRED} end date`,
                              },
                            })}
                          />
                          {errors?.endDate && (
                            <InputError
                              message={errors?.endDate?.message}
                              key={errors?.endDate?.message}
                            />
                          )}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mt-2">
                          <textarea
                            {...register("description")}
                            className="form-control form-text"
                            placeholder="Enter Notes..."
                          ></textarea>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <label for="manager">Manager</label>
                        <select
                          name="manager"
                          className="form-control form-select"
                          id="manager"
                          {...register("manager")}
                        >
                          <option value="" selected disabled>
                            Select manager
                          </option>
                        </select>
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
                Cancel
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
  loggedInUserData: state.site.loggedInUserData,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
});
export default connect(mapStateToProps, {})(AddContracts);
