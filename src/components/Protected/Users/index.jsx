import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import { CSVLink } from "react-csv";
import moment from "moment";
import Header from "../../common/Header/Header";
import BreadCrumHeader from "../../common/BreadCrumHeader/BreadCrumHeader";
import SidebarNew from "../../common/Sidebar/SidebarNew";
import Tooltip from "@mui/material/Tooltip";
import ViewUser from "./ViewUser";
import EditUser from "./EditUser";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import AddUser from "./AddUser";
import { deleteUser, getUsers } from "../../../store/thunk/site";

const Users = ({ users, getUsers, deleteUser }) => {
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  useEffect(() => {
    getUsers();
  }, []);
  const deleteUserCall = (user) => {
    Swal.fire({
      title: `Do you want to delete ${user?.name}`,
      showDenyButton: false,
      showCancelButton: true,
      confirmButtonText: "Delete",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const res = await deleteUser(user?.id);
        if (res === "Success") {
          toast.success(`user has been deleted successully`);
          getUsers();
        } else {
          toast.error(
            `Something went wrong while deleting user. Please try again.`
          );
        }
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
          {showViewModal && (
            <ViewUser
              selectedUser={selectedUser}
              showViewModal={showViewModal}
              setShowViewModal={setShowViewModal}
              refresh={() => {
                getUsers();
              }}
            />
          )}
          {showAddModal && (
            <AddUser
              showAddModal={selectedUser}
              showEditModal={showAddModal}
              setShowAddModal={setShowAddModal}
              refresh={() => {
                getUsers();
              }}
            />
          )}
          {showEditModal && (
            <EditUser
              selectedUser={selectedUser}
              showEditModal={showEditModal}
              setShowEditModal={setShowEditModal}
              refresh={() => {
                getUsers();
              }}
            />
          )}
          <BreadCrumHeader header={"User Management"} page={"Users"} />
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
                  />
                </div>
                <div className="col">
                  <select
                    name="role"
                    className="form-control form-select"
                    id="role"
                  >
                    <option value="">Role</option>
                  </select>
                </div>
                <div className="col">
                  <select
                    name="site"
                    className="form-control form-select"
                    id="site"
                  >
                    <option value="">Site</option>
                  </select>
                </div>
                <div className="col">
                  <select
                    name="status"
                    className="form-control form-select"
                    id="status"
                  >
                    <option value="status">Status</option>
                    <option value="active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="ms-auto p-2 bd-highlight">
              <div className="row" style={{ height: "auto" }}>
                <div className="col">
                  <button
                    className="btn btn-primary text-white pr-2"
                    onClick={() => {
                      setShowAddModal(true);
                    }}
                  >
                    Add New
                  </button>
                  &nbsp;
                </div>
                <div className="col">
                  <CSVLink
                    filename={"site-lists"}
                    className="btn btn-light bg-white text-primary"
                    data={[]}
                  >
                    <i className="fas fa-download"></i>&nbsp;Export
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
                  <th scope="col">Full Name</th>
                  <th scope="col">Email ID</th>
                  <th scope="col">Site</th>
                  <th scope="col">Role</th>
                  <th scope="col">Creation Date</th>
                  <th scope="col">Type</th>
                  <th scope="col">Company</th>
                  <th scope="col">Status</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users?.map((user) => (
                  <tr key={user?.id}>
                    <th scope="col">{user?.name}</th>
                    <th scope="col">{user?.email}</th>
                    <th scope="col">{user?.defaultSiteName}</th>
                    <th scope="col">{user?.role}</th>
                    <th scope="col">
                      {moment(user?.creationDate).format("DD-MM-YYYY")}
                    </th>
                    <th scope="col">{user?.userType}</th>
                    <th scope="col">{user?.company}</th>
                    <th scope="col">{user?.status}</th>
                    <th scope="col">
                      <Tooltip title={`View ${user?.name}`} arrow>
                        <button
                          className="btn btn-sm btn-light"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowViewModal(true);
                          }}
                        >
                          <i className="fas fa-eye"></i>
                        </button>{" "}
                      </Tooltip>
                      <Tooltip title={`Edit ${user?.name}`} arrow>
                        <button
                          className="btn btn-sm btn-light"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowEditModal(true);
                          }}
                        >
                          <i className="fas fa-pen"></i>
                        </button>{" "}
                      </Tooltip>
                      <Tooltip title={`Delete ${user?.name}`} arrow>
                        <button
                          className="btn btn-sm btn-light text-danger"
                          onClick={() => deleteUserCall(user)}
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
const mapStateToProps = (state) => ({
  users: state.site.users,
});
export default connect(mapStateToProps, { getUsers, deleteUser })(Users);
