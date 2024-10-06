import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import Header from "../../common/Header/Header";
import BreadCrumHeader from "../../common/BreadCrumHeader/BreadCrumHeader";
import SidebarNew from "../../common/Sidebar/SidebarNew";
import { get, post, del, put } from "../../../api";
import CircularProgress from '@mui/material/CircularProgress';
import { Button, DialogContent, DialogTitle, DialogActions, Dialog, Grid } from "@mui/material";
import { toast } from "react-toastify";


const AdminDropdowns = ({ }) => {
  
  const [data, setData] = useState([]);
  const [formData, setFormData] = useState({});
  const [lovTypes, setLovTypes] = useState([]);
  const [selectedLovType, setselectedLovType] = useState();
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [addNewDrp, setAddNewDrp] = useState(false);

  useEffect(() => {
    getLovTypes();
  }, [])
  
  useEffect(() => {
    if (selectedLovType) {
      getLovType(selectedLovType);
    }
  }, [selectedLovType]);

  const getLovTypes = async () => {
    setIsLoading(true);
    const lovtypesData = await get("/api/lov/lov-types");
    setLovTypes(lovtypesData);
    setIsLoading(false);
  };

  const getLovType = async (type) => {
    setIsLoading(true);
    const lovtypesData = await get("/api/lov/" + type);
    setData(lovtypesData);
    setIsLoading(false);
  };

  const validateFields = (data) => {
    let errors = {};
    if (!data.lovType) {
      errors.lovType = "Type is required";
    }
    if (!data.lovValue) {
      errors.lovValue = "Value is required";
    }
    if (!data.attribite1) {
      errors.attribite1 = "Depends On is required";
    }
    return errors;
  };

  const addNew = () => {
    const inProgress = data.findIndex(d => d.edit || d.add);
    if (inProgress >= 0) {
      toast.error("Please save or cancel existing data");
      return;
    }
    const udata = [{ add: true }, ...data];
    setData(udata);
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
    await del("/api/lov/" + dataTSave.id, dataTSave);
    getLovType(dataTSave.lovType);
  };

  const save = async (idx) => {
    const dataTSave = { lovType: selectedLovType, ...data[idx] };
    const validationErrors = validateFields(dataTSave);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    if (dataTSave.add) {
      await post("/api/lov/", dataTSave);
    } else {
      await put("/api/lov/id/" + dataTSave.id, dataTSave);
    }
    getLovType(selectedLovType);
  };

  const saveNew = async () => {
    const validationErrors = validateFields(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    await post("/api/lov/", formData);
    setselectedLovType(formData.lovType);
    setAddNewDrp(false);
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
        <DialogTitle>Add New Dropdown </DialogTitle>
        <DialogContent dividers>
          <Fragment>
            <Grid container>
              <Grid sm={4}>
                <label htmlFor="lovType">Type</label>
                <input
                  style={{ maxWidth: '300px' }}
                  type="text"
                  className="form-control"
                  name="lovType"
                  onChange={handleInputChange2}
                />
                {errors.lovType && <span className="text-danger">{errors.lovType}</span>}
              </Grid>
              <Grid sm={4}>
                <label htmlFor="lovValue">Value</label>
                <input
                  style={{ maxWidth: '300px' }}
                  type="text"
                  className="form-control"
                  name="lovValue"
                  onChange={handleInputChange2}
                />
                {errors.lovValue && <span className="text-danger">{errors.lovValue}</span>}
              </Grid>
              <Grid sm={4}>
                <label htmlFor="attribite1">Depends On</label>
                <input
                  style={{ maxWidth: '300px' }}
                  type="text"
                  className="form-control"
                  name="attribite1"
                  onChange={handleInputChange2}
                />
                {errors.attribite1 && <span className="text-danger">{errors.attribite1}</span>}
              </Grid>
              <Grid sm={4}>
                <label htmlFor="attribite2">Additional Attribute</label>
                <input
                  style={{ maxWidth: '300px' }}
                  type="text"
                  className="form-control"
                  name="attribite2"
                  onChange={handleInputChange2}
                />
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
          <BreadCrumHeader header={"Dropdown Management"} page={"Manage"} />
          <Grid container>
            <Grid sm={4}>
              <label htmlFor="score">Dropdown Type</label>
              <select
                className="form-control form-select"
                name="score"
                onChange={(e) => setselectedLovType(e.target.value)}
                value={selectedLovType}
              >
                <option value={null}>Select</option>
                {lovTypes.map((o, index) => (
                  <option key={index} value={o}> {o} </option>
                ))}
              </select>
            </Grid>
            <Grid sm={4}>
              {data.length > 0 &&
                <button
                  style={{ width: "250px", margin: '20px' }}
                  className="btn btn-primary"
                  onClick={addNew}
                >
                  <i className="fas fa-plus" /> Add new value
                </button>
              }
            </Grid>
            <Grid sm={4}>
              <button
                style={{ width: "250px", margin: '20px' }}
                className="btn btn-primary"
                onClick={() => setAddNewDrp(true)}
              >
                <i className="fas fa-plus" /> Add new dropdown
              </button>
            </Grid>
          </Grid>

          {selectedLovType && <div className="col-md-12 table-responsive">
            <table className="table" style={{ border: "1px solid" }}>
              <thead className="table-dark">
                <tr>
                  <th scope="col" style={{ border: "2px groove" }}>Value</th>
                  <th scope="col" style={{ border: "2px groove" }}>Description</th>
                  <th scope="col" style={{ border: "2px groove" }}>Depends On</th>
                  <th scope="col" style={{ border: "2px groove" }}>Additional Attribute</th>
                  <th scope="col" style={{ border: "2px groove" }}>Sort Order</th>
                  <th scope="col" style={{ border: "2px groove" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && 
                  <tr>
                    <td colSpan={5} align="center"><CircularProgress /></td>
                  </tr>
                }

                {!isLoading && data?.length === 0 && (
                  <tr>
                    <td colSpan={5} align="center">No result found!!</td>
                  </tr>
                )}

                {!isLoading && data.map((d, rowIndex) => (
                  <tr key={rowIndex} style={{ border: "2px groove", fontWeight: '500', fontSize: '14px' }}>
                    {!d.add && !d.edit && <td style={{ border: "2px groove", verticalAlign: 'middle' }}>{d.lovValue}</td>}
                    {(d.add || d.edit) && <td style={{ border: "2px groove", verticalAlign: 'middle' }}>
                      <input
                        type="text"
                        value={d.lovValue}
                        name="lovValue"
                        className="form-control"
                        onChange={(e) => handleInputChange(e, rowIndex)}
                      />
                      {errors.lovValue && <span className="text-danger">{errors.lovValue}</span>}
                    </td>}

                    {!d.add && !d.edit && <td style={{ border: "2px groove", verticalAlign: 'middle' }}>{d.lovDesc}</td>}
                    {(d.add || d.edit) && <td style={{ border: "2px groove", verticalAlign: 'middle' }}>
                      <input
                        type="text"
                        value={d.lovDesc}
                        name="lovDesc"
                        className="form-control"
                        onChange={(e) => handleInputChange(e, rowIndex)}
                      />
                    </td>}

                    {!d.add && !d.edit && <td style={{ border: "2px groove", verticalAlign: 'middle' }}>{d.attribite1}</td>}
                    {(d.add || d.edit) && <td style={{ border: "2px groove", verticalAlign: 'middle' }}>
                      <input
                        type="text"
                        value={d.attribite1}
                        name="attribite1"
                        className="form-control"
                        onChange={(e) => handleInputChange(e, rowIndex)}
                      />
                      {errors.attribite1 && <span className="text-danger">{errors.attribite1}</span>}
                    </td>}

                    {!d.add && !d.edit && <td style={{ border: "2px groove", verticalAlign: 'middle' }}>{d.attribite2}</td>}
                    {(d.add || d.edit) && <td style={{ border: "2px groove", verticalAlign: 'middle' }}>
                      <input
                        type="text"
                        value={d.attribite2}
                        name="attribite2"
                        className="form-control"
                        onChange={(e) => handleInputChange(e, rowIndex)}
                      />
                      {errors.attribite2 && <span className="text-danger">{errors.attribite2}</span>}
                    </td>}

                    {!d.add && !d.edit && <td style={{ border: "2px groove", verticalAlign: 'middle' }}>{d.attribite3}</td>}
                    {(d.add || d.edit) && <td style={{ border: "2px groove", verticalAlign: 'middle' }}>
                      <input
                        type="text"
                        value={d.attribite3}
                        name="attribite3"
                        className="form-control"
                        onChange={(e) => handleInputChange(e, rowIndex)}
                      />
                    </td>}

                    {!d.add && !d.edit && <td style={{ border: "2px groove", verticalAlign: 'middle' }}>
                      <button className="btn btn-sm btn-light" onClick={() => editData(rowIndex)}>
                        <i className="fas fa-edit"></i>
                      </button>{" "}
                      <button className="btn btn-sm btn-light" onClick={() => deletData(rowIndex)}>
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>}
                    {(d.add || d.edit) && <td style={{ border: "2px groove", verticalAlign: 'middle' }}>
                      <button className="btn btn-sm btn-success" onClick={() => save(rowIndex)}>
                        <i className="fas fa-save"></i>&nbsp; Save
                      </button>&nbsp;
                      <button className="btn btn-sm btn-danger" onClick={() => cancel(rowIndex)}>
                        <i className="fas fa-save"></i>&nbsp; Cancel
                      </button>
                    </td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>}
        </div>
      </div>
    </Fragment>
  );
};

const mapStateToProps = (state) => ({});

export default connect(mapStateToProps, {})(AdminDropdowns);
