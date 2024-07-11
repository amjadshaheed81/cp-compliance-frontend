import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { get, post, uploadSiteCheckDoc } from "../../../../api";

import { Typography, Grid, Autocomplete } from "@mui/material";
import { deleteUser, getSites, getUsers, getSiteAssets } from "../../../../store/thunk/site";

const AsbestonSample = ({ sasToken, checkId, siteAssets, getSiteAssets, siteSelectedForGlobal }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (siteSelectedForGlobal?.siteId) {
      getSiteAssets(siteSelectedForGlobal?.siteId);

    }
    getAudit();
  }, []);

  const getAudit = async () => {

    const data = await get("/api/site-check/audit/" + checkId);
    if (data.length > 0) {
      setFormData(data);
      setCompleted(true)
    }
  }

  const [formData, setFormData] = useState([{ sampleNo: "AS001", expanded: false }]);
  const [completed, setCompleted] = useState(false);


  const handleInputChange = (e, idx) => {
    const { name, value } = e.target;
    const uformData = [...formData]
    const udata = {
      ...formData[idx],
      [name]: value,
    }
    uformData[idx] = udata
    setFormData(uformData);
  };

  const handleFileChange = (e, idx) => {
    const uformData = [...formData]
    const udata = {
      ...formData[idx],
      file: e.target.files[0],
    }
    uformData[idx] = udata
    setFormData(uformData);
  };


  const addSiteCheckAudit = async (event) => {
    event.preventDefault();
    const form = event.target;
    if (!form.checkValidity()) {
       form.reportValidity();
    }
  
    for (const data of formData) {
      if (data?.file?.name) {
        data.imageUrl = await uploadSiteCheckDoc(data);
        delete data.file;
      }
      data.dateRaised = new Date(data.dateRaised);
      data.checkId = checkId;
      data.status = "Open";
      await post("/api/site-check/audit", data)

      toast.success("Audit data saved")
    }
    setCompleted(true);
  }

  const expandRow =(e, idx)=> {
    e.preventDefault();
    const udata = [...formData]
    udata[idx].expanded = !udata[idx].expanded;
    setFormData(udata)
  }

  return (
    <form onSubmit={addSiteCheckAudit}>
    <Grid container >

        <Grid sm={6}>
          <br />
        <Typography variant="h6" gutterBottom>
            Asbestos Samples
        </Typography>
      </Grid>
      <Grid sm={6}>
        {!completed &&
          <button
            style={{ width: "250px", marginBottom: '30px', margin: '10px', float: 'right' }}
            className="btn btn-primary btn-light"
            onClick={() => {
              const uformData = [...formData];
              uformData.push({});
              setFormData(uformData)
            }}
          >
              <i className="fas fa-plus" /> Add New Sample
          </button>}

      </Grid>

      <Grid sm={12}>
        <div className="table-responsive">
          <table className="table table-bordered f-11">
            <thead className="table-dark">
              <tr>
                  <th scope="col">Sample No.</th>
                  <th scope="col">Location</th>
                  <th scope="col">Product</th>
                  <th scope="col">Qty</th>
                  <th scope="col">Surface Coating</th>
                  <th scope="col">Condition</th>
                  <th scope="col">Access</th>
                  <th scope="col">Asbestos Type</th>
                  <th scope="col">Material Score</th>
                  <th scope="col">Priority Score</th>
                  <th scope="col">Total Score</th>

                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              {formData.map((d, idx) => {
                return (
                  <tr>
                    <td>
                      {d.sampleNo}
                    </td>
                    <td>

                    </td>
                    <td>

                    </td>
                    <td>

                    </td>
                    <td>

                    </td>
                    <td>

                    </td>
                    <td>

                    </td>
                    <td>

                    </td>
                    <td>

                    </td>
                    <td>

                    </td>
                    <td>

                    </td>
                    <td style={{width:'80px'}} align="center" onClick={(e)=>{expandRow(e, idx)}}>
                      <h1> {d.expanded ? "-" : "+"}</h1>
                     
                    </td>
                   
                  </tr>
                )
              }
              )}
            </tbody>
          </table>
        </div>

      </Grid>
      </Grid>
    </form>

  );
};

const mapStateToProps = (state) => ({
  siteAssets: state.site.siteAssets,
  sites: state.site.sites,
  users: state.site.users,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
});
export default connect(mapStateToProps, { getUsers, deleteUser, getSites, getSiteAssets })(
  AsbestonSample
);

