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
  useEffect(() => {
    setIsView(isViewMode);
  }, [isViewMode]);

  const handleInputChange = (e, idx) => {
    const { name, value } = e.target;
    const udata = {
      ...formData,
      [name]: value,
    };
    setFormData(udata);
  };

  const save = async (event) => {
    event.preventDefault();
    const form = event.target;
    if (!form.checkValidity()) {
      form.reportValidity();
    }
    const data = { ...formData };

    data.readingDate = new Date(data.readingDate);
    data.readingUnit = survey?.budgetCategory === "Gas" ? "M3" : "Kwh"

    data.energyId = survey.energyId;
    saveData(data);
    setOpen(false);

    toast.success("Energy reading added successfully");
    
  };

  useEffect(() => {
    setFormData({});
  }, [survey]);

  return (
    <>
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
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
                    //style={{ maxWidth: '600px' }}
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
                    //style={{ maxWidth: '600px' }}
                    type="reference"
                    className="form-control"
                    id="reference"
                    disabled
                    value={
                      formData?.readingValue
                        ? formData?.readingValue -
                          (survey?.readingList?.length > 0
                            ? survey?.readingList?.[
                                0
                              ]?.readingValue
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
                      }}
                    />
                  </div>
                  {/* <label for="readingDate">Reading Date</label>
                <input
                  style={{ maxWidth: '300px' }}
                  type="date"
                  className="form-control"
                    name="readingDate"
                    onChange={handleInputChange}
                    required

                /> */}
                </Grid>

                <Grid sm={4}>
                  <label for="readingValue">Reading 2</label>
                  <input
                    style={{ maxWidth: "300px" }}
                    type="number"
                    step={".01"}
                    disabled={isView}
                    className="form-control"
                    name="readingValue"
                    onChange={handleInputChange}
                    required
                    min="0"
                  />
                </Grid>
                <Grid sm={4}>
                  <label for="readingUnit">Unit</label>
                  <select
                    //disabled={isView}
                    name="readingUnit"
                    className="form-control form-select"
                    id="readingUnit"
                    value={survey?.budgetCategory === "Gas" ?  "M3" : "Kwh"}
                    //onChange={handleInputChange}
                    disabled
                    required
                  >
                    <option value="">Reading Unit</option>
                    <option value="Kwh">Kwh</option>
                    <option value="M3">M³</option>
                    <option value="ltrs">ltrs</option>
                  </select>
                  {/* <label for="readingUnit"></label>
                  <input
                    type="text"
autoComplete="off"
          readOnly
          onFocus={(e) => e.target.removeAttribute("readonly")}
                    value="kWh"
                    style={{ maxWidth: '300px' }}
                    className="form-control"
                    name="readingUnit"
                    onChange={handleInputChange}
                    disabled

                  /> */}
                </Grid>
                <Grid sm={8}></Grid>
                <Grid sm={4}>
                  <Button
                    onClick={(e) => setOpen(false)}
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
                        {survey?.readingList?.sort((a, b) => new Date(b.readingDate) - new Date(a.readingDate))?.length === 0 && (
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
                              {/* {String(d?.readingDate)?.substring(0, 10)} */}
                            </td>
                            <td>
                              {d.readingValue} {d.readingUnit}
                            </td>
                            <td>
                              {(idx === (survey?.readingList?.length - 1)
                                ? d?.readingValue
                                : d?.readingValue -
                                  survey?.readingList?.[idx + 1]?.readingValue)?.toFixed(2)}
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
