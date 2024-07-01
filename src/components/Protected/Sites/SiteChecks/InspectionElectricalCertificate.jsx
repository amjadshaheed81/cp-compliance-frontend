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
import { Grid, Chip, Button, Typography, Box, IconButton, Divider } from '@mui/material';
import { UploadFile, Close } from '@mui/icons-material';

import { deleteUser, getSites, getUsers } from "../../../../store/thunk/site";

const InspectionElectricalCertificate = ({ users, getUsers }) => {
  const navigate = useNavigate();

  useEffect(() => {
    getUsers();
  }, []);
  useEffect(() => { }, []);
  const [formData, setFormData] = useState({
    documentName: '',
    reviewBy: '',
    issueDate: '',
    expiryDate: '',
    notes: '',
    file: null
  });
  const [data, setData] = useState([{}]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      file: e.target.files[0]
    });
  };

  const handleFileDelete = () => {
    setFormData({
      ...formData,
      file: null
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

      <Box p={3}>
        <Typography variant="h6" gutterBottom>
          Certificate
      </Typography>
      <Divider />
      <br />
        <Grid container spacing={2}>
          
        <Grid item xs={12} sm={6}>
          <label htmlFor="documentName" name="documentName">
            Document Name
          </label>
            <input
              type="text"
              name="documentName"
              className="form-control"
              id="documentName"
              //placeholder="Document Name"
              value={formData.documentName}
              onChange={handleInputChange}
            />
          </Grid>
        <Grid item xs={12} sm={6}>
          <label htmlFor="reviewBy" name="reviewBy">
            Need review by
          </label>
          <select
            name="reviewBy"
            className="form-control form-select"
            id="reviewBy"
            onChange={handleInputChange}
          >
            <option value="">Select</option>
            {users.map(u => {
              return (
                <option value={u.id}>{u.role} - {u.name} ({u.email}) </option>
              )
            })}
          </select>
          </Grid>
        <Grid item xs={12} sm={6}>
          <label htmlFor="issueDate" name="issueDate">
            Issue Date
          </label>
            <input
              type="date"
              name="issueDate"
              className="form-control"
              id="issueDate"
              value={formData.issueDate}
              onChange={handleInputChange}
            />
          </Grid>
        <Grid item xs={12} sm={6}>
          <label htmlFor="expiryDate" name="expiryDate">
            Expiry Date
          </label>
            <input
              type="date"
              name="expiryDate"
              className="form-control"
              id="expiryDate"
              value={formData.expiryDate}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12}>
            <textarea
              name="notes"
              className="form-control"
              id="notes"
              rows="4"
              placeholder="Enter notes ..."
              value={formData.notes}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12}>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              border="1px dashed grey"
            p={2}
            mb={2}
            style={{
              backgroundColor: '#f9f9f9',
              height: '150px',
              borderRadius: '4px',
              color: '#3f51b5',
            }}
            >
              <IconButton component="label">
              <input hidden type="file"
              onChange={handleFileChange}
              />
                <UploadFile />
              </IconButton>
              <Typography>
                Click to upload or drag and drop Image File (PDF) (max, 1MB)
              </Typography>
            </Box>
        </Grid>
        
        
        {formData.file && (
          <Grid item xs={12} container alignItems="center" >
            <Chip
              label={formData.file.name}
              onDelete={handleFileDelete}
            />
            
          </Grid>
        )}
        <Grid item xs={12}>
          
            <Button variant="contained" color="success" style={{float:'right'}}>
              Sign Off & Certify
            </Button>
          </Grid>
        </Grid>
      </Box>

  );
};

const mapStateToProps = (state) => ({
  sites: state.site.sites,
  users: state.site.users,
});
export default connect(mapStateToProps, { getUsers, deleteUser, getSites })(
  InspectionElectricalCertificate
);

