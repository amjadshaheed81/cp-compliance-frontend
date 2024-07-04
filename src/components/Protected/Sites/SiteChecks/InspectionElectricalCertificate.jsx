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
import { get, post, uploadSiteCheckDoc } from "../../../../api";
import { Grid, Chip, Button, Typography, Box, IconButton, Divider } from '@mui/material';
import { UploadFile, Close } from '@mui/icons-material';

import { getSites, getExternalUsers } from "../../../../store/thunk/site";

const InspectionElectricalCertificate = ({ checkId, externalusers, getExternalUsers }) => {
  const navigate = useNavigate();

  useEffect(() => {
    getExternalUsers();
    getIpection();
  }, []);
  const [completed, setCompleted] = useState(false);
  const [formData, setFormData] = useState({
    issueDate: '',
    expiryDate: '',
    note: '',
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

  const getIpection = async () => {
    const data = await get("/api/site-check/inspection/" + checkId);
    if (data.length > 0) {
      //d.dateRaised = moment(d?.dateRaised).format("DD-MM-YYYY");
      setFormData(data[0]);
      setCompleted(true)
    }
  }

  const certify = async () => {
    const data = { ...formData }
      if (data?.file?.name) {
        data.certificateUrl = await uploadSiteCheckDoc(data);
        delete data.file;

      }
      data.issueDate = new Date(data.issueDate);
      data.expiryDate = new Date(data.expiryDate);
      data.checkId = checkId;
      data.status = "Open";

      console.log('data', data)
      await post("/api/site-check/inspection", data)
    toast.success("Inspection data saved")
    setCompleted(true);
    
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
          <label htmlFor="certificateName" name="certificateName">
            Document Name
          </label>
            <input
            type="text"
            disabled={completed}
            name="certificateName"
              className="form-control"
            id="certificateName"
              //placeholder="Document Name"
            value={formData.certificateName}
              onChange={handleInputChange}
            />
          </Grid>
        <Grid item xs={12} sm={6}>
          <label htmlFor="reviewerUserId" name="reviewerUserId">
            Need review by
          </label>
          <select
            disabled={completed}
            name="reviewerUserId"
            className="form-control form-select"
            id="reviewerUserId"
            onChange={handleInputChange}

            value={formData.reviewerUserId}
          >
            <option value="">Select</option>
            {externalusers.map(u => {
              return (
                <option value={u.id}>{u.trade}({u.role}) - {u.name} ({u.email}) - {u.company} </option>
              )
            })}
          </select>
          </Grid>
        <Grid item xs={12} sm={6}>
          <label htmlFor="issueDate" name="issueDate">
            Issue Date
          </label>
          <input
            disabled={completed}
              type="date"
              name="issueDate"
              className="form-control"
              id="issueDate"
            value={formData.issueDate?.substring(0, 10)}
              onChange={handleInputChange}
            />
          </Grid>
        <Grid item xs={12} sm={6}>
          <label htmlFor="expiryDate" name="expiryDate">
            Expiry Date
          </label>
          <input
            disabled={completed}
              type="date"
              name="expiryDate"
              className="form-control"
              id="expiryDate"
            value={formData.expiryDate?.substring(0, 10)}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12}>
          <textarea
            disabled={completed}
              name="note"
              className="form-control"
              id="note"
              rows="4"
              placeholder="Enter notes ..."
              value={formData.note}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12}>
          {!completed && <Box
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
          </Box>}
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
          {!completed && <button
            style={{ width: "250px", marginBottom: '20px', margin: '10px', float: 'right' }}
            className="btn btn-primary btn-dark"
            onClick={() => { certify() }}
          >
            Sign Off & Certify
          </button>}
          {completed && <button
            style={{ width: "250px", marginBottom: '20px', margin: '10px', float: 'right' }}
            className="btn btn-primary btn-dark"
            onClick={() => {  }}
          >
            <i className="fas fa-download" />&nbsp;Download Certificate
          </button>}
          
            
          </Grid>
        </Grid>
      </Box>

  );
};

const mapStateToProps = (state) => ({
  sites: state.site.sites,
  externalusers: state.site.externalusers,
});
export default connect(mapStateToProps, { getSites, getExternalUsers })(
  InspectionElectricalCertificate
);

