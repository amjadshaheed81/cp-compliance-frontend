import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import { CSVLink } from "react-csv";
import moment from "moment";
import Header from "../../../common/Header/Header";
import BreadCrumHeader from "../../../common/BreadCrumHeader/BreadCrumHeader";
import SidebarNew from "../../../common/Sidebar/SidebarNew";
import Tooltip from "@mui/material/Tooltip";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { get, post } from "../../../../api";

import { Button, Modal, Typography, Box, Grid, Divider, TextField, Autocomplete } from "@mui/material";
import { deleteUser, getSites, getUsers } from "../../../../store/thunk/site";

const AuditUnitPeriodic = ({ users, getUsers }) => {
  const navigate = useNavigate();

  useEffect(() => {
    getUsers();
  }, []);
  useEffect(() => { }, []);
  const [formData, setFormData] = useState({});
  const [data, setData] = useState([{}]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };


  const addSiteCheck = async () => {

    const body = formData;

    //await post("/api/site-check/", body);
    //await getSiteChecks();
  }

  const getSiteChecks = async () => {
    // const siteChecks = await get("/api/site-check/site/" + site.siteId);
    // console.log("siteCheckssiteChecks", siteChecks)
    // setFilteredSiteChecks(siteChecks)
    // setSiteChecks(siteChecks);
  }


  return (

    <Grid container >

      <Grid sm={4}>
        <Typography variant="h6" gutterBottom>
          Observations
        </Typography>
        {/* <p style={{ fontSize: "20px" }}>Faults Identified</p> */}
      </Grid>
      <Grid sm={4}>

      </Grid>
      <Grid sm={4}>

        <button
          style={{ width: "150px", marginBottom: '20px', margin: '10px', float: 'right' }}
          className="btn btn-primary btn-light"
          onClick={() => { 
            const data2 = [...data];
            data2.push({});
            setData(data2)
          }}
        >
          Record New
        </button>

      </Grid>

      <Grid sm={12}>
        <div className="table-responsive">
          <table className="table table-bordered f-11">
            <thead className="table-dark">
              <tr>
                <th scope="col">Observation Summary</th>
                <th scope="col">Asset</th>
                <th scope="col">Date Raised</th>
                <th scope="col">Rating</th>
                <th scope="col">Image</th>
                <th scope="col">Suggested Action</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              {data.map((d,idx) => 
                <tr>
                  <td>
                    <input
                      type="text"
                      name="fault"
                      className="form-control"
                      id="fault"

                      onChange={handleInputChange}
                    />
                  </td>
                <td><Autocomplete
                  id="asset"
                  onChange={(event, item) => {
                    setFormData({
                      ...formData,
                      asset: item,
                    });
                  }}
                  onInputChange={(event, newInputValue) => {
                    setFormData({
                      ...formData,
                      asset: newInputValue,
                    });
                  }}
                  //freeSolo
                    options={["Asset 1", "Asset 2"].map((option) => option)}
                    renderInput={(params) => (
                      <div ref={params.InputProps.ref} >
                        <i
                          style={{
                            position: "absolute",
                            padding: "13px",
                            color: "lightgrey",
                            paddingLeft: "10rem",
                            float:'right'
                          }}
                          className="fas fa-search"
                        ></i>
                        <input type="text" {...params.inputProps} className="form-control" />
                      </div>
                      
                    )}
                />
                </td>
               
                <td> <input
                  type="date"
                  name="fault"
                  className="form-control"
                  id="fault"

                  onChange={handleInputChange}
                /></td>
                <td>
                  <select
                    name="rating"
                    className="form-control form-select"
                    id="rating"
                    onChange={handleInputChange}
                  >
                    <option value="">Select Rating</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select>
                </td>
                  <td><input
                    type="file"
                    name="file"
                    className="form-control"
                    id="file"
                    onChange={handleInputChange}
                  />
                </td>
                <td><input
                  type="text"
                  name="fault"
                  className="form-control"
                  id="fault"
                  onChange={handleInputChange}
                /></td>
                  <td>
                    <button
                      className="btn btn-sm btn-light text-dark"
                      onClick={() => {
                        const data2 = [...data];
                        data2.splice(idx, 1);
                        setData(data2)
                      }}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </Grid>
      <Grid sm={12}>
        <button
          style={{ width: "150px", marginBottom: '20px', margin: '10px', float: 'right' }}
          className="btn btn-primary text-white pr-2"
          //onClick={() => { addSiteCheck() }}
        >
          Save
        </button>
       

      </Grid>
    </Grid>

  );
};

const mapStateToProps = (state) => ({
  sites: state.site.sites,
  users: state.site.users,
});
export default connect(mapStateToProps, { getUsers, deleteUser, getSites })(
  AuditUnitPeriodic
);

