import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import Header from "../../common/Header/Header";
import BreadCrumHeader from "../../common/BreadCrumHeader/BreadCrumHeader";
import SidebarNew from "../../common/Sidebar/SidebarNew";
import { get, post, del, put } from "../../../api";
import CircularProgress from '@mui/material/CircularProgress';
import { Button, DialogContent, DialogTitle, DialogActions, Dialog, Grid } from "@mui/material";
import { toast } from "react-toastify";

const CompanyManagement = ({ }) => {
  const [data, setData] = useState([]);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [addNewDrp, setAddNewDrp] = useState(false);

  useEffect(() => {
    getCompany();
  }, []);

  const getCompany = async () => {
    setIsLoading(true);
    const companyData = await get("/api/companies/all");
    setData(companyData);
    setIsLoading(false);
  };

  const validateFields = (data) => {
    let errors = {};
    if (!data.companyName) {
      errors.companyName = "Company Name is required";
    }
    if (!data.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(data.email)) {
      errors.email = "Email is invalid";
    }
    if (!data.phone) {
      errors.phone = "Phone is required";
    } else if (!/^\d{11}$/.test(data.phone)) {
      errors.phone = "Phone must be 11 digits";
    }
    return errors;
  };

  const editData = (idx) => {
    const inProgress = data.findIndex(d => d.edit || d.add);
    if (inProgress >= 0) {
      toast.error("Please save existing data");
      return;
    }
    const udata = [...data];
    udata[idx].edit = true;
    setData(udata);
  };

  const cancel = (idx) => {
    const udata = [...data];
    if (udata[idx].add) {
      udata.splice(idx, 1);
    } else {
      udata[idx].edit = false;
    }
    setData(udata);
  };

  const deletData = async (idx) => {
    setIsLoading(true);
    const dataTSave = { ...data[idx] };
    await del(`api/companies/${dataTSave.companyId}/delete`);
    getCompany();
  };

  const save = async (idx) => {
    const dataTSave = { ...data[idx] };
    const validationErrors = validateFields(dataTSave);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    if (dataTSave.add) {
      await put("/api/companies/manage", dataTSave);
    } else {
      await put("/api/companies/manage", dataTSave);
    }
    getCompany();
  };

  const saveNew = async () => {
    const validationErrors = validateFields(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    await put("/api/companies/manage", formData);
    setAddNewDrp(false);
    getCompany();
  };

  const handleInputChange = (e, idx) => {
    const { name, value } = e.target;
    const uAllData = [...data];
    const udata = {
      ...data[idx],
      [name]: value,
    };
    uAllData[idx] = udata;
    setData(uAllData);
  };

  const handleInputChange2 = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  return (
    <Fragment>
      <SidebarNew />
      <Dialog open={addNewDrp} onClose={() => { setAddNewDrp(false); }} maxWidth="lg" fullWidth>
        <DialogTitle>Add New Company</DialogTitle>
        <DialogContent dividers>
          <Fragment>
            <Grid container>
              <Grid sm={4}>
                <label htmlFor="companyName">Company Name</label>
                <input
                  style={{ maxWidth: '300px' }}
                  type="text"
autoComplete="off"
                  className="form-control"
                  name="companyName"
                  onChange={handleInputChange2}
                />
                {errors.companyName && <span className="text-danger">{errors.companyName}</span>}
              </Grid>
              <Grid sm={4}>
                <label htmlFor="email">Email</label>
                <input
                  style={{ maxWidth: '300px' }}
                  type="text"
autoComplete="off"
                  className="form-control"
                  name="email"
                  onChange={handleInputChange2}
                />
                {errors.email && <span className="text-danger">{errors.email}</span>}
              </Grid>
              <Grid sm={4}>
                <label htmlFor="phone">Phone</label>
                <input
                  style={{ maxWidth: '300px' }}
                  type="tel"
                  maxLength={11}
                  className="form-control"
                  name="phone"
                  onChange={handleInputChange2}
                />
                {errors.phone && <span className="text-danger">{errors.phone}</span>}
              </Grid>
            </Grid>
          </Fragment>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddNewDrp(false)} className="bg-light text-primary">
            Cancel
          </Button>
          <Button className="bg-primary text-white" onClick={saveNew}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <div className="content">
        <Header />
        <div className="container-fluid">
          <BreadCrumHeader header={"Company Management"} page={"Manage"} />

          <Grid container>
            <Grid sm={12}>
              <button
                style={{ width: "250px", margin: '20px' }}
                className="btn btn-primary"
                onClick={() => setAddNewDrp(true)}
              >
                <i className="fas fa-plus" /> Add new company
              </button>
            </Grid>
          </Grid>

          <div className="row p-2"></div>
          <div className="col-md-12 table-responsive">
            <table className="table" style={{ border: "1px solid" }}>
              <thead className="table-dark">
                <tr>
                  <th scope="col" style={{ border: "2px groove" }}>Company Name</th>
                  <th scope="col" style={{ border: "2px groove" }}>Email</th>
                  <th scope="col" style={{ border: "2px groove" }}>Phone</th>
                  <th scope="col" style={{ border: "2px groove" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={4} align="center"><CircularProgress /></td>
                  </tr>
                )}

                {!isLoading && data?.length === 0 && (
                  <tr>
                    <td colSpan={4} align="center">No result found!!</td>
                  </tr>
                )}
                {!isLoading && data?.map((d, rowIndex) => (
                  <tr key={rowIndex} style={{ border: "2px groove", fontWeight: '500', fontSize: '14px' }}>
                    {!d.add && !d.edit && <td style={{ border: "2px groove", verticalAlign: 'middle' }}>{d.companyName}</td>}
                    {(d.add || d.edit) && <td style={{ border: "2px groove", verticalAlign: 'middle' }}>
                      <input
                        type="text"
autoComplete="off"
                        value={d.companyName}
                        name="companyName"
                        className="form-control"
                        id="companyName"
                        onChange={(e) => handleInputChange(e, rowIndex)}
                      />
                      {errors.companyName && <span className="text-danger">{errors.companyName}</span>}
                    </td>}
                    
                    {!d.add && !d.edit && <td style={{ border: "2px groove", verticalAlign: 'middle' }}>{d.email}</td>}
                    {(d.add || d.edit) && <td style={{ border: "2px groove", verticalAlign: 'middle' }}>
                      <input
                        type="text"
autoComplete="off"
                        value={d.email}
                        name="email"
                        className="form-control"
                        id="email"
                        onChange={(e) => handleInputChange(e, rowIndex)}
                      />
                      {errors.email && <span className="text-danger">{errors.email}</span>}
                    </td>}

                    {!d.add && !d.edit && <td style={{ border: "2px groove", verticalAlign: 'middle' }}>{d.phone}</td>}
                    {(d.add || d.edit) && <td style={{ border: "2px groove", verticalAlign: 'middle' }}>
                      <input
                        type="text"
autoComplete="off"
                        value={d.phone}
                        name="phone"
                        className="form-control"
                        id="phone"
                        onChange={(e) => handleInputChange(e, rowIndex)}
                      />
                      {errors.phone && <span className="text-danger">{errors.phone}</span>}
                    </td>}

                    {!d.add && !d.edit && <td style={{ border: "2px groove", verticalAlign: 'middle' }}>
                      <button
                        className="btn btn-sm btn-light"
                        onClick={() => editData(rowIndex)}
                      >
                        <i className="fas fa-edit"></i>
                      </button>{" "}
                      <button
                        className="btn btn-sm btn-light"
                        onClick={() => deletData(rowIndex)}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>}
                    {(d.add || d.edit) && <td style={{ border: "2px groove", verticalAlign: 'middle' }}>
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => save(rowIndex)}
                      >
                        <i className="fas fa-save"></i>&nbsp; Save
                      </button>&nbsp;
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => cancel(rowIndex)}
                      >
                        <i className="fas fa-save"></i>&nbsp; Cancel
                      </button>
                    </td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

const mapStateToProps = (state) => ({});

export default connect(mapStateToProps, {})(CompanyManagement);
