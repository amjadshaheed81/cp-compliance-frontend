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
import { get, post, del } from "../../../../api";

import { Button, Modal, Typography, Box, Grid, Divider } from "@mui/material";
import { deleteUser, getSites, getUsers } from "../../../../store/thunk/site";

const SiteChecks = ({ users, getUsers }) => {
  const [create, setCreate] = useState(false);
  const [typeoptions, settypeoptions] = useState([]);
  const [subtypeoptions, setsubtypeoptions] = useState([]);
  const [subtypeoptions2, setsubtypeoptions2] = useState([]);
  const [catoptions, setcatoptions] = useState([]);
  const site = JSON.parse(localStorage.getItem("site"))
  const [filteredSiteChecks, setFilteredSiteChecks] = useState([]);
  const [siteChecks, setSiteChecks] = useState([]);
  const navigate = useNavigate();
  const goTo = (link) => {
    navigate(link);
  };

  useEffect(() => {
    getUsers();
    gettypeoptions();
  }, []);
  
  const gettypeoptions = async () => {
    const lovtypes = await get("/api/lov/SITE_CHECK_TYPE");
    settypeoptions(lovtypes.map(l => l.lovValue));
  }
  const getsubtypeoptions = async () => {
    const lovtypes = await get("/api/lov/SITE_CHECK_SUB_TYPE?filter1"+formData2.type);
    setsubtypeoptions(lovtypes.map(l => l.lovValue));
  }

  const getcatoptions = async () => {
    const lovtypes = await get("/api/lov/SITE_CHECK_CATEGORY?filter1" + formData.category);
    setcatoptions(lovtypes.map(l => l.lovValue));
  }

  const getsubtypeoptions2 = async () => {
    const lovtypes = await get("/api/lov/SITE_CHECK_SUB_TYPE?filter1" + formData.type);
    setsubtypeoptions2(lovtypes.map(l => l.lovValue));
  }
  useEffect(() => {}, []);
  const [formData, setFormData] = useState({
    searchField: "",
    type: "",
    subType: "",
    category: "",
    status: "Open",
  });
  const [formData2, setFormData2] = useState({
    searchField: "",
    type: "",
    subType: "",
    category: "",
    status: "Open",
  });
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleInputChange2 = (e) => {
    const { name, value } = e.target;
    setFormData2({
      ...formData2,
      [name]: value,
    });
  };

  useEffect(() => {
    searchPreActions();
    if (formData2.type?.length > 0) {
      getsubtypeoptions();
    }
  }, [formData2.type, formData2.searchField, formData2.subType, formData2.status]);

  useEffect(() => {
    searchPreActions();
    if (formData.type?.length > 0) {
      getsubtypeoptions2();
    }
  }, [formData.type]);

  useEffect(() => {
    searchPreActions();
    if (formData.subType?.length > 0) {
      getcatoptions();
    }
  }, [formData.subType]);

  const searchPreActions = () => {
    console.log(formData2)
    let filteredSiteChecks2 = siteChecks;
    if (formData2?.type?.length > 0) {
      filteredSiteChecks2 = filteredSiteChecks2.filter(sc => sc.type === formData2.type)
    }
    if (formData2?.subType?.length > 0) {
      filteredSiteChecks2 = filteredSiteChecks2.filter(sc => sc.subType === formData2.subType)
    }
    if (formData2?.status?.length > 0) {
       filteredSiteChecks2 = filteredSiteChecks2.filter(sc => sc.status === formData2.status)
    }
    if (formData2?.searchField?.length > 0) {
      filteredSiteChecks2 = filteredSiteChecks2.filter(sc =>
        sc?.type.toLowerCase().includes(String(formData2?.searchField).toLowerCase()) ||
        sc?.subType.toLowerCase().includes(String(formData2?.searchField).toLowerCase()) ||
        sc?.category.toLowerCase().includes(String(formData2?.searchField).toLowerCase()) ||
        sc?.leadUserID.toLowerCase().includes(String(formData2?.searchField).toLowerCase())
      )
    }
    setFilteredSiteChecks(filteredSiteChecks2);
    //const searchField = formData?.searchField;
    //const status = formData?.status;
    //if (searchField || status) {
      //   const list = users?.filter(
      //     (x) =>
      //       String(x?.name)
      //         .toLowerCase()
      //         .includes(String(searchField).toLowerCase()) &&
      //       String(x?.role).toLowerCase().includes(String(role).toLowerCase()) &&
      //       String(x?.defaultSiteName)
      //         .toLowerCase()
      //         .includes(String(site).toLowerCase()) &&
      //       String(x?.status).toLowerCase().includes(String(status).toLowerCase())
      //   );
      //   setFilteredUser(list);
    //} else {
      //   setFilteredUser(users);
    //}
  };
  const deleteSiteCheckCall = (action) => {
    Swal.fire({
      title: `Do you want to delete ${action?.type} site check?`,
      showDenyButton: false,
      showCancelButton: true,
      confirmButtonText: "Delete",
    }).then(async (result) => {
      if (result.isConfirmed) {
        await del("/api/site-check/check-id/" + action.checkId);
        getSiteChecks();
        // if (res === "Success") {
        //   toast.success(`${user?.name} user has been deleted successully`);
        //   getUsers();
        // } else {
        //   toast.error(
        //     `Something went wrong while deleting user. Please try again.`
        //   );
        // }
      } else if (result.isDenied) {
        toast.info(`delete action has been denied.`);
      }
    });
  };

  useEffect(() => { getSiteChecks() },[])

  const addSiteCheck = async () => {
    
    const body = formData;
    body.siteId = site.siteId
    body.dueDate = new Date(body.dueDate);
    await post("/api/site-check/", body );
    await getSiteChecks();
    setCreate(false);
  }

  const getSiteChecks = async () => {
    const siteChecks = await get("/api/site-check/site/" + site.siteId);
    console.log("siteCheckssiteChecks", siteChecks)
    setFilteredSiteChecks(siteChecks)
    setSiteChecks(siteChecks);
  }


  return (
    <Fragment>
      <SidebarNew />
      
      <div className="content">
        <Header />
        <div className="container-fluid">
          {!create && <>
          <BreadCrumHeader header={"Site Check"} page={"Site Inspection"} />
          
          <div className="d-flex bd-highlight">
            <div className="pt-2 bd-highlight ">
              <div className="row" style={{ height: "auto" }}>
                <div className="col">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search"
                    name="searchField"
                      onChange={handleInputChange2}
                  />
                </div>
                <div className="col">
                  <select
                    name="type"
                    className="form-control form-select"
                    id="type"
                      onChange={handleInputChange2}
                  >
                      <option value="">Select Type</option>
                      {typeoptions.map(t => <option value={t}>{t}</option>)}
                   
                  </select>
                </div>
                <div className="col">
                  <select
                    name="subType"
                    className="form-control form-select"
                      id="subType"
                      disabled={formData2?.type?.length === 0}
                      onChange={handleInputChange2}
                  >
                    <option value="">Select Sub Type</option>
                      {subtypeoptions.map(t => <option value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="col">
                  <select
                    name="status"
                    className="form-control form-select"
                    id="status"
                    onChange={handleInputChange2}
                  >
                    <option value="">Status</option>
                    <option value="Open">Open</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="ms-auto p-2 bd-highlight">
              <div className="row" style={{ height: "auto" }}>
                <div className="col">
                  <button
                    style={{ width: "150px" }}
                    className="btn btn-primary text-white pr-2"
                    onClick={() => { setCreate(true) }}
                  >
                    Start New
                  </button>
                </div>
                <div className="col">
                  <CSVLink
                    filename={"pre-action-list"}
                    className="btn btn-light bg-white text-primary"
                    data={[]}
                  >
                    <Tooltip title={`Export`} arrow>
                      <i className="fas fa-download"></i>
                    </Tooltip>
                  </CSVLink>
                </div>
              </div>
            </div>
          </div>
          
          <div className="row p-2"></div>
          <div className="col-md-12 table-responsive">
            <table className="table">
              <thead className="table-dark">
                <tr>
                  <th scope="col">Type</th>
                  <th scope="col">Sub-Type</th>
                  <th scope="col">Summary</th>
                  <th scope="col">Lead</th>
                  <th scope="col">Risk Score</th>
                  <th scope="col">Date</th>
                  <th scope="col">Status</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSiteChecks?.length === 0 && (
                  <tr>
                    <td>No search result found!!</td>
                  </tr>
                )}
                {filteredSiteChecks?.map((action) => (
                  <tr key={action?.id}>
                    <th scope="col">{action?.type}</th>
                    <th scope="col">{action?.subType}</th>
                    <th scope="col">{action?.category}</th>
                    <th scope="col">{action?.leadUserID}</th>
                    <th scope="col">
                      <span className="badge bg-danger p-2 m-1 risk-span">
                        1
                      </span>
                      <span className="badge bg-warning p-2 m-1 risk-span">
                        1
                      </span>
                      <span className="badge bg-info p-2 m-1 risk-span">1</span>
                      <span className="badge bg-success p-2 m-1 risk-span">
                        1
                      </span>
                    </th>
                    <th scope="col">
                      {moment(action?.dueDate).format("DD-MM-YYYY")}
                    </th>
                    <th scope="col">{action?.status}</th>
                    <th scope="col">
                      <Tooltip title={`View ${action?.type}`} arrow>
                        <button
                          className="btn btn-sm btn-light"
                          onClick={() => { navigate(`/site-checks/${action?.checkId}/update`);}}
                        >
                          <i className="fas fa-eye"></i>
                        </button>{" "}
                      </Tooltip>
                      <Tooltip title={`${action?.type} List`} arrow>
                        <button
                          className="btn btn-sm btn-light"
                          onClick={() => {}}
                        >
                          <i class="fas fa-regular fa-list cursor"></i>{" "}
                        </button>{" "}
                      </Tooltip>
                      <Tooltip title={`${action?.type} mark as closed`} arrow>
                        <button
                          className="btn btn-sm btn-light"
                          onClick={() => {}}
                        >
                          <i class="fas fa-regular fa-thumbs-up cursor"></i>{" "}
                        </button>{" "}
                      </Tooltip>
                      <Tooltip title={`Delete ${action?.type}`} arrow>
                        <button
                          className="btn btn-sm btn-light text-dark"
                          onClick={() => deleteSiteCheckCall(action)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>{" "}
                      </Tooltip>
                    </th>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </>}
          {create && 
            <div >
            <BreadCrumHeader header={"Site Check - New"} page={"New"} />
              <Grid container >

              
                    <Grid sm={4}>
                      <div style={{ margin: "10px" }}>
                        <label htmlFor="folder" name="folder">
                          Type
                        </label>
                        <select
                          name="type"
                          className="form-control form-select"
                          id="type"
                          onChange={handleInputChange}
                        >
                          <option value="">Select Type</option>
                          {typeoptions.map(t => <option value={t}>{t}</option>)}
                        </select>
                      </div>
                </Grid>
                <Grid sm={4}>
                  <div style={{ margin: "10px" }}>
                    <label htmlFor="folder" name="folder">
                      Sub Type
                    </label>
                    <select
                      name="subType"
                      className="form-control form-select"
                      disabled={formData?.type?.length === 0}
                      id="subType"
                      onChange={handleInputChange}
                    >
                      <option value="">Select Sub Type</option>
                      {subtypeoptions2.map(t => <option value={t}>{t}</option>)}
                    </select>
                  </div>
                </Grid>
                <Grid sm={4}>
                  <div style={{ margin: "10px" }}>
                    <label htmlFor="category" name="category">
                      Category
                    </label>
                    <select
                      name="category"
                      disabled={formData?.subType?.length === 0}
                      className="form-control form-select"
                      id="category"
                      onChange={handleInputChange}
                    >
                      <option value="">Select Category</option>
                      {catoptions.map(t => <option value={t}>{t}</option>)}
                    </select>
                  </div>
                </Grid>
                <Grid sm={4}>
                  <div style={{ margin: "10px" }}>
                    <label htmlFor="folder" name="folder">
                      Due Date
                    </label>
                    <input
                      //value={issueDate}
                      type="date"
                      name="dueDate"
                      className="form-control"
                      onChange={handleInputChange}
                    />
                  </div>
                </Grid>
                <Grid sm={4}>
                  <div style={{ margin: "10px" }}>
                    <label htmlFor="folder" name="folder">
                      Lead
                    </label>
                    <select
                      name="leadUserID"
                      className="form-control form-select"
                      id="leadUserID"
                      onChange={handleInputChange}
                    >
                      <option value="">Select Lead</option>
                      {users.map(u => {
                        return (
                          <option value={u.id}>{u.role} - {u.name} ({u.email}) </option>
                        )
                      })}
                    </select>
                  </div>
                </Grid>
                <Grid sm={4}>
                  <div style={{ margin: "10px" }}>
                    <label htmlFor="folder" name="folder">
                      Assistant
                    </label>
                    <select
                      name="assistantUserID"
                      className="form-control form-select"
                      id="assistantUserID"
                      onChange={handleInputChange}
                    >
                      <option value="">Select Assistant</option>
                      {users.map(u => {
                        return (
                          <option value={u.id}>{u.role} - {u.name} ({u.email}) </option>
                        )
                      })}
                    </select>
                  </div>
                </Grid>

                <Grid sm={4}>
                  <div style={{ margin: "10px" }}>
                    <label htmlFor="folder" name="folder">
                      Repeats
                    </label>
                    <select
                      name="repeatFrequency"
                      className="form-control form-select"
                      id="repeatFrequency"
                      onChange={handleInputChange}
                    >
                      <option value="">None</option>
                      
                    </select>
                  </div>
                </Grid>
                <Grid sm={4}>

                </Grid>
                <Grid sm={4}>

                </Grid>
                <hr />
                <Grid sm={4}>

                </Grid>
                <Grid sm={4}>

                </Grid>
                <Grid sm={4}>
                  <button
                    style={{ width: "150px", marginBottom: '20px', margin: '10px', float: 'right' }}
                    className="btn btn-primary text-white pr-2"
                    onClick={() => { addSiteCheck() }}
                  >
                    Save & Continue
                  </button>
                  <button
                    style={{ width: "150px", marginBottom: '20px',margin: '10px', float: 'right' }}
                    className="btn btn-primary btn-light"
                    onClick={() => { setCreate(false) }}
                  >
                    Cancel
                  </button>
                  
                </Grid>
                
                    
              </Grid>
            
            </div>
                }
        </div>
      </div>
    </Fragment>
  );
};

const mapStateToProps = (state) => ({
  sites: state.site.sites,
  users: state.site.users,
});
export default connect(mapStateToProps, { getUsers, deleteUser, getSites })(
  SiteChecks
);

