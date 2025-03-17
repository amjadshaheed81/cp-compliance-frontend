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
import { get, put } from "../../../../api";
import { deletePreAction } from "../../../../store/thunk/preActions";
import { ROLE } from "../../../../Constant/Role";
import { Chip } from "@mui/material";
import { sortCompletedLast } from "../../../../utils/sortCompletedLast";
import { calculateLastPageIndex } from "../../../../utils/calculateSearchedPageNumber";

const Actions = ({ siteSelectedForGlobal, deletePreAction, loggedInUserData }) => {
  const [filteredActions, setFilteredActions] = useState([]);
  const [preActions, setActions] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [preActionsPerPage] = useState(7);
  const [currentPage, setCurrentPage] = useState(1);

  const indexOfLastPreAction = currentPage * preActionsPerPage;
  const indexOfFirstPreAction = indexOfLastPreAction - preActionsPerPage;
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };
  const navigate = useNavigate();
  const goTo = (link) => {
    navigate(link);
  };

  useEffect(() => {
    getActions({status: "Reported"});
  }, [siteSelectedForGlobal]);
  
  const getActions = async ({ status }) => {
    if (!siteSelectedForGlobal?.siteId) {
      Swal.fire({
        icon: "error",
        title: "Site is not selected",
        text: "Please select site from site search and try again.",
      });
      return;
    }
    const res = await get(`api/site/actions/${siteSelectedForGlobal?.siteId}`);
    setActions(sortCompletedLast(res) || []);
    const filtered = res.filter(action => action.status.toLowerCase() === status.toLowerCase());
    setFilteredActions(sortCompletedLast(filtered));
  };
  
  const [formData, setFormData] = useState({
    searchField: "",
    status: "Reported",
  });

  const complete = async (action, status) => {
    action.status = status;
    await put("/api/site/actions", action);
    getActions({status: formData?.status});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  useEffect(() => {
    searchActions();
  }, [formData.searchField, formData.status]);

  const searchActions = () => {
    const searchField = formData?.searchField;
    const status = formData?.status;
    if (searchField || status) {
      const list = preActions?.filter(
        (x) =>
          (String(x?.type)
            .toLowerCase()
            .includes(String(searchField).toLowerCase()) ||
            String(x?.desc)
              .toLowerCase()
              .includes(String(searchField).toLowerCase())) &&
          String(x?.status).toLowerCase().includes(String(status).toLowerCase())
      );
      setCurrentPage(1); // calculateLastPageIndex(list?.length, preActionsPerPage)
      setFilteredActions(sortCompletedLast(list));
    } else {
      setFilteredActions(preActions);
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
            `#${action?.actionId} pre action has been deleted successfully.`
          );
          getActions({status: formData?.status});
        } else {
          toast.error(
            `Something went wrong while deleting pre action #${action?.actionId}. Please try again!!`
          );
        }
      } else if (result.isDenied) {
        toast.info(`Delete action has been denied.`);
      }
    });
  };

  const [sortConfig, setSortConfig] = useState({ key: "dueDate", direction: "asc" });

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedActions = [...filteredActions].sort((a, b) => {
    if (sortConfig.key === "dueDate") {
      const dateA = a?.dueDate ? moment(a?.dueDate, "YYYY-MM-DD") :  null;
      const dateB = b?.dueDate ? moment(b?.dueDate, "YYYY-MM-DD") : null;

      if(!dateA && dateB) return sortConfig.direction === "asc" ? -1 : 1;
      if(dateA && !dateB) return sortConfig.direction === "asc" ? 1 : -1;

      if(dateA && dateB) {
        if (dateA.isBefore(dateB)) return sortConfig.direction === "asc" ? -1 : 1;
        if (dateA.isAfter(dateB)) return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    } else if (sortConfig.key === "riskScore") {
      const riskA = a?.riskScore || 0;
      const riskB = b?.riskScore || 0;
      return sortConfig.direction === "asc" ? riskA - riskB : riskB - riskA;
    }
    return 0;
  });

  const currentActions = sortedActions?.slice(indexOfFirstPreAction, indexOfLastPreAction);

  const getTimeRemaining = (creationDate, riskScore) => {

    const data = riskScore > 16
    ? {badgeColor : "danger", days : 5}
    : riskScore > 9
      ? {badgeColor : "warning", days : 30}
      : riskScore > 4
        ? {badgeColor : "info", days : 90}
        : {badgeColor : "success", days : 365}
    const dueDate = new Date(creationDate);
    dueDate.setDate(dueDate.getDate() + data.days);
    const today = new Date();
    const timeRemaining = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    const status = timeRemaining < 0 ? `${timeRemaining * -1} Days Overdue` : `${timeRemaining} days remaining`;
  
   
  
    // Return the UI component
    return (
      <span
        style={{ width: '150px' }}
        className={`badge bg-${data.badgeColor} p-2 m-1 risk-span`}
      >
        {status}
      </span>
    );
  };

  return (
    <Fragment>
      <SidebarNew />
      <div className="content">
        <Header />
        <div className="container-fluid">
          <BreadCrumHeader header={"Actions"} page={"Actions"} />
          <div className="d-flex bd-highlight">
            <div className="pt-2 bd-highlight">
              <div className="row" style={{ height: "auto" }}>
                <div className="col-md-4 col-sm-4 mt-2">
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
                <div className="col-md-4 col-sm-4 mt-2">
                  <select
                    name="status"
                    className="form-control form-select"
                    id="status"
                    value={formData.status} // Ensure the value reflects formData.status
                    onChange={handleInputChange}
                  >
                    <option value="">Status</option>
                    <option value="Reported">Reported</option>
                    <option value="Reassessed">Reassessed</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="ms-auto p-2 bd-highlight">
              <div className="row" style={{ height: "auto" }}>
                {loggedInUserData?.role !== ROLE.SITE_USERS && (
                  <Fragment>
                    <div className="col-md-6 col-sm-4 mt-2">
                      <CSVLink
                        filename={"actions-list.csv"}
                        className="btn btn-light bg-white text-primary"
                        data={filteredActions}
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

          <div className="col-md-12 table-responsive">
            <table className="table">
              <thead className="table-dark">
                <tr>
                  <th scope="col">Action Type</th>
                  <th scope="col">Description</th>
                  <th scope="col">Observation</th>
                  <th scope="col">Required Action</th>
                  <th scope="col" onClick={() => requestSort("dueDate")} style={{ cursor: 'pointer' }}>
                    Due Date{" "}
                    {sortConfig.key === "dueDate" && (
                      <i className={`fas fa-sort-${sortConfig.direction === "asc" ? "up" : "down"}`}></i>
                    )}
                  </th>
                  <th scope="col" onClick={() => requestSort("riskScore")} style={{ cursor: 'pointer' }}>
                    Risk Score{" "}
                    {sortConfig.key === "riskScore" && (
                      <i className={`fas fa-sort-${sortConfig.direction === "asc" ? "up" : "down"}`}></i>
                    )}
                  </th>
                  <th scope="col">Status</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentActions?.length === 0 && (
                  <tr>
                    <td>No search result found!!</td>
                  </tr>
                )}
                {currentActions?.map((action) => (
                  <tr key={action?.id}>
                    <th scope="col">{action?.type}</th>
                    <th scope="col">{action?.desc}</th>
                    <th scope="col">{action?.observation}</th>
                    <th scope="col">{action?.requiredAction}</th>
                    <th scope="col" style={{ width: "120px" }}>{ getTimeRemaining(action?.createdAt ? action?.createdAt : action?.dueDate, action?.riskScore) }</th>
                    <th scope="col">
                      {" "}
                      <span
                        className={`badge bg-${
                          action?.riskScore > 16
                            ? "danger"
                            : action?.riskScore > 9
                            ? "warning"
                            : action?.riskScore > 4
                            ? "info"
                            : "success"
                        } p-2 m-1 risk-span`}
                      >
                        {action?.riskScore ?? 0}
                      </span>
                    </th>
                    <th scope="col">
                      <Chip
                        label={action?.status}
                        color={
                          action?.status === "Completed" ? "success" : "warning"
                        }
                      />
                    </th>
                    <th scope="col">
                      <Tooltip title={`View/Edit`} arrow>
                        <button
                          className="btn btn-sm btn-light"
                          onClick={() => {
                            goTo(`/action-detail?id=${action?.actionId}`);
                          }}
                        >
                          <i className="fas fa-eye"></i>
                        </button>{" "}
                      </Tooltip>
                      {(loggedInUserData?.role === ROLE.ADMIN ||
                        loggedInUserData?.role === ROLE.MANAGER ||
                        loggedInUserData?.role === ROLE.SITE_ACTION_MANAGER ||
                        loggedInUserData?.role === ROLE.CARE_TAKER ||
                        loggedInUserData?.role === ROLE.CONTRACTOR ||
                        loggedInUserData?.role === ROLE.TRADESMAN) && (
                        <Fragment>
                          <Tooltip title={`Mark as completed`} arrow>
                            <button
                              disabled={action?.status === "Completed"}
                              className={`btn btn-sm btn-light`}
                              onClick={() => {
                                complete(action, "Completed");
                              }}
                            >
                              <i className="fas fa-check"></i>
                            </button>{" "}
                          </Tooltip>
                          <Tooltip title={`Mark as Reassessed`} arrow>
                            <button
                              className="btn btn-sm btn-light"
                              onClick={() => {
                                complete(action, "Reassessed");
                              }}
                            >
                              <i className="fas fa-window-close"></i>
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

          <div className="row">
            <Pagination
              totalPages={Math.ceil(filteredActions.length / preActionsPerPage)}
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

export default connect(mapStateToProps, { deletePreAction })(Actions);
