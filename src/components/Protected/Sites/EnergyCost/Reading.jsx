import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import { get, post } from "../../../../api";

import { Button, Chip, DialogContent, DialogTitle, DialogActions, Dialog, Typography, Grid, Autocomplete } from "@mui/material";

const Reading = ({ open, setOpen, survey, typeoptions, saveData, deleteEnergyReading }) => {

  const [formData, setFormData] = useState({});


  const handleInputChange = (e, idx) => {
    const { name, value } = e.target;
    const udata = {
      ...formData,
      [name]: value,
    }
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
    data.readingUnit = "kWh";
    saveData(data)
    setOpen(false);
  }

  


  return (
    <>
      <Dialog open={open} onClose={() => { setOpen(false) }} maxWidth="lg" fullWidth>
        <DialogTitle>Add Energy Readings</DialogTitle>
        <DialogContent dividers>
          <Fragment>
            <form onSubmit={save}>
            <Grid container spacing={1} rowGap={2}>
              <Grid sm={4}>
                <label for="reference">Meter Reference</label>
                <input
                 style={{ maxWidth: '300px' }}
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
                 style={{ maxWidth: '300px' }}
                  //style={{ maxWidth: '600px' }}
                  type="reference"
                  className="form-control"
                  id="reference"
                  disabled
                  value={formData?.readingValue - survey?.readingList?.[survey?.readingList?.length -1 ]?.readingValue}

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
                  {typeoptions.map(t => <option value={t}>{t}</option>)}

                </select>
              </Grid>
              <Grid sm={4}>
                  <label for="readingDate">Reading Date</label>
                <input
                  style={{ maxWidth: '300px' }}
                  type="date"
                  className="form-control"
                    name="readingDate"
                    onChange={handleInputChange}
                    required

                />
              </Grid>
              
              <Grid sm={4}>
                  <label for="readingValue">Reading</label>
                <input
                  style={{ maxWidth: '300px' }}
                  type="number"
                  className="form-control"
                    name="readingValue"
                    onChange={handleInputChange}
                    required

                />
                </Grid>
                <Grid sm={4}>
                <label for="readingUnit">Unit</label>
                <select
                  name="readingUnit"
                  className="form-control form-select"
                  id="readingUnit"
                    value={survey?.readingUnit}
                  onChange={handleInputChange}
                    required
                    
                >
                  <option value="Kwh">Kwh</option>
                  <option value="M3">M³</option>
                  <option value="ltrs">ltrs</option>
                 
                </select>
                  {/* <label for="readingUnit"></label>
                  <input
                    type="text"
                    value="kWh"
                    style={{ maxWidth: '300px' }}
                    className="form-control"
                    name="readingUnit"
                    onChange={handleInputChange}
                    disabled

                  /> */}
                </Grid>
              <Grid sm={8}>

              </Grid>
              <Grid sm={4}>
                  <Button onClick={(e) => setOpen(false)} className="bg-light text-primary">
                  Cancel
                  </Button>
                  <Button className="bg-primary text-white" type="submit">
                  Save
                  </Button>
              </Grid>
              <Grid sm={12}>
                <div className="table-responsive" style={{ marginTop: '30px' }} >
                  <table className="table table-bordered f-11">
                    <thead className="table-dark">
                      <tr>
                        <th>Reading Date</th>
                        <th>Reading</th>
                        <th>Usage</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                      <tbody>
                        {survey?.readingList?.length === 0 && (
                          <tr>
                            <td colSpan={5} align="center">No record</td>
                          </tr>
                        )}
                        {survey?.readingList.map((d, idx) => (<tr>
                          <td>
                            {String(d?.readingDate)?.substring(0, 10)}
                            </td>
                          <td>
                            {d.readingValue} {d.readingUnit}
                            </td>
                          <td>
                          {idx === 0 ? d?.readingValue : (d?.readingValue - survey?.readingList?.[idx - 1 ]?.readingValue)}{d.readingUnit}

                           
                            </td>
                          
                          <td>
                            <button
                              className="btn btn-sm btn-light text-dark"
                              onClick={() => deleteEnergyReading(d?.readingId)}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                            </td>
                          
                          </tr>)
                        )}
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
export default connect(mapStateToProps, { })(
  Reading
);

