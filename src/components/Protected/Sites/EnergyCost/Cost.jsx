import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import { get, post } from "../../../../api";

import { Button, Chip, DialogContent, DialogTitle, DialogActions, Dialog, Typography, Grid, Autocomplete } from "@mui/material";

const Cost = ({ open, setOpen, survey, typeoptions, saveData, deleteEnergyCost }) => {

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
     
    data.fromDate = new Date(data.fromDate);
    data.toDate = new Date(data.toDate);
    data.energyId = survey.energyId;
    saveData(data)
    setOpen(false);
  }

  


  return (
    <>
      <Dialog open={open} onClose={() => { setOpen(false) }} maxWidth="lg" fullWidth>
        <DialogTitle>Add Energy Cost</DialogTitle>
        <DialogContent dividers>
          <Fragment>
            <form onSubmit={save}>
            <Grid container spacing={1} rowGap={2}>
              <Grid sm={8}>
                <label for="reference">Survey Reference</label>
                <input
                  style={{ maxWidth: '600px' }}
                  type="reference"
                  className="form-control"
                  id="reference"
                  disabled
                  value={survey?.reference}

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
                <label for="fromDate">From Date</label>
                <input
                  style={{ maxWidth: '300px' }}
                  type="date"
                  className="form-control"
                  name="fromDate"
                    onChange={handleInputChange}
                    required

                />
              </Grid>
              <Grid sm={4}>
                <label for="toDate">To Date</label>
                <input
                    type="date"
                  style={{ maxWidth: '300px' }}
                  className="form-control"
                  name="toDate"
                    onChange={handleInputChange}
                    required

                />
              </Grid>
              <Grid sm={4}>
                <label for="cost">Cost (GBP)</label>
                <input
                  style={{ maxWidth: '300px' }}
                  type="number"
                  className="form-control"
                  name="cost"
                    onChange={handleInputChange}
                    required

                />
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
                        <th>Budget Category </th>
                        <th>From Date</th>
                        <th>To Date</th>
                        <th>Cost (GBP)</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                      <tbody>
                        {survey?.costList?.length === 0 && (
                          <tr>
                            <td colSpan={5} align="center">No record</td>
                          </tr>
                        )}
                        {survey?.costList.map((d, idx) => (<tr>
                          <td>
                            {d.budgetCategory}
                            </td>
                          <td>
                            {String(d?.fromDate)?.substring(0, 10)}
                            </td>
                          <td>
                            {String(d?.toDate)?.substring(0, 10)}
                            </td>
                          <td>
                            {d.cost}
                            </td>
                          <td>
                            <button
                              className="btn btn-sm btn-light text-dark"
                              onClick={() => deleteEnergyCost(d?.costId)}
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
  Cost
);

