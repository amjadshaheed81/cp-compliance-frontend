import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import Header from "../../common/Header/Header";
import BreadCrumHeader from "../../common/BreadCrumHeader/BreadCrumHeader";
import SidebarNew from "../../common/Sidebar/SidebarNew";
import { get, post, del, put, uploadLogo } from "../../../api";
import CircularProgress from '@mui/material/CircularProgress';
import { Button, DialogContent, DialogTitle, DialogActions, Dialog, Grid } from "@mui/material";
import { toast } from "react-toastify";
import { TextField, Autocomplete } from "@mui/material";
import {combinedMenu} from "../../../Constant/Menu"
import moment from "moment";

const OnboradClient = ({ }) => {

  // const combinedMenu = [
  //   {key: 1, label: "Dashboard", type: "General"},
  //   {key: 2, label: "Edit Profile", type: "General"},
  //   {key: 3, label: "Portfolio", type: "General"},
  //   {key: 4, label: "Reports", type: "General"},
  //   {key: 5, label: "Users", type: "General"},
  //   {key: 6, label: "Notifications", type: "General"},
  //   {key: 7, label: "Actions", type: "General"},
  //   {key: 8, label: "Create Site", type: "Site"},
  //   {key: 9, label: "Site Details", type: "Site"},
  //   {key: 10, label: "Site Documents", type: "Site"},
  //   {key: 11, label: "Statutory Register", type: "Site"},
  //   {key: 12, label: "Site Assets", type: "Site"},
  //   {key: 13, label: "Site Contracts", type: "Site"},
  //   {key: 14, label: "Pre-Action", type: "Site"},
  //   {key: 15, label: "Site Checks", type: "Site"},
  //   {key: 16, label: "Energy Cost", type: "Site"},
  //   {key: 17, label: "Site Calendar", type: "Site"},

  // ];


  const SiteMenu = [
    

  ];
  
  

  const [data, setData] = useState([]);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [addNewDrp, setAddNewDrp] = useState(false);

  useEffect(() => {
    getClient();
  }, []);

  const dateFormat = (date) => {
    return moment(date, 'YYYY-MM-DD').format('DD/MM/YYYY');
  }

  const getClient = async () => {
    setIsLoading(true);
    const clientData = await get("/api/user/clients");
    setData(clientData);
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
    getClient();
  };

  // const save = async (idx) => {
  //   const dataTSave = { ...data[idx] };
  //   const validationErrors = validateFields(dataTSave);
  //   if (Object.keys(validationErrors).length > 0) {
  //     setErrors(validationErrors);
  //     return;
  //   }

  //   setIsLoading(true);
  //   if (dataTSave.add) {
  //     await put("/api/companies/manage", dataTSave);
  //   } else {
  //     await put("/api/companies/manage", dataTSave);
  //   }
  //   getClient();
  // };

  const saveNew = async (event) => {
    event.preventDefault();
    const form = event.target;
    if (!form.checkValidity()) {
      form.reportValidity();
    }

    setIsLoading(true);
    if (formData?.file?.name) {
      formData.logo = await uploadLogo(formData);
      delete data.file;
    }
    formData.status = 'Active'
    formData.trialExpiry =new Date(formData.trialExpiry);
    if(formData?.licenseId) {
      await put("/api/user/clients/"+formData?.licenseId, formData);
    } else {
      formData.creationDate =new Date();
      await post("/api/user/onboard", formData);
    }
    
   
    setAddNewDrp(false);
    getClient();
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

  const handleFileChange = (e) => {
    const udata = {
      ...formData,
      file: e.target.files[0],
    };
    setFormData(udata);
  };

  return (
    <Fragment>
      <SidebarNew />
      
      <Dialog open={addNewDrp} onClose={() => { setFormData({});setAddNewDrp(false); }} maxWidth="lg" fullWidth>
      <form onSubmit={saveNew}>
        <DialogTitle>{formData?.licenseId ? "Update Client" : "Add New Client"}</DialogTitle>
        <DialogContent dividers>
          <Fragment>
            <Grid container spacing={1}>
              <Grid sm={4}>
                <label htmlFor="companyName">Client Name</label>
                <input
                  style={{ maxWidth: '300px' }}
                  type="text"
                  required
                  value={formData?.companyName}
                  autoComplete="off"
                  className="form-control"
                  name="companyName"
                  onChange={handleInputChange2}
                />
              </Grid>
              <Grid sm={4}>
                <label htmlFor="adminEmail">Admin Email</label>
                <input
                  style={{ maxWidth: '300px' }}
                  type="text"
                  required
                  autoComplete="off"
                  value={formData?.adminEmail}
                  className="form-control"
                  name="adminEmail"
                  onChange={handleInputChange2}
                />
              </Grid>
              <Grid sm={4}>
                <label htmlFor="adminPassword">Admin Password</label>
                <input
                  style={{ maxWidth: '300px' }}
                  type="password"
                  required={!formData?.licenseId}
                  autoComplete="off"
                  maxLength={11}
                  className="form-control"
                  name="adminPassword"
                  onChange={handleInputChange2}
                />
              </Grid>
              <Grid sm={4}>
                <label htmlFor="allowedUser">Allowed Number of Users</label>
                <input
                  style={{ maxWidth: '300px' }}
                  type="number"
                  required
                  value={formData?.allowedUser}
                  autoComplete="off"
                  className="form-control"
                  name="allowedUser"
                  onChange={handleInputChange2}
                />
              </Grid>
              <Grid sm={4}>
                <label htmlFor="allowedSites">Allowed Number of Sites</label>
                <input
                  style={{ maxWidth: '300px' }}
                  type="number"
                  required
                  value={formData?.allowedSites}
                  autoComplete="off"
                  className="form-control"
                  name="allowedSites"
                  onChange={handleInputChange2}
                />
              </Grid>
              <Grid sm={4}>
                <label htmlFor="trialExpiry">License Expiry</label>
                <input
                  style={{ maxWidth: '300px' }}
                  type="date"
                  required
                  value={formData?.trialExpiry?.substring(0,10)}
                  autoComplete="off"
                  className="form-control"
                  name="trialExpiry"
                  onChange={handleInputChange2}
                />
              </Grid>

              <Grid sm={6}>
                <label htmlFor="modules">Modules</label>
                            <Autocomplete
                              multiple
                              onChange={(event, newValue) => {
                                const keys = newValue
                                  ?.map((itm) => itm?.key)
                                  ?.join(",");
                                setFormData({
                                  ...formData,
                                  modules: keys,
                                });
                              }}
                              value={combinedMenu.filter(o=>formData?.modules?.split(",")?.includes(String(o.key)))}
                              
                              options={combinedMenu.filter(o=>!formData?.modules?.split(",")?.includes(String(o.key)))}
                              getOptionLabel={(option) => option.label}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                 // label="Modules"
                                  //placeholder="Select Module"
                                />
                              )}
                            />
                {/* <select
                style={{ maxWidth: '300px' }}
                          required
                          name="modules"
                          className="form-control form-select"
                          id="modules"
                          onChange={(e) => handleInputChange2}
                        >
                          <option value="">Select Modules</option>
                          {GeneralMenu.map(m=><option value={{value: m, type: "General"}}>{m}</option>)}
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                          <option value={3}>3</option>
                          <option value={4}>4</option>
                          <option value={5}>5</option>
                        </select> */}
              </Grid>

              <Grid sm={6}>
                <label htmlFor="file" style={{ maxWidth: '300px', marginLeft: '20px' }}>Logo</label>
                <input
                style={{ maxWidth: '300px', marginLeft: '20px' }}
                  type="file"
                  name="file"
                  className="form-control"
                            id="file"
                            required={!formData?.licenseId}
                            onChange={(e) => handleFileChange(e)}
                          />
              </Grid>


             
            </Grid>
          </Fragment>
        </DialogContent>
        <DialogActions>
          <Button type="button" onClick={() =>  {setFormData({});setAddNewDrp(false)}} className="bg-light text-primary">
            Cancel
          </Button>
          <Button type="submit" className="bg-primary text-white">
            Save
          </Button>
        </DialogActions>
        </form>
      </Dialog>

      <div className="content">
        <Header />
        <div className="container-fluid">
          <BreadCrumHeader header={"Onborad Client"} page={"Manage"} />

          <Grid container>
            <Grid sm={12}>
              <button
                style={{ width: "250px", margin: '20px' }}
                className="btn btn-primary"
                onClick={() => setAddNewDrp(true)}
              >
                <i className="fas fa-plus" /> Add new client
              </button>
            </Grid>
          </Grid>

          <div className="row p-2"></div>
          <div className="col-md-12 table-responsive">
            <table className="table" style={{ border: "1px solid" }}>
              <thead className="table-dark">
                <tr>
                  <th scope="col" style={{ border: "2px groove" }}>Client Name</th>
                  <th scope="col" style={{ border: "2px groove" }}>Admin Email</th>
                  <th scope="col" style={{ border: "2px groove" }}>License Expiry</th>
                  <th scope="col" style={{ border: "2px groove" }}>Number Of Allowed Users</th>
                  <th scope="col" style={{ border: "2px groove" }}>Number Of Allowed Sites</th>
                  <th scope="col" style={{ border: "2px groove" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={5} align="center"><CircularProgress /></td>
                  </tr>
                )}

                {!isLoading && data?.length === 0 && (
                  <tr>
                    <td colSpan={4} align="center">No result found!!</td>
                  </tr>
                )}
                {!isLoading && data?.map((d, rowIndex) => (
                  <tr key={rowIndex} style={{ border: "2px groove", fontWeight: '500', fontSize: '14px' }}>
                   <td style={{ border: "2px groove", verticalAlign: 'middle' }}>
                    <img src={d.logo} height={50}
              width={140} /> {d.companyName}
                    </td>
                    
                    
                    <td style={{ border: "2px groove", verticalAlign: 'middle' }}>{d.adminEmail}</td>
                    

                    {!d.add && !d.edit && <td style={{ border: "2px groove", verticalAlign: 'middle' }}>{dateFormat(d?.trialExpiry?.split("T")?.[0])}</td>}
                    {(d.add || d.edit) && <td style={{ border: "2px groove", verticalAlign: 'middle' }}>
                      <input
                        type="text"
autoComplete="off"
                        value={d.trialExpiry}
                        name="trialExpiry"
                        className="form-control"
                        id="trialExpiry"
                        onChange={(e) => handleInputChange(e, rowIndex)}
                      />
                      {errors.phone && <span className="text-danger">{errors.phone}</span>}
                    </td>}

                    {!d.add && !d.edit && <td style={{ border: "2px groove", verticalAlign: 'middle' }}>{d.allowedUser}</td>}
                    {(d.add || d.edit) && <td style={{ border: "2px groove", verticalAlign: 'middle' }}>
                      <input
                        type="number"
autoComplete="off"
                        value={d.allowedUser}
                        name="allowedUser"
                        className="form-control"
                        id="allowedUser"
                        onChange={(e) => handleInputChange(e, rowIndex)}
                      />
                      {errors.phone && <span className="text-danger">{errors.phone}</span>}
                    </td>}

                    {!d.add && !d.edit && <td style={{ border: "2px groove", verticalAlign: 'middle' }}>{d.allowedSites}</td>}
                    {(d.add || d.edit) && <td style={{ border: "2px groove", verticalAlign: 'middle' }}>
                      <input
                        type="number"
autoComplete="off"
                        value={d.allowedSites}
                        name="allowedSites"
                        className="form-control"
                        id="allowedSites"
                        onChange={(e) => handleInputChange(e, rowIndex)}
                      />
                      {errors.phone && <span className="text-danger">{errors.phone}</span>}
                    </td>}

                    <td style={{ border: "2px groove", verticalAlign: 'middle' }}>
                      <button
                        className="btn btn-sm btn-light"
                        onClick={() => {
                          delete d.adminPassword;
                          setFormData(d);
                          setAddNewDrp(true); 
                        }}
                      >
                        <i className="fas fa-edit"></i>
                      </button>{" "}
                     
                    </td>
                   
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

export default connect(mapStateToProps, {})(OnboradClient);
