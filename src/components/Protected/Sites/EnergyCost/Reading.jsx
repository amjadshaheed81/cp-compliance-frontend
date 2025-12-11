import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import { get, post } from "../../../../api";
import moment from "moment";
import DatePicker from "../../../common/DatePicker";

import {
  Button,
  Chip,
  DialogContent,
  DialogTitle,
  DialogActions,
  Dialog,
  Typography,
  Grid,
  Autocomplete,
} from "@mui/material";

const Reading = ({
  open,
  setOpen,
  survey,
  typeoptions,
  saveData,
  deleteEnergyReading,
  isViewMode,
}) => {
  const [formData, setFormData] = useState({
    readingDate: "",
    readingValue: "",
    readingUnit: "",
  });
  const [isView, setIsView] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setIsView(isViewMode);
  }, [isViewMode]);

  useEffect(() => {
    if (survey?.budgetCategory === "Electricity") {
      setFormData((prev) => ({
        ...prev,
        readingUnit: "Kwh",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        readingUnit: prev.readingUnit || "",
      }));
    }
  }, [survey]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const udata = {
      ...formData,
      [name]: value,
    };
    setFormData(udata);

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.readingDate) {
      newErrors.readingDate = "Reading date is required";
    }

    if (!formData.readingValue) {
      newErrors.readingValue = "Reading value is required";
    }

    if (!formData.readingUnit) {
      newErrors.readingUnit = "Reading unit is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const save = async (event) => {
    event.preventDefault();
    event.stopPropagation(); // Prevent event bubbling

    // Validate form before submission
    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }

    const data = { ...formData };
    data.readingDate = new Date(data.readingDate);

    if (survey?.budgetCategory === "Electricity") {
      data.readingUnit = "Kwh";
    }

    data.energyId = survey.energyId;

    // Reset form after successful save
    setFormData({
      readingDate: "",
      readingValue: "",
      readingUnit: survey?.budgetCategory === "Electricity" ? "Kwh" : "",
    });

    saveData(data);
    setErrors({});
    toast.success("Energy reading added successfully");
  };

  useEffect(() => {
    // Reset form when survey changes or dialog opens
    setFormData({
      readingDate: "",
      readingValue: "",
      readingUnit: survey?.budgetCategory === "Electricity" ? "Kwh" : "",
    });
    setErrors({});
  }, [survey, open]);

  const handleClose = () => {
    setOpen(false);
    setErrors({});
    setFormData({
      readingDate: "",
      readingValue: "",
      readingUnit: survey?.budgetCategory === "Electricity" ? "Kwh" : "",
    });
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
        <DialogTitle>Add Energy Readings</DialogTitle>
        <DialogContent dividers>
          <Fragment>
            <form onSubmit={save}>
              <Grid container spacing={1} rowGap={2}>
                <Grid item xs={12} sm={4}>
                  <label htmlFor="reference">Meter Reference</label>
                  <input
                    style={{ maxWidth: "300px" }}
                    type="text"
                    className="form-control"
                    id="reference"
                    disabled
                    value={survey?.reference || ""}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <label htmlFor="usage">Usage</label>
                  <input
                    style={{ maxWidth: "300px" }}
                    type="text"
                    className="form-control"
                    id="usage"
                    disabled
                    value={
                      formData?.readingValue
                        ? (
                            formData?.readingValue -
                            (survey?.readingList?.length > 0
                              ? survey?.readingList?.[0]?.readingValue
                              : 0)
                          ).toFixed(2)
                        : "0"
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <label htmlFor="budgetCategory">Budget Category</label>
                  <select
                    name="budgetCategory"
                    className="form-control form-select"
                    id="budgetCategory"
                    value={survey?.budgetCategory || ""}
                    onChange={handleInputChange}
                    required
                    disabled
                  >
                    <option value="">Budget Category</option>
                    {typeoptions?.map((t, index) => (
                      <option key={index} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <div>
                    <DatePicker
                      disabled={isView}
                      required
                      label="Reading Date"
                      value={formData?.readingDate || ""}
                      onChange={(date) => {
                        // Handle null/undefined date
                        if (!date) {
                          setFormData({
                            ...formData,
                            readingDate: "",
                          });
                          // Clear date error when date is cleared
                          if (errors.readingDate) {
                            setErrors((prev) => ({
                              ...prev,
                              readingDate: "",
                            }));
                          }
                          return;
                        }

                        // Date is valid, process it
                        setFormData({
                          ...formData,
                          readingDate: new Date(
                            date.getTime() - date.getTimezoneOffset() * 60000
                          ).toISOString(),
                        });
                        // Clear date error when date is selected
                        if (errors.readingDate) {
                          setErrors((prev) => ({
                            ...prev,
                            readingDate: "",
                          }));
                        }
                      }}
                      error={!!errors.readingDate}
                      helperText={errors.readingDate}
                    />
                    {errors.readingDate && (
                      <div className="text-danger small mt-1">
                        {errors.readingDate}
                      </div>
                    )}
                  </div>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <label htmlFor="readingValue">Reading</label>
                  <input
                    style={{ maxWidth: "300px" }}
                    type="number"
                    step="0.01"
                    disabled={isView}
                    className={`form-control ${
                      errors.readingValue ? "is-invalid" : ""
                    }`}
                    name="readingValue" // Added name attribute
                    id="readingValue"
                    value={formData.readingValue || ""}
                    onChange={handleInputChange}
                    required
                    min="0"
                  />
                  {errors.readingValue && (
                    <div className="text-danger small mt-1">
                      {errors.readingValue}
                    </div>
                  )}
                </Grid>
                <Grid item xs={12} sm={4}>
                  <label htmlFor="readingUnit">Unit</label>
                  {survey?.budgetCategory === "Electricity" ? (
                    <input
                      style={{ maxWidth: "300px" }}
                      type="text"
                      className="form-control"
                      value="Kwh"
                      disabled
                    />
                  ) : (
                    <>
                      <select
                        disabled={isView}
                        name="readingUnit"
                        className={`form-control form-select ${
                          errors.readingUnit ? "is-invalid" : ""
                        }`}
                        id="readingUnit"
                        value={formData?.readingUnit || ""}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Reading Unit</option>
                        <option value="Kwh">Kwh</option>
                        <option value="M3">M³</option>
                        <option value="ltrs">ltrs</option>
                      </select>
                      {errors.readingUnit && (
                        <div className="text-danger small mt-1">
                          {errors.readingUnit}
                        </div>
                      )}
                    </>
                  )}
                </Grid>
                <Grid item xs={12} sm={8}></Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    onClick={handleClose}
                    className="bg-light text-primary"
                  >
                    Cancel
                  </Button>
                  {!isView && (
                    <Button
                      className="bg-primary text-white"
                      type="submit"
                      variant="contained"
                    >
                      Save
                    </Button>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <div
                    className="table-responsive"
                    style={{ marginTop: "30px" }}
                  >
                    <table className="table table-bordered f-11">
                      <thead className="table-dark">
                        <tr>
                          <th>Reading Date</th>
                          <th>Reading</th>
                          <th>Usage</th>
                          {!isView && <th>Action</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {survey?.readingList?.sort(
                          (a, b) =>
                            new Date(b.readingDate) - new Date(a.readingDate)
                        )?.length === 0 && (
                          <tr>
                            <td colSpan={5} align="center">
                              No record
                            </td>
                          </tr>
                        )}
                        {survey?.readingList
                          ?.sort(
                            (a, b) =>
                              new Date(b.readingDate) - new Date(a.readingDate)
                          )
                          ?.map((d, idx) => (
                            <tr key={d.readingId || idx}>
                              <td>
                                {d?.readingDate
                                  ? moment(d?.readingDate).format("DD/MM/YYYY")
                                  : "-"}
                              </td>
                              <td>
                                {d.readingValue} {d.readingUnit}
                              </td>
                              <td>
                                {(idx === survey?.readingList?.length - 1
                                  ? d?.readingValue
                                  : d?.readingValue -
                                    survey?.readingList?.[idx + 1]?.readingValue
                                )?.toFixed(2)}
                                {d.readingUnit}
                              </td>
                              {!isView && (
                                <td>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-light text-dark"
                                    onClick={() =>
                                      deleteEnergyReading(d?.readingId)
                                    }
                                  >
                                    <i className="fas fa-trash"></i>
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </Grid>
              </Grid>
            </form>
          </Fragment>
        </DialogContent>
      </Dialog>
    </>
  );
};

const mapStateToProps = (state) => ({});
export default connect(mapStateToProps, {})(Reading);
