import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import { CSVLink } from "react-csv";
import moment from "moment";
import Header from "../../../common/Header/Header";
import BreadCrumHeader from "../../../common/BreadCrumHeader/BreadCrumHeader";
import SidebarNew from "../../../common/Sidebar/SidebarNew";
import Pagination from "../../../common/Pagination/Pagination";
import Tooltip from "@mui/material/Tooltip";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import AddPreActions from "./AddPreActions";
import { get } from "../../../../api";
import { deletePreAction } from "../../../../store/thunk/preActions";
import { ROLE } from "../../../../Constant/Role";

const PreActions = ({ siteSelectedForGlobal, deletePreAction, loggedInUserData }) => {
  const [filteredPreActions, setFilteredPreActions] = useState([]);
  const [preActions, setPreActions] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [preActionsPerPage] = useState(7);
  const [currentPage, setCurrentPage] = useState(1);

  const indexOfLastPreAction = currentPage * preActionsPerPage;
  const indexOfFirstPreAction = indexOfLastPreAction - preActionsPerPage;
  const currentPreActions = filteredPreActions.slice(
    indexOfFirstPreAction,
    indexOfLastPreAction
  );
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };
  const navigate = useNavigate();
  const goTo = (link) => {
    navigate(link);
  };

  useEffect(() => {
    getPreActions();
  }, [siteSelectedForGlobal]);
  const getPreActions = async () => {
    if (!siteSelectedForGlobal?.siteId) {
      Swal.fire({
        icon: "error",
        title: "Site is not selected",
        text: "Please select site from site search and try again.",
      });
      return;
    }
    const res = await get(
      `api/action/${siteSelectedForGlobal?.siteId}/summary`
    );
    console.log("res", res);
    setFilteredPreActions(res?.preActions || []);
    setPreActions(res?.preActions || []);
  };
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
      const list = preActions?.filter(
        (x) =>
          String(x?.actionId)
            .toLowerCase()
            .includes(String(searchField).toLowerCase()) &&
          String(x?.raisedByUserName)
            .toLowerCase()
            .includes(String(searchField).toLowerCase()) &&
          String(x?.status).toLowerCase().includes(String(status).toLowerCase())
      );
      setFilteredPreActions(list);
    } else {
      setFilteredPreActions(preActions);
    }
  };
  const deleteActionCall = (action) => {
    Swal.fire({
      title: `Do you want to delete pre action #${action?.actionId}?`,
      showDenyButton: false,
      showCancelButton: true,
      confirmButtonText: "Delete",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const res = await deletePreAction(action?.actionId);
        if (res === "Success") {
          toast.success(
            `#${action?.actionId} pre action has been deleted successully.`
          );
          getPreActions();
        } else {
          toast.error(
            `Something went wrong while deleting pre action #${action?.actionId}. Please try again!!`
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
          {showAddModal && (
            <AddPreActions
              showAddModal={showAddModal}
              setShowAddModal={setShowAddModal}

              refresh={() => {getPreActions()}}
            />
          )}
          <BreadCrumHeader header={"Pre-Action"} page={"Pre-Action"} />
          {/*  */}
          {/*  */}
          <div className="d-flex bd-highlight">
            <div className="pt-2 bd-highlight ">
              <div className="row" style={{ height: "auto" }}>
                <div className="col-md-4 col-sm-4 mt-2">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search"
                    name="searchField"
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-4 col-sm-4 mt-2">
                  <select
                    name="location"
                    className="form-control form-select"
                    id="location"
                    onChange={handleInputChange}
                  >
                    <option value="">Location</option>
                  </select>
                </div>
                <div className="col-md-4 col-sm-4 mt-2">
                  <select
                    name="status"
                    className="form-control form-select"
                    id="status"
                    onChange={handleInputChange}
                  >
                    <option value="">Status</option>
                    <option value="New">New</option>
                    <option value="Pending Action">Pending Action</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="ms-auto p-2 bd-highlight">
              <div className="row" style={{ height: "auto" }}>
                {loggedInUserData?.role !== ROLE.SITE_USERS && (
                  <Fragment>
                    <div className="col-md-6 col-sm-4 mt-2">
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
                    <div className="col-md-6 col-sm-4 mt-2">
                      <CSVLink
                        filename={"pre-action-list"}
                        className="btn btn-light bg-white text-primary"
                        data={filteredPreActions}
                      >
                        <Tooltip title={`Export`} arrow>
                          <i className="fas fa-download"></i>
                        </Tooltip>
                      </CSVLink>
                    </div>
                  </Fragment>
                )}
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
                {currentPreActions?.length === 0 && (
                  <tr>
                    <td>No search result found!!</td>
                  </tr>
                )}
                {currentPreActions?.map((action) => (
                  <tr key={action?.id}>
                    <th scope="col">{action?.actionId}</th>
                    <th scope="col">{action?.raisedByUserName}</th>
                    <th scope="col">{action?.description}</th>
                    <th scope="col">
                      {action?.category} &gt; {action?.floor} &gt;{" "}
                      {action?.room}
                    </th>
                    <th scope="col">
                      {moment(action?.raisedDate).format("DD-MM-YYYY")}
                    </th>
                    <th scope="col">
                      <span className="badge rounded-pill bg-primary text-capitalize">
                        {action?.status}
                      </span>
                    </th>
                    <th scope="col">
                      <Tooltip title={`View ${action?.actionId}`} arrow>
                        <button
                          className="btn btn-sm btn-light"
                          onClick={() => {
                            goTo(
                              `/pre-action-detail?id=${action?.actionId}&viewMode=viewOnly`
                            );
                          }}
                        >
                          <i className="fas fa-eye"></i>
                        </button>{" "}
                      </Tooltip>
                      {loggedInUserData?.role !== ROLE.SITE_USERS && (
                        <Fragment>
                          <Tooltip
                            title={`${action?.actionId} mark as approve`}
                            arrow
                          >
                            <button
                              className="btn btn-sm btn-light"
                              onClick={() => {
                                goTo(
                                  `/pre-action-detail?id=${action?.actionId}&viewMode=markApproved`
                                );
                              }}
                            >
                              <i className="fas fa-check"></i>
                            </button>{" "}
                          </Tooltip>
                          <Tooltip
                            title={`${action?.actionId} mark as closed`}
                            arrow
                          >
                            <button
                              className="btn btn-sm btn-light"
                              onClick={() => {
                                goTo(
                                  `/pre-action-detail?id=${action?.actionId}&viewMode=markClosed`
                                );
                              }}
                            >
                              <i className="fas fa-window-close"></i>
                            </button>{" "}
                          </Tooltip>
                          <Tooltip title={`Delete ${action?.actionId}`} arrow>
                            <button
                              className="btn btn-sm btn-light text-dark"
                              onClick={() => deleteActionCall(action)}
                            >
                              <i className="fas fa-trash"></i>
                            </button>{" "}
                          </Tooltip>
                        </Fragment>
                      )}
                    </th>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* row end*/}
          <div className="row">
            <Pagination
              totalPages={Math.ceil(
                filteredPreActions.length / preActionsPerPage
              )}
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
  loggedInUserData: state.site.loggedInUserData,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
});
export default connect(mapStateToProps, { deletePreAction })(PreActions);
