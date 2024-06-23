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

const SiteChecks = ({}) => {
  const [filteredSiteChecks, setFilteredSiteChecks] = useState([
    {
      id: "PA100001",
      type: "Dheeraj",
      subType: "Lorem Ipsum",
      summary: "Internal > Room G1",
      lead: "Joe B",
      riskScore: "",
      date: "21/05/1992",
      status: "Open",
    },
  ]);
  const navigate = useNavigate();
  const goTo = (link) => {
    navigate(link);
  };

  useEffect(() => {}, []);
  const [formData, setFormData] = useState({
    searchField: "",
    type: "",
    subType: "",
    status: "",
  });
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  useEffect(() => {
    searchPreActions();
  }, [formData.role, formData.searchField, formData.site, formData.status]);
  const searchPreActions = () => {
    const searchField = formData?.searchField;
    const location = formData?.location;
    const status = formData?.status;
    if (searchField || location || status) {
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
    } else {
      //   setFilteredUser(users);
    }
  };
  const deleteSiteCheckCall = (action) => {
    Swal.fire({
      title: `Do you want to delete ${action?.type} site check?`,
      showDenyButton: false,
      showCancelButton: true,
      confirmButtonText: "Delete",
    }).then(async (result) => {
      if (result.isConfirmed) {
        // const res = await deleteUser(user?.id);
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

  return (
    <Fragment>
      <SidebarNew />
      <div className="content">
        <Header />
        <div className="container-fluid">
          <BreadCrumHeader header={"Site Check"} page={"Site Inspection"} />
          {/*  */}
          {/*  */}
          <div className="d-flex bd-highlight">
            <div className="pt-2 bd-highlight ">
              <div className="row" style={{ height: "auto" }}>
                <div className="col">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search"
                    name="searchField"
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col">
                  <select
                    name="type"
                    className="form-control form-select"
                    id="type"
                    onChange={handleInputChange}
                  >
                    <option value="">Select Type</option>
                  </select>
                </div>
                <div className="col">
                  <select
                    name="subType"
                    className="form-control form-select"
                    id="subType"
                    onChange={handleInputChange}
                  >
                    <option value="">Select Sub Type</option>
                  </select>
                </div>
                <div className="col">
                  <select
                    name="status"
                    className="form-control form-select"
                    id="status"
                    onChange={handleInputChange}
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
                  <Tooltip title={`Start New`} arrow>
                    <button
                      className="btn btn-primary text-white pr-2"
                      onClick={() => {}}
                    >
                      <i className="fas fa-plus"></i>
                    </button>
                  </Tooltip>
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
          {/* row start*/}
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
                    <th scope="col">{action?.summary}</th>
                    <th scope="col">{action?.lead}</th>
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
                      {moment(action?.date).format("DD-MM-YYYY")}
                    </th>
                    <th scope="col">{action?.status}</th>
                    <th scope="col">
                      <Tooltip title={`View ${action?.type}`} arrow>
                        <button
                          className="btn btn-sm btn-light"
                          onClick={() => {}}
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
          {/* row end*/}
        </div>
      </div>
    </Fragment>
  );
};
const mapStateToProps = () => ({});
export default connect(mapStateToProps, {})(SiteChecks);
