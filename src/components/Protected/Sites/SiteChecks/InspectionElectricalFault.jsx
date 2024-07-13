import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import { get, post, uploadSiteCheckDoc } from "../../../../api";

import { Typography, Grid, Autocomplete, Chip, Divider } from "@mui/material";
import { getSiteAssets } from "../../../../store/thunk/site";

const InspectionElectricalFault = ({ sasToken, checkId, siteAssets, getSiteAssets, siteSelectedForGlobal }) => {

  useEffect(() => {
    if (siteSelectedForGlobal?.siteId) {
      getSiteAssets(siteSelectedForGlobal?.siteId);

    }
    getIpection();
  }, []);

  const getIpection = async () => {

    const data = await get("/api/site-check/inspection/fault/" + checkId);
    if (data.length > 0) {
      setFormData(data);
      setCompleted(true)
    }
  }
  const [formData, setFormData] = useState([{
    add:true
  }]);
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


  const addSiteCheckFault = async (event) => {
    event.preventDefault();
    const form = event.target;
    if (!form.checkValidity()) {
      form.reportValidity();
    }
    for (const data of formData) {
      if (data.add) {
        if (data?.file?.name) {
          data.imageUrl = await uploadSiteCheckDoc(data);
          delete data.file;
        }
        data.dateRaised = new Date(data.dateRaised);
        data.checkId = checkId;
        data.status = "Open";
        await post("/api/site-check/inspection/fault", data)
      } 
    }
    toast.success("Fault data saved")
    setCompleted(true);
  }


  return (
    <form onSubmit={addSiteCheckFault}>
    <Grid container >

      <Grid sm={4}>
        <br />
        {/* <Typography variant="h6" gutterBottom>
          Faults Identified <Chip color={completed ? 'success' : 'warning'} label={completed ? 'Closed' : 'Open'} />
        </Typography> */}
          <Typography variant="h6" gutterBottom>
            Faults Identified <Chip color={'warning'} label={'Open'} />
          </Typography>
        <br />

      
       
      </Grid>
      <Grid sm={4}>

      </Grid>
      <Grid sm={4}>
       
          <button
            style={{ width: "150px", marginBottom: '20px', margin: '10px', float: 'right' }}
            className="btn btn-primary btn-light"
            onClick={() => {
              const uformData = [...formData];
              uformData.push({add: true});
              setFormData(uformData)
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
                <th scope="col">ASSET</th>
                <th scope="col">FAULT</th>
                <th scope="col">DATE RAISED</th>
                <th scope="col">RATING</th>
                <th scope="col">IMAGE</th>
                <th scope="col">SUGGESTED ACTION</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
                {formData.map((d, idx) => {
                  const completed = formData?.[idx]?.faultId && !formData?.[idx]?.edit;
                const assetName = siteAssets.filter(a => a.assetId == formData[idx].assetId).map(option => option.assetName + " - " + option.category)?.[0];
                return (
                  <tr>
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
                            <input type="text" {...params.inputProps}
                              required disabled={completed} className="form-control" />
                          </div>

                        )}
                      />
                      }
                    </td>
                    <td>
                      <input
                        type="text"
                        disabled={completed}
                        required
                        name="faultDescription"
                        className="form-control"
                        id="faultDescription"
                        value={formData?.[idx]?.faultDescription}
                        onChange={(e) => handleInputChange(e, idx)}
                      />
                    </td>
                    <td> <input
                      disabled={completed}
                      type="date"
                      required
                      name="dateRaised"
                      value={String(formData?.[idx]?.dateRaised)?.substring(0, 10)}
                      className="form-control"
                      id="dateRaised"

                      onChange={(e) => handleInputChange(e, idx)}
                    /></td>
                    <td>
                      <select
                        disabled={completed}
                        name="rating"
                        required
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
                      {completed && formData?.[idx]?.imageUrl &&
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
                        required
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
                      required
                      onChange={(e) => handleInputChange(e, idx)}
                    /></td>
                    <td>
                      {!completed && !formData?.[idx]?.edit && 
                        <button
                          disabled={completed}
                          className="btn btn-sm btn-light text-dark"
                          onClick={() => {
                            const uformData = [...formData];
                            if (uformData.length > 1) {
                              uformData.splice(idx, 1);
                              setFormData(uformData)
                            }
                          }}
                        >
                          <i className="fas fa-trash"></i>
                        </button>}
                      {completed &&
                        <button
                          className="btn btn-sm btn-light text-dark"
                          onClick={() => {
                            const uformData = [...formData];
                            uformData[idx].edit = true;
                            setFormData(uformData)
                          }}
                        >
                          <i className="fas fa-edit"></i>
                        </button>}
                    </td>
                  </tr>
                )
              }
              )}
            </tbody>
          </table>
        </div>

      </Grid>
       <Grid sm={12}>

        <button
          style={{ width: "150px", marginBottom: '20px', margin: '10px', float: 'right' }}
          className="btn btn-primary text-white pr-2"
            //onClick={() => { addSiteCheckFault() }}
            type="submit"
        >
          Save
        </button>


      </Grid>
      </Grid>
      </form>

  );
};

const mapStateToProps = (state) => ({
  siteAssets: state.site.siteAssets,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
});
export default connect(mapStateToProps, { getSiteAssets })(
  InspectionElectricalFault
);

