import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import moment from "moment";
import DatePicker from "../../../common/DatePicker";

import {
  Button,
  DialogContent,
  DialogTitle,
  Dialog,
  Grid,
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
    data.energyId = survey.energyId;
    saveData(data);
    setOpen(false);
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
        <DialogTitle>View Energy Readings</DialogTitle>
        <DialogContent dividers>
          <Fragment>
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
                              survey?.readingList?.length - 1
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
                  {typeoptions.map((t) => (
                    <option value={t}>{t}</option>
                  ))}
                </select>
              </Grid>
              <Grid sm={4}>
                <div>
                  <DatePicker
                    disabled={isView}
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
                <label for="readingValue">Reading</label>
                <input
                  style={{ maxWidth: "300px" }}
                  type="number"
                  disabled={isView}
                  className="form-control"
                  name="readingValue"
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid sm={4}>
                <label for="readingUnit">Unit</label>
                <select
                  disabled={isView}
                  name="readingUnit"
                  className="form-control form-select"
                  id="readingUnit"
                  value={survey?.readingUnit}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Reading Unit</option>
                  <option value="Kwh">Kwh</option>
                  <option value="M3">M³</option>
                  <option value="ltrs">ltrs</option>
                </select>
              </Grid>

              <Grid sm={12}>
                <div className="table-responsive" style={{ marginTop: "30px" }}>
                  <table className="table table-bordered f-11">
                    <thead className="table-dark">
                      <tr>
                        <th>Reading Date</th>
                        <th>Reading</th>
                        <th>Usage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {survey?.readingList?.length === 0 && (
                        <tr>
                          <td colSpan={5} align="center">
                            No record
                          </td>
                        </tr>
                      )}
                      {survey?.readingList.map((d, idx) => (
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
                            {(idx === 0
                              ? d?.readingValue
                              : d?.readingValue -
                                survey?.readingList?.[idx - 1]?.readingValue
                            )?.toFixed(2)}
                            {d.readingUnit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Grid>
              <Grid sm={4}>
                <Button
                  onClick={(e) => setOpen(false)}
                  className="bg-light text-primary"
                >
                  Cancel
                </Button>
              </Grid>
            </Grid>
          </Fragment>
        </DialogContent>
      </Dialog>
    </>
  );
};

const mapStateToProps = (state) => ({});
export default connect(mapStateToProps, {})(Reading);
