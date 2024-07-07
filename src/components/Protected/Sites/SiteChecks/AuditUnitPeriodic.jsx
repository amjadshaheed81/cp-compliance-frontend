import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { get, post, uploadSiteCheckDoc } from "../../../../api";

import { Typography, Grid, Autocomplete } from "@mui/material";
import { deleteUser, getSites, getUsers, getSiteAssets } from "../../../../store/thunk/site";

const AuditUnitPeriodic = ({ sasToken, checkId, siteAssets, getSiteAssets, siteSelectedForGlobal }) => {
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

  const [formData, setFormData] = useState([{}]);
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


  const addSiteCheckAudit = async () => {
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


  return (

    <Grid container >

      <Grid sm={4}>
        <Typography variant="h6" gutterBottom>
          Observations
        </Typography>
      </Grid>
      <Grid sm={4}>

      </Grid>
      <Grid sm={4}>
        {!completed &&
          <button
            style={{ width: "150px", marginBottom: '20px', margin: '10px', float: 'right' }}
            className="btn btn-primary btn-light"
            onClick={() => {
              const uformData = [...formData];
              uformData.push({});
              setFormData(uformData)
            }}
          >
            Record New
          </button>}

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
              {formData.map((d, idx) => {
                const assetName = siteAssets.filter(a => a.assetId == formData[idx].assetId).map(option => option.assetName + " - " + option.category)?.[0];
                return (
                  <tr>
                    <td>
                      <input
                        type="text"
                        disabled={completed}
                        name="summary"
                        className="form-control"
                        id="summary"
                        value={formData?.[idx]?.summary}
                        onChange={(e) => handleInputChange(e, idx)}
                      />
                    </td>
                    <td>
                      {completed && <input type="text"
                        disabled={completed}
                        className="form-control"
                        value={assetName} />}
                      {!completed && <Autocomplete
                        id="assetId"
                        disabled={completed}
                        onChange={(event, item) => {
                          const uformData = [...formData]
                          uformData[idx].assetId = item?.key;
                          setFormData(uformData);
                        }}
                        options={siteAssets.map((option) => { return { key: option.assetId, label: option.assetName + " - " + option.category } })}
                        getOptionLabel={(option) => option.label}
                        renderInput={(params) => (
                          <div ref={params.InputProps.ref} >
                            <i
                              style={{
                                position: "absolute",
                                padding: "13px",
                                color: "lightgrey",
                                paddingLeft: "10rem",
                                float: 'right'
                              }}
                              className="fas fa-search"
                            ></i>
                            <input type="text" {...params.inputProps} disabled={completed} className="form-control" />
                          </div>

                        )}
                      />
                      }
                    </td>
                    <td> <input
                      disabled={completed}
                      type="date"
                      name="dateRaised"
                      value={formData?.[idx]?.dateRaised?.substring(0, 10)}
                      className="form-control"
                      id="dateRaised"

                      onChange={(e) => handleInputChange(e, idx)}
                    /></td>
                    <td>
                      <select
                        disabled={completed}
                        name="rating"
                        className="form-control form-select"
                        id="rating"
                        value={formData?.[idx]?.rating}
                        onChange={(e) => handleInputChange(e, idx)}
                      >
                        <option value="">Select Rating</option>
                        <option value={1}>1</option>
                        <option value={2}>2</option>
                        <option value={3}>3</option>
                        <option value={4}>4</option>
                        <option value={5}>5</option>
                      </select>
                    </td>
                    <td align="center">
                      {completed &&
                        <a href={formData?.[idx]?.imageUrl + "?" + sasToken} target="_blank">
                          <button
                            disabled={completed}
                            className="btn btn-sm btn-light text-dark"
                            onClick={() => {

                            }}
                          >
                            <i className="fas fa-download"></i>
                          </button>
                        </a>}
                      {!completed && <input
                        disabled={completed}
                        type="file"
                        name="file"
                        className="form-control"
                        id="file"
                        onChange={(e) => handleFileChange(e, idx)}
                      />}
                    </td>
                    <td><input
                      disabled={completed}
                      value={formData?.[idx]?.action}
                      type="text"
                      name="action"
                      className="form-control"
                      id="action"
                      onChange={(e) => handleInputChange(e, idx)}
                    /></td>
                    <td>
                      <button
                        disabled={completed}
                        className="btn btn-sm btn-light text-dark"
                        onClick={() => {
                          const uformData = [...formData];
                          uformData.splice(idx, 1);
                          setFormData(uformData)
                        }}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                )
              }
              )}
            </tbody>
          </table>
        </div>

      </Grid>
      {!completed && <Grid sm={12}>

        <button
          style={{ width: "150px", marginBottom: '20px', margin: '10px', float: 'right' }}
          className="btn btn-primary text-white pr-2"
          onClick={() => { addSiteCheckAudit() }}
        >
          Save
        </button>


      </Grid>}
    </Grid>

  );
};

const mapStateToProps = (state) => ({
  siteAssets: state.site.siteAssets,
  sites: state.site.sites,
  users: state.site.users,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
});
export default connect(mapStateToProps, { getUsers, deleteUser, getSites, getSiteAssets })(
  AuditUnitPeriodic
);

