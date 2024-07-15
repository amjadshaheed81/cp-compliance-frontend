import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import { CSVLink } from "react-csv";
import moment from "moment";
import Header from "../../../common/Header/Header";
import BreadCrumHeader from "../../../common/BreadCrumHeader/BreadCrumHeader";
import Pagination from "../../../common/Pagination/Pagination";
import SidebarNew from "../../../common/Sidebar/SidebarNew";
import Tooltip from "@mui/material/Tooltip";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { get, post, del, put } from "../../../../api";
import Cost from "./Cost";
import Reading from "./Reading";

import { Button, Modal, Chip, CircularProgress, Box, Grid, Divider, Autocomplete, TextField, Typography } from "@mui/material";
import { deleteUser, getSites, getUsers } from "../../../../store/thunk/site";

const EnergyCost = ({ users, getUsers }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [openCost, setOpenCost] = useState(false)
  const [actionSurvey, setActionSurvey] = useState()
  const [openReading, setOpenReading] = useState(false)
  const [typeoptions, settypeoptions] = useState([]);
  const site = JSON.parse(localStorage.getItem("site"))
  const [filteredEnergyCost, setFilteredEnergyCost] = useState([]);
  const [energyCost, setEnergyCost] = useState([]);
  const navigate = useNavigate();
  const goTo = (link) => {
    navigate(link);
  };

  useEffect(() => {
    getUsers();
    gettypeoptions();
  }, []);

  const [itemsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const indexOfLastPreAction = currentPage * itemsPerPage;
  const indexOfFirstPreAction = indexOfLastPreAction - itemsPerPage;
  const currentEnergyCost = filteredEnergyCost.slice(
    indexOfFirstPreAction,
    indexOfLastPreAction
  );
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };
  
  const gettypeoptions = async () => {
    const lovtypes = await get("/api/lov/ENERGY_COST_BUDGET_CATEGORY");
    settypeoptions(lovtypes.map(l => l.lovValue));
  }
  
  useEffect(() => {}, []);
  const [formData, setFormData] = useState({
    searchField: "",
  });
  const [formData2, setFormData2] = useState({
    searchField: "",
    type: "",
    subType: "",
    category: "",
    status: "",
  });
  const  isDateOlderThanToday = (dateString) => {
    const dateToCheck = moment(dateString, 'YYYY-MM-DD');
    const today = moment().startOf('day');
    return dateToCheck.isBefore(today);
  }
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
    searchEnergyCost();
  }, [formData2]);

  const deleteEnergyCost = async (id) => {
    await del("/api/energy/cost/" + id);
    getEnergyCost();
  }

  const deleteEnergyReading = async (id) => {
    await del("/api/energy/reading/" + id);
    getEnergyCost();
  }

  

  const searchEnergyCost = () => {
    let filteredEnergyCost2 = energyCost;
    if (formData2?.budgetCategory?.length > 0) {
      filteredEnergyCost2 = filteredEnergyCost2.filter(sc => sc.budgetCategory === formData2.budgetCategory)
    }
    
    if (formData2?.searchField?.length > 0 && filteredEnergyCost2?.length > 0) {
      filteredEnergyCost2 = filteredEnergyCost2.filter(sc =>
        sc?.reference?.toLowerCase().includes(String(formData2?.searchField).toLowerCase())
      )
    }
    setFilteredEnergyCost(filteredEnergyCost2);
  };
  

  const deleteEnergyCostCall = (action) => {
    Swal.fire({
      title: `Do you want to delete ${action?.reference} ?`,
      showDenyButton: false,
      showCancelButton: true,
      confirmButtonText: "Delete",
    }).then(async (result) => {
      if (result.isConfirmed) {
        setIsLoading(true);
        await del("/api/energy/survey/" + action.energyId);
        getEnergyCost();
      } else if (result.isDenied) {
        toast.info(`delete action has been denied.`);
      }
    });
  };

  useEffect(() => { getEnergyCost() },[])

  const addEnergyCost = async (event) => {
    event.preventDefault();
    const form = event.target;
    if (!form.checkValidity()) {
      form.reportValidity();
    }
    const body = formData;
    body.siteId = site.siteId
    await post("/api/energy/survey", body);
    setFormData({})
    await getEnergyCost();
  }

  const getEnergyCost = async () => {
    if (!site?.siteId) {
      toast.error("Please select site from site search to proceed....");
      return;
    }
    setIsLoading(true);
    const energyCost = await get("/api/energy/site/survey/" + site?.siteId);
    setFilteredEnergyCost(energyCost)
    setEnergyCost(energyCost);
    setIsLoading(false);
  }

  const saveCost = async (data) => {
    data.submittedBy = users?.[0]?.id
    await post("/api/energy/cost", data);
    getEnergyCost();
    
  }

  const saveReading = async (data) => {
    data.submittedBy = users?.[0]?.id;
    console.log(data)
    await post("/api/energy/reading", data);
    getEnergyCost();
  }


  return (
    <Fragment>
      <Cost
        open={openCost}
        setOpen={setOpenCost}
        typeoptions={typeoptions}
        survey={actionSurvey}
        saveData={saveCost}
        deleteEnergyCost={deleteEnergyCost}
      />
      <Reading
        open={openReading}
        setOpen={setOpenReading}
        typeoptions={typeoptions}
        survey={actionSurvey}
        saveData={saveReading}
        deleteEnergyReading={deleteEnergyReading}
      />
      
      <SidebarNew />
      
      <div className="content">
        <Header />
        <div className="container-fluid">
          <BreadCrumHeader header={"Site Energy Readings & Cost"} page={"Energy"} />
          
          <div className="d-flex bd-highlight">
            <div className="pt-2 bd-highlight ">
              
              <div className="row" style={{ height: "auto" }}>
                  <div className="col">
                    <div style={{ position: "relative" }}>
                      <i
                        style={{
                          position: "absolute",
                          padding: "10px",
                          color: "lightgrey",
                          paddingLeft: "1.5rem",
                        }}
                        className="fas fa-search"
                      ></i>
                      <input
                        type="text"
                        placeholder="Search"
                        name="searchField"
                        style={{ textAlign: "center", width: '250px' }}
                        className="form-control"
                        onChange={handleInputChange2}
                      />
                    </div>
                  
                </div>
                <div className="col">
                  <select
                    name="budgetCategory"
                    className="form-control form-select"
                    id="budgetCategory"
                      onChange={handleInputChange2}
                  >
                    <option value="">Budget Category</option>
                      {typeoptions.map(t => <option value={t}>{t}</option>)}
                   
                  </select>
                </div>
                
                
                </div>
            </div>
            <div className="ms-auto p-2 bd-highlight" style={{ backgroundColor: '#384BD3', borderRadius: '15px'}}>
              <form onSubmit={addEnergyCost}>
              <div className="row" style={{ height: "auto" }}>
                <div className="col">
                  
                </div>
                <div className="col" >
                  <Typography color="white" style={{marginBottom: '8px'}}> CREATE NEW </Typography> 
                </div>
                <div className="col">
                  
                </div>
                
              </div>
              <div className="row" style={{ height: "auto" }}>
                <div className="col">
                <input
                      type="reference"
                      value={formData?.reference}
                  name="reference"
                      className="form-control"
                      required
                      onChange={handleInputChange}
                    placeholder="Energy Survey Reference"
                    
                  />
                </div><div className="col">
                <select
                  name="budgetCategory"
                  className="form-control form-select"
                      id="budgetCategory"
                      value={formData?.budgetCategory}
                      onChange={handleInputChange}
                      required
                >
                  <option value="">Budget Category</option>
                  {typeoptions.map(t => <option value={t}>{t}</option>)}

                  </select>
                </div><div className="col">
                <button
                  style={{ width: "150px" }}
                  className="btn btn-primary btn-light"
                  type="submit"
                >
                 Create
                  </button>
                </div>
                </div>
              </form>
            </div>
            <div className="ms-auto p-2 bd-highlight">
              <div className="row" style={{ height: "auto" }}>
                
                <div className="col">
                  <CSVLink
                      filename={"energy_cost" + moment(new Date()).format("DD-MM-YYYY")}
                    className="btn btn-light bg-white text-primary"
                      data={filteredEnergyCost}
                  >
                      <i className="fas fa-upload"/> &nbsp; Buld Upload
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
                    <th scope="col">Survey Reference</th>
                  {/* <th scope="col">Submitted By</th> */}
                  <th scope="col">Budget Category</th>
                    <th scope="col">From Date</th>
                    <th scope="col">To Date</th>
                    <th scope="col">Reading</th>
                    <th scope="col">Cost</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!isLoading && filteredEnergyCost?.length === 0 && (
                  <tr>
                    <td>No result found!!</td>
                  </tr>
                  )}
                  {isLoading && (
                    <tr>
                      <td colSpan={8} align="center">
                        <CircularProgress />
                      
                      </td>
                    </tr>
                  )}
                  
                {!isLoading && filteredEnergyCost?.map((action) =>
                  {
                    let leanName = "-"
                    const lead = users.filter(u => u.id == action.leadUserID);
                    if (lead.length > 0) {
                      leanName = lead[0].trade  + ' - ' +lead[0].name + ' ('+lead[0].email +') - ' + lead[0].company;
                    }
                    return (
                    <tr key={action?.id}>
                        <th scope="col">{action?.reference}</th>
                        <th scope="col">{action?.budgetCategory}</th>
                        <th scope="col" style={{ width: '150px' }}>
                          {moment(action?.dueDate).format("DD-MM-YYYY")}
                        </th>
                        <th scope="col" style={{ width: '150px' }}>
                          {moment(action?.dueDate).format("DD-MM-YYYY")}
                        </th>
                        <th scope="col">{action?.costList?.map(c => c.cost).reduce((a,b)=>{return a+b}, 0)}</th>
                        <th scope="col">{action?.readingList?.map(c => c.readingValue).reduce((a, b) => { return a + b }, 0)}</th>

                       
                        <th scope="col" style={{ width: '250px' }}>
                        <Tooltip title={`View/Edit Energy Cost`} arrow>
                          <button
                            className="btn btn-sm btn-light"
                              onClick={() => { setActionSurvey(action); setOpenCost(true) }}
                            >
                            <i className="fas fa-dollar-sign"></i>
                          </button>{" "}
                        </Tooltip>
                          <Tooltip title={`View /Edit Energy Reading`} arrow>
                          <button
                            className="btn btn-sm btn-light"
                              onClick={() => { setActionSurvey(action); setOpenReading(true); }}
                            >
                              <i class="fas fa-solid fa-chart-line"></i>{" "}
                          </button>{" "}
                        </Tooltip>
                        
                          
                        <Tooltip title={`Delete`} arrow>
                          <button
                            className="btn btn-sm btn-light text-dark"
                            onClick={() => deleteEnergyCostCall(action)}
                          >
                            <i className="fas fa-trash"></i>
                          </button>{" "}
                        </Tooltip>
                      </th>
                    </tr>
                  )
                  })}
              </tbody>
              </table>
             
                <Pagination
                  totalPages={Math.ceil(filteredEnergyCost.length / itemsPerPage)}
                  currentPage={currentPage}
                  onPageChange={handlePageChange}
                />
              
            </div>
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
  EnergyCost
);

