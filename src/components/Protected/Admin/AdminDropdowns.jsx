import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import Header from "../../common/Header/Header";
import BreadCrumHeader from "../../common/BreadCrumHeader/BreadCrumHeader";
import SidebarNew from "../../common/Sidebar/SidebarNew";
import { useNavigate } from "react-router-dom";
import { get, post, del, put } from "../../../api";
import CircularProgress from '@mui/material/CircularProgress';
import { TextField, Grid } from "@mui/material";
import { toast } from "react-toastify";


const AdminDropdowns = ({ }) => {
  
  const [data, setData] = useState([]);
  const [lovTypes, setLovTypes] = useState([]);
  const [selectedLovType, setselectedLovType] = useState();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    getLovTypes();
  }, [])
  
  useEffect(() => {
    getLovType(selectedLovType);
  }, [selectedLovType])

  const getLovTypes = async () => {
    setIsLoading(true);
    const lovtypesData = await get("/api/lov/lov-types");
    setLovTypes(lovtypesData)
    setIsLoading(false);
  }

  const getLovType = async (type) => {
    setIsLoading(true);
    const lovtypesData = await get("/api/lov/" + type);
    setData(lovtypesData)
    setIsLoading(false);
  }

  const addNew = () => {
    const inProgress = data.findIndex(d => d.edit || d.add);
    if (inProgress >= 0) {
      toast.error("Please save or cancel existing data");
      return;
    }
    const udata = [{ add: true }, ...data];
    setData(udata);
  }


  const editData = (idx) => {
    const inProgress = data.findIndex(d => d.edit || d.add);
    if (inProgress >= 0) {
      toast.error("Please save existing data");
      return;
    }
    const udata = [...data];
    udata[idx].edit = true;
    setData(udata);
  }

  const cancel = (idx) => {
    const udata = [...data];
    if (udata[idx].add) {
      udata.splice(idx, 1);
    } else {
      udata[idx].edit = false;
    }
    
    setData(udata);
  }

  const deletData = async (idx) => {
    setIsLoading(true);
    const dataTSave = { ...data[idx] }
    await del("/api/lov/" + dataTSave.id, dataTSave);
    getLovType(dataTSave.lovType)
  }

  const save = async (idx) => {
    console.log('datadatadatadatadatadatadata', data)
    setIsLoading(true);
    const dataTSave = { lovType:selectedLovType, ...data[idx] }
    if (dataTSave.add) {
      await post("/api/lov/", dataTSave);
    } else {
      await put("/api/lov/id/" + dataTSave.id, dataTSave);
    }
    getLovType(selectedLovType)
    
  }
  
  const handleInputChange = (e, idx) => {
    const { name, value } = e.target;
    const uAllData = [...data]
    const udata = {
      ...data[idx],
      [name]: value,
    }
    uAllData[idx] = udata
    setData(uAllData);
  };
  
  return (
    <Fragment>
      <SidebarNew />
      <div className="content">
        <Header />
        <div className="container-fluid">
          
          <BreadCrumHeader header={"Dropdown Management"} page={"Manage"} />

          <Grid container >
            <Grid>
              <label htmlFor="score" name="score">
                Dropdown Type
              </label>
              <select
                className="form-control form-select"
                name="score"
                onChange={(e) => setselectedLovType(e.target.value)}
               
              >
                <option value={null}>Select</option>
                {lovTypes.map(o => (
                  <option value={o}> {o} </option>
                ))}
              </select>
            </Grid>
            {data.length > 0 && <Grid sm={6}>
             
              <button
                style={{ width: "250px", margin: '20px' }}
                className="btn btn-primary btn-light"
                onClick={() => {
                  addNew()
                }}
              >
                Add New
              </button>

            </Grid>}
          </Grid>
         
         
          <div className="row p-2"></div>
          {selectedLovType  && <div className="col-md-12 table-responsive">
            <table className="table" style={{ border: "1px solid" }}>
              <thead className="table-dark">
                <tr>
                  <th scope="col" style={{ border: "2px groove"}}>Value</th>
                  <th scope="col" style={{ border: "2px groove" }}>Description</th>
                  <th scope="col" style={{ border: "2px groove" }}>Depends</th>
                  <th scope="col" style={{ border: "2px groove" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading &&
                  <tr>
                    <td colSpan={4} align="center"><CircularProgress /></td>
                  </tr>
                }
                  
                 
                {!isLoading && data?.length === 0 && (
                  <tr>
                    <td colSpan={4} align="center">No result found!!</td>
                  </tr>
                )}
                {!isLoading && data.map((d, rowIndex) => 
                  <tr key={rowIndex} style={{ border: "2px groove", fontWeight: '500', fontSize: '14px' }}>
                    {!d.add && !d.edit && <td style={{ border: "2px groove", verticalAlign: 'middle' }} >
                      {d.lovValue}
                    </td>}
                    {(d.add || d.edit) && <td style={{ border: "2px groove", verticalAlign: 'middle' }} >
                      <input
                        type="text"
                        value={d.lovValue}
                        name="lovValue"
                        className="form-control"
                        id="lovValue"
                        onChange={(e)=>handleInputChange(e,rowIndex)}
                      />
                    </td>}
                    
                    {!d.add && !d.edit && <td style={{ border: "2px groove", verticalAlign: 'middle' }} >
                      {d.lovDesc}
                    </td>}
                    {(d.add || d.edit) && <td style={{ border: "2px groove", verticalAlign: 'middle' }} >
                      <input
                        type="text"
                        value={d.lovDesc}
                        name="lovDesc"
                        className="form-control"
                        id="lovDesc"
                        onChange={(e)=>handleInputChange(e,rowIndex)}
                      />
                    </td>}
                    {!d.add && !d.edit && <td style={{ border: "2px groove", verticalAlign: 'middle' }} >
                      {d.attribite1}
                    </td>}
                    {(d.add || d.edit) && <td style={{ border: "2px groove", verticalAlign: 'middle' }} >
                      <input
                        type="text"
                        value={d.attribite1}
                        name="attribite1"
                        className="form-control"
                        id="attribite1"
                        onChange={(e)=>handleInputChange(e,rowIndex)}
                      />
                    </td>}
                    {!d.add && !d.edit && <td style={{ border: "2px groove", verticalAlign: 'middle' }} >
                      <button
                        className="btn btn-sm btn-light"
                        onClick={() => { editData(rowIndex) }}
                      >
                        <i className="fas fa-edit"></i>
                      </button>{" "}
                      <button
                        className="btn btn-sm btn-light"
                        onClick={() => { deletData(rowIndex) }}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                      
                    </td>}
                    {(d.add || d.edit) && <td style={{ border: "2px groove", verticalAlign: 'middle' }} >
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => { save(rowIndex)}}
                      >
                        <i className="fas fa-save"></i>&nbsp; Save
                      </button>&nbsp;
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => { cancel(rowIndex) }}
                      >
                        <i className="fas fa-save"></i>&nbsp; Cancel
                      </button>

                    </td>}
                  </tr>
                )
                }
                
              </tbody>
            </table>
          </div>}
        </div>
      </div>
    </Fragment>
  );
};
const mapStateToProps = (state) => ({

});
export default connect(mapStateToProps, {  })(
  AdminDropdowns
);
