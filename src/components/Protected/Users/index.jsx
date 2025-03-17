import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import { CSVLink } from "react-csv";
import moment from "moment";
import Header from "../../common/Header/Header";
import BreadCrumHeader from "../../common/BreadCrumHeader/BreadCrumHeader";
import SidebarNew from "../../common/Sidebar/SidebarNew";
import Tooltip from "@mui/material/Tooltip";
import ViewUser from "./ViewUser";
import ResetPassword from "./ResetPassword";
import EditUser from "./EditUser";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { Chip } from "@mui/material";
import AddUser from "./AddUser";
import ChipComponent from "../../common/Chips/Chips";
import { deleteUser, getSites, getUsers } from "../../../store/thunk/site";
import Pagination from "../../common/Pagination/Pagination";
import { ROLE } from "../../../Constant/Role";
import TagSites from "./TagSites";
import { calculateLastPageIndex } from "../../../utils/calculateSearchedPageNumber";

const Users = ({
  users,
  getUsers,
  deleteUser,
  getSites,
  sites,
  loggedInUserData,
}) => {
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPasswordResetModal, setshowPasswordResetModal] = useState(false);
  const [filteredUser, setFilteredUser] = useState([]);
  const [selectedUser, setSelectedUser] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSiteTagModal, setShowSiteTagModal] = useState(false);
  const [usersPerPage] = useState(7);
  const [currentPage, setCurrentPage] = useState(1);

  const indexOfLastUsers = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUsers - usersPerPage;
  const currentUsers = filteredUser?.slice(indexOfFirstUser, indexOfLastUsers);
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  useEffect(() => {
    getUsers();
    getSites(loggedInUserData);
  }, []);
  useEffect(() => {
    if (users?.length > 0) {
      setFilteredUser(users);
      searchUser();
    }
  }, [users]);
  const [formData, setFormData] = useState({
    searchField: "",
    role: "",
    site: "",
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
    searchUser();
  }, [formData.role, formData.searchField, formData.site, formData.status]);
  const searchUser = () => {
    const searchField = formData?.searchField || '';
    const role = formData?.role || '';
    const site = formData?.site || '';
    const status = formData?.status || '';

    if (searchField || role || site || status) {
        const list = users?.filter((user) => {
            const lowerCaseSearchField = String(searchField).toLowerCase();
            
            const matchesNameOrEmail = !searchField || 
                String(user?.name).toLowerCase().includes(lowerCaseSearchField) ||
                String(user?.email).toLowerCase().includes(lowerCaseSearchField);

            const matchesRole = !role || String(user?.role)
                .toLowerCase()
                .includes(String(role).toLowerCase());

            const matchesSite = !site || user?.taggedSites?.some(taggedSite =>
                String(taggedSite?.id) === String(site)
            );

            const matchesStatus = !status || String(user?.status)
                .toLowerCase()
                .includes(String(status).toLowerCase());

            // Returns true if all provided conditions match
            return matchesNameOrEmail && matchesRole && matchesSite && matchesStatus;
        });

        setCurrentPage(1); //calculateLastPageIndex(list?.length, usersPerPage)
        setFilteredUser(list);
    } else {
        setFilteredUser(users);
    }
};

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
          toast.success(`${user?.name} user has been deleted successully`);
          getUsers();
        } else if (res?.includes("pre_actions")) {
          toast.error(
            `User can not be deleted due to an existing pre actions.`
          );
        } else if (res?.includes("site_project_contractors")) {
          toast.error(
            `User can not be deleted due to an existing site projects.`
          );
        } else if (res?.includes("site_projects_contracts")) {
          toast.error(
            `User can not be deleted due to an existing site projects contracts.`
          );
        } else if (res?.includes("fk_valuation_user")) {
          toast.error(
            `User can not be deleted due to an existing tagged assets`
          );
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
          {showPasswordResetModal && (
            <ResetPassword
              selectedUser={selectedUser}
              showModal={showPasswordResetModal}
              setShowModal={setshowPasswordResetModal}
              refresh={() => {
                getUsers();
              }}
            />
          )}
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
          {showSiteTagModal && (
            <TagSites
              taggedSites={selectedUser?.taggedSites}
              showSiteTagModal={showSiteTagModal}
              setShowSiteTagModal={setShowSiteTagModal}
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
                <div className="col-md-3 col-sm-4 mt-2">
                  <input
                    type="text"
autoComplete="off"
          readOnly
          onFocus={(e) => e.target.removeAttribute("readonly")}
                    className="form-control"
                    placeholder="Search"
                    name="searchField"
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-3 col-sm-4 mt-2">
                  <select
                    name="role"
                    className="form-control form-select"
                    id="role"
                    onChange={handleInputChange}
                  >
                    <option value="">Role</option>
                    <option value={ROLE.ADMIN}>Admin</option>
                    <option value={ROLE.MANAGER}>Property Manager</option>
                    <option value={ROLE.SITE_ACTION_MANAGER}>
                      Site Action Manager
                    </option>
                    <option value={ROLE.SITE_USERS}>Site Users</option>
                    <option value={ROLE.CARE_TAKER}>Caretaker</option>
                    <option value={ROLE.CONTRACTOR}>Contractor</option>
                    <option value={ROLE.SURVEYOR}>Surveyor</option>
                    <option value={ROLE.TRADESMAN}>Tradesman</option>
                    <option value={ROLE.TESTER}>Tester</option>
                  </select>
                </div>
                <div className="col-md-3 col-sm-4 mt-2">
                  <select
                    name="site"
                    className="form-control form-select"
                    id="site"
                    onChange={handleInputChange}
                  >
                    <option value="">Site</option>
                    {sites?.map((itm) => (
                      <option value={itm?.siteId} key={itm?.siteId}>
                        {itm?.siteName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3 col-sm-4 mt-2">
                  <select
                    name="status"
                    className="form-control form-select"
                    id="status"
                    onChange={handleInputChange}
                  >
                    <option value="">Status</option>
                    <option value="active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="ms-auto p-2 bd-highlight">
              <div className="row" style={{ height: "auto" }}>
                <div className="col-md-6 col-sm-4 mt-2">
                  <button
                    className="btn btn-primary text-white pr-2"
                    onClick={() => {
                      const license = JSON.parse(localStorage.getItem('license'));
    if(users.length >= Number(license.allowedUser)) {
      toast.error("You have reached your limit for adding users under your license.")
     
    } else {
      setShowAddModal(true);
    }
                      
                    }}
                  >
                    Add New
                  </button>
                  &nbsp;
                </div>
                <div className="col-md-6 col-sm-4 mt-2">
                  <CSVLink
                    filename={"user-lists.csv"}
                    className="btn btn-light bg-white text-primary"
                    data={
                      users?.map((itm) => {
                        return {
                          ...itm,
                          taggedSites: itm?.taggedSites
                            ?.map((tag) => tag?.name)
                            .join(", "),
                        };
                      }) || []
                    }
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
                  <th scope="col">Last Login</th>
                  <th scope="col">Status</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers?.length === 0 && (
                  <tr>
                    <td>No search result found!!</td>
                  </tr>
                )}
                {currentUsers?.map((user) => (
                  <tr key={user?.id}>
                    <th scope="col">{user?.name}</th>
                    <th scope="col">{user?.email}</th>
                    <th scope="col">
                      {user?.taggedSites?.length > 3 && (
                        <>
                          <button
                            type="button"
                            className="btn btn-sm btn-light text-primary"
                            onClick={() => {
                              setShowSiteTagModal(true);
                              setSelectedUser(user);
                            }}
                          >
                            {user?.taggedSites?.length} Sites
                          </button>
                        </>
                      )}
                      {user?.taggedSites?.length < 4 &&
                        user?.taggedSites?.map((itm) => (
                          <span className="badge bg-primary">{itm?.name}</span>
                        ))}
                    </th>
                    <th scope="col">{user?.role === "Manager" ? "Property Manager": user?.role}</th>
                    <th scope="col">
                      {moment(user?.creationDate).format("DD-MM-YYYY")}
                    </th>
                    <th scope="col">{user?.userType}</th>
                    <th scope="col">{user?.companyName}</th>
                    <th scope="col">
                      {user?.lastLogin ? moment(user?.lastLogin).format("DD-MM-YYYY hh:mm:ss") : '-'}
                    </th>
                    <th scope="col"> 
                    {/* <Chip
               label={ user?.status}
            color={
            user?.status === "Active" 
              ? "success"
              : "danger"
          }
        /> */}
        
         <ChipComponent status={user?.status} />
                  </th>  
                    <th scope="col" width="200px">
                    <Tooltip title={`Reset password`} arrow>
                        <button
                          className="btn btn-sm btn-light"
                          onClick={() => {
                            setSelectedUser(user);
                            setshowPasswordResetModal(true);
                          }}
                        >
                          <i className="fas fa-unlock"></i>
                        </button>{" "}
                      </Tooltip>
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
          <div className="row">
            <Pagination
              totalPages={Math.ceil(filteredUser.length / usersPerPage)}
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
  loggedInUserData: state.site.loggedInUserData,
});
export default connect(mapStateToProps, { getUsers, deleteUser, getSites })(
  Users
);
