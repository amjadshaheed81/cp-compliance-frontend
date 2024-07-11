import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import { get, post, uploadSiteCheckDoc } from "../../../../api";
import { Grid, Chip, Typography, Box, IconButton, Divider, Autocomplete } from '@mui/material';
import { UploadFile } from '@mui/icons-material';

import { getSites, getExternalUsers } from "../../../../store/thunk/site";

const AsbestosSurvey = ({ sasToken, checkId }) => {
  useEffect(() => {
    getAsbestosSurvey();
  }, []);
  const [completed, setCompleted] = useState(false);
  const [formData, setFormData] = useState({
    surveyReference: 'S001',
    file: null
  });


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

  const getAsbestosSurvey = async () => {
    const data = await get("/api/site-check/asbestos-survey/" + checkId);
    if (data.length > 0) {
      setFormData(data[0]);
      setCompleted(true)
    }
  }

  const saveSurvey = async (event) => {
    event.preventDefault();
    const form = event.target;
    if (!form.checkValidity()) {
      form.reportValidity();
    }
    const data = { ...formData }
    if (data?.file?.name) {
      data.reportUrl = await uploadSiteCheckDoc(data);
      delete data.file;
    }
    data.reportDate = new Date(data.reportDate);
    data.checkId = checkId;
    console.log(data)
    await post("/api/site-check/asbestos-survey", data)
    toast.success("Inspection data saved")
    setCompleted(true);

  }




  return (
    <form onSubmit={saveSurvey}>
    <Box p={3}>
      {/* <Typography variant="h6" gutterBottom>
        Certificate
      </Typography>
      <Divider /> */}
      <br />
      <br />
      <Grid container spacing={2}>
          <Grid sm={completed ? 12 : 8} style={{marginLeft: '20px'}}>
          <Grid container spacing={3}>

            <Grid item xs={12} sm={6}>
              <label htmlFor="surveyCompany" name="surveyCompany">
                Survey Company
              </label>
              <input
                  type="text"
                  required
                disabled={completed}
                name="surveyCompany"
                className="form-control"
                id="surveyCompany"
                value={formData.surveyCompany}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <label htmlFor="ukasLab" name="ukasLab">
                UKAS Laboratory
              </label>
                <input
                  required
                type="text"
                disabled={completed}
                name="ukasLab"
                className="form-control"
                id="ukasLab"
                value={formData.ukasLab}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <label htmlFor="reportDate" name="reportDate">
                Report Date
              </label>
                <input
                  required
                disabled={completed}
                type="date"
                name="reportDate"
                className="form-control"
                id="reportDate"
                value={String(formData.reportDate)?.substring(0, 10)}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <label htmlFor="surveyReference" name="surveyReference">
                Survey Reference Number
              </label>
                <input
                  required
                type="text"
                disabled={formData.surveyReference}
                name="surveyReference"
                className="form-control"
                id="surveyReference"
                value={formData.surveyReference}
                onChange={handleInputChange}
              />
            </Grid>
            
          </Grid>
        </Grid>
          {!completed && <Grid sm={3}>
            <Grid container >
              <Grid item xs={12}>
                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  border="1px dashed grey"
                  p={2}
                  mb={2}
                  style={{
                    backgroundColor: '#f9f9f9',
                    height: '130px',
                    borderRadius: '4px',
                    color: '#3f51b5',
                    margin: '20px',
                    width: '400px'
                  }}
                >
                  <IconButton component="label">
                    <input hidden type="file"
                      onChange={handleFileChange}
                    />
                    <UploadFile />
                  </IconButton>
                  <Typography align="center">
                    Click to upload or drag and drop Image File (PDF) (max, 1MB)
                  </Typography>
                </Box>
              </Grid>
          

              {!completed && formData.file && (
                <Grid xs={12} alignItems="center" style={{ margin: '5px' }}>
                  <Chip
                    label={formData.file.name}
                    onDelete={handleFileDelete}
                  />

                </Grid>
              )}
            </Grid>
            
          </Grid>}
        <Grid item xs={12}>
          {!completed && <button
            style={{ width: "250px", marginBottom: '20px', margin: '10px', float: 'right' }}
            className="btn btn-primary "
            type="submit"
          >
            Save
          </button>}
            {completed && formData?.reportUrl  &&
              <a href={formData?.reportUrl + "?" + sasToken} target="_blank">
              <button
                style={{ width: "250px", marginBottom: '20px', margin: '10px', float: 'right' }}
                  className="btn btn-primary btn-dark"
                  onClick={(e)=> e.preventDefault()}
              >
                <i className="fas fa-download" />&nbsp;Download Certificate
              </button>
            </a>}

        </Grid>

      </Grid>
      
      </Box>
      </form>

  );
};

const mapStateToProps = (state) => ({
  sites: state.site.sites,
  externalusers: state.site.externalusers,
});
export default connect(mapStateToProps, {  })(
  AsbestosSurvey
);

