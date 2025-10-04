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
  const [formData, setFormData] = useState({});
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

  const handleInputChange = (e, idx) => {
    const { name, value } = e.target;
    const udata = {
      ...formData,
      [name]: value,
    };
    setFormData(udata);

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
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
    saveData(data);
    setOpen(false);
    setErrors({});

    toast.success("Energy reading added successfully");
  };

  useEffect(() => {
    setFormData({});
    setErrors({});
  }, [survey]);

  return (
    <>
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          setErrors({});
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Add Energy Readings</DialogTitle>
        <DialogContent dividers>
          <Fragment>
            <form onSubmit={save}>
              <Grid container spacing={1} rowGap={2}>
                <Grid sm={4}>
                  <label for="reference">Meter Reference</label>
                  <input
                    style={{ maxWidth: "300px" }}
                    type="reference"
                    className="form-control"
                    id="reference"
                    disabled
                    value={survey?.reference}
                  />
                </Grid>
                <Grid sm={4}>
                  <label for="reference">Usage</label>
                  <input
                    style={{ maxWidth: "300px" }}
                    type="reference"
                    className="form-control"
                    id="reference"
                    disabled
                    value={
                      formData?.readingValue
                        ? formData?.readingValue -
                        (survey?.readingList?.length > 0
                          ? survey?.readingList?.[0]?.readingValue
                          : 0)
                        : 0
                    }
                  />
                </Grid>
                <Grid sm={4}>
                  <label for="budgetCategory">Budget Category</label>
                  <select
                    name="budgetCategory"
                    className="form-control form-select"
                    id="budgetCategory"
                    value={survey?.budgetCategory}
                    onChange={handleInputChange}
                    required
                    disabled
                  >
                    <option value="">Budget Category</option>
                    {typeoptions?.map((t) => (
                      <option value={t}>{t}</option>
                    ))}
                  </select>
                </Grid>
                <Grid sm={4}>
                  <div>
                    <DatePicker
                      disabled={isView}
                      required
                      label="Reading Date"
                      value={formData?.readingDate}
                      onChange={(date) => {
                        setFormData({
                          ...formData,
                          readingDate: new Date(
                            date.getTime() - date.getTimezoneOffset() * 60000
                          ).toISOString(),
                        });
                        // Clear date error when date is selected
                        if (errors.readingDate) {
                          setErrors(prev => ({
                            ...prev,
                            readingDate: ''
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

                <Grid sm={4}>
                  <label for="readingValue">Reading</label>
                  <input
                    style={{ maxWidth: "300px" }}
                    type="number"
                    step={".01"}
                    disabled={isView}
                    className={`form-control ${errors.readingValue ? 'is-invalid' : ''}`}
                    name="readingValue"
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
                <Grid sm={4}>
                  <label for="readingUnit">Unit</label>
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
                          className={`form-control form-select ${errors.readingUnit ? 'is-invalid' : ''}`}
                          id="readingUnit"
                          value={formData?.readingUnit}
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
                <Grid sm={8}></Grid>
                <Grid sm={4}>
                  <Button
                    onClick={(e) => {
                      setOpen(false);
                      setErrors({});
                    }}
                    className="bg-light text-primary"
                  >
                    Cancel
                  </Button>
                  {!isView && (
                    <Button className="bg-primary text-white" type="submit">
                      Save
                    </Button>
                  )}
                </Grid>
                <Grid sm={12}>
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
                        {survey?.readingList?.map((d, idx) => (
                          <tr>
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