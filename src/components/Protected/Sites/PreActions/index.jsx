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

const PreActions = ({}) => {
  const [filteredPreActions, setFilteredPreActions] = useState([
    {
      id: "PA100001",
      raisedBy: "Dheeraj",
      comment: "Lorem Ipsum",
      location: "Internal > Room G1",
      raisedOn: new Date(),
      status: "Open",
    },
  ]);
  const [selectedPreAction, setSelectedPreAction] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const navigate = useNavigate();
  const goTo = (link) => {
    navigate(link);
  };

  useEffect(() => {}, []);
  const [formData, setFormData] = useState({
    searchField: "",
    location: "",
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
  const deleteUserCall = (action) => {
    Swal.fire({
      title: `Do you want to delete ${action?.id} action?`,
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
          {/* {showViewModal && (
            <ViewUser
              selectedUser={selectedUser}
              showViewModal={showViewModal}
              setShowViewModal={setShowViewModal}
              refresh={() => {
                getUsers();
              }}
            />
          )} */}
          {/* {showAddModal && (
            <AddUser
              showAddModal={selectedUser}
              showEditModal={showAddModal}
              setShowAddModal={setShowAddModal}
              refresh={() => {
                getUsers();
              }}
            />
          )} */}
          {/* {showEditModal && (
            <EditUser
              selectedUser={selectedUser}
              showEditModal={showEditModal}
              setShowEditModal={setShowEditModal}
              refresh={() => {
                getUsers();
              }}
            />
          )} */}
          <BreadCrumHeader header={"Pre-Action"} page={"Pre-Action"} />
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
                    name="location"
                    className="form-control form-select"
                    id="location"
                    onChange={handleInputChange}
                  >
                    <option value="">Location</option>
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
                    <option value="Close">Close</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="ms-auto p-2 bd-highlight">
              <div className="row" style={{ height: "auto" }}>
                <div className="col">
                  <Tooltip title={`Create New`} arrow>
                    <button
                      className="btn btn-primary text-white pr-2"
                      onClick={() => {
                        setShowAddModal(true);
                      }}
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
                  <th scope="col">Pre ActionID</th>
                  <th scope="col">Raised By</th>
                  <th scope="col">Comment</th>
                  <th scope="col">Location</th>
                  <th scope="col">Raised On</th>
                  <th scope="col">Status</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPreActions?.length === 0 && (
                  <tr>
                    <td>No search result found!!</td>
                  </tr>
                )}
                {filteredPreActions?.map((action) => (
                  <tr key={action?.id}>
                    <th scope="col">{action?.id}</th>
                    <th scope="col">{action?.raisedBy}</th>
                    <th scope="col">{action?.comment}</th>
                    <th scope="col">{action?.location}</th>
                    <th scope="col">
                      {moment(action?.raisedOn).format("DD-MM-YYYY")}
                    </th>
                    <th scope="col">{action?.status}</th>
                    <th scope="col">
                      <Tooltip title={`View ${action?.id}`} arrow>
                        <button
                          className="btn btn-sm btn-light"
                          onClick={() => {
                            goTo("/view-update-pre-actions");
                          }}
                        >
                          <i className="fas fa-eye"></i>
                        </button>{" "}
                      </Tooltip>
                      <Tooltip title={`${action?.id} mark as closed`} arrow>
                        <button
                          className="btn btn-sm btn-light"
                          onClick={() => {}}
                        >
                          <i className="fas fa-check"></i>
                        </button>{" "}
                      </Tooltip>
                      <Tooltip title={`Delete ${action?.id}`} arrow>
                        <button
                          className="btn btn-sm btn-light text-dark"
                          onClick={() => deleteUserCall(action)}
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
export default connect(mapStateToProps, {})(PreActions);
