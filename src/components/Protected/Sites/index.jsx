import React, { useState, Fragment, useEffect } from "react";
import { connect } from "react-redux";
import { CSVLink } from "react-csv";
import Header from "../../common/Header/Header";
import {
  getSites,
  deleteSite,
  setFilterSite,
  updateSite as updateSiteData,
  selectGlobalSite,
} from "../../../store/thunk/site";
import BreadCrumHeader from "../../common/BreadCrumHeader/BreadCrumHeader";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "./Sites.css";
import SidebarNew from "../../common/Sidebar/SidebarNew";
import ListStatusBadge from "../../common/Alert/Status/ListStatusBadge";
import Tooltip from "@mui/material/Tooltip";
import { toast } from 'react-toastify';
import Pagination from "../../common/Pagination/Pagination";
import { ROLE } from "../../../Constant/Role";

const Sites = ({
  filterSite,
  getSites,
  sites,
  deleteSite,
  setFilterSite,
  updateSiteData,
  selectGlobalSite,
  loggedInUserData,
}) => {
  const [selectedItem, setSelectedItem] = useState("status");
  const [sitesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const indexOfLastSite = currentPage * sitesPerPage;
  const indexOfFirstSite = indexOfLastSite - sitesPerPage;
  const currentSites = filterSite.slice(
    indexOfFirstSite,
    indexOfLastSite
  );
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  useEffect(() => {
    getSites();
  }, []);
  const deleteSiteById = (itm) => {
    Swal.fire({
      title: `Do you want to delete ${itm?.siteName}`,
      showDenyButton: false,
      showCancelButton: true,
      confirmButtonText: "Delete",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const res = await deleteSite(itm?.siteId);
        if (res === "Success") {
          toast.success(`${itm?.siteName} site has been deleted successully`)
          getSites();
        } else {
          toast.error("Something went wrong while deleting site. Please try again!")
        }
      } else if (result.isDenied) {
        // Swal.fire("Changes are not saved", "", "info");
      }
    });
  };
  const navigate = useNavigate();
  const goTo = (link) => {
    navigate(link);
  };
  const searchSite = (event) => {
    const value = event?.target?.value;
    if (value) {
      const list = sites?.filter(
        (x) =>
          String(x?.siteName)
            .toLowerCase()
            .includes(String(value).toLowerCase()) ||
          String(x?.address1)
            .toLowerCase()
            .includes(String(value).toLowerCase())
      );
      setFilterSite(list);
    } else {
      setFilterSite(sites);
    }
  };
  const searchSitesWithStatus = (e) => {
    const val = e.target.value;
    setSelectedItem(val);
    if (val === "status") {
      setFilterSite(sites);
    }
    if (val === "open" || val === "closed" || val === "sold") {
      const list = sites?.filter((x) =>
        String(x?.status).toLowerCase().includes(String(val).toLowerCase())
      );
      setFilterSite(list);
    } else {
      setFilterSite(sites);
    }
  };
  const searchSitesWithArea = (e) => {
    const val = e.target.value;
    setSelectedItem(val);
    if (val === "area") {
      setFilterSite(sites);
    } else {
      const list = sites?.filter((x) =>
        String(x?.area).toLowerCase().includes(String(val).toLowerCase())
      );
      setFilterSite(list);
    }
  };
  const searchSitesWithCity = (e) => {
    const val = e.target.value;
    setSelectedItem(val);
    if (val === "city") {
      setFilterSite(sites);
    } else {
      const list = sites?.filter((x) =>
        String(x?.city).toLowerCase().includes(String(val).toLowerCase())
      );
      setFilterSite(list);
    }
  };
  return (
    <Fragment>
      <SidebarNew />
      <div className="content">
        <Header />
        <div className="container-fluid">
          <BreadCrumHeader header={"Portfolio Management"} page={"Portfolio"} />
          {/*  */}
          {/*  */}
          <div className="d-flex bd-highlight">
            <div className="pt-2 bd-highlight ">
              <div className="row" style={{ height: "auto" }}>
                <div className="col">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search site"
                    onChange={searchSite}
                  />
                </div>
                <div className="col">
                  <select
                    name="city"
                    className="form-control form-select"
                    id="city"
                    onChange={searchSitesWithCity}
                  >
                    <option value="city">City</option>
                    {filterSite?.map((site) => (
                      <option value={site.city}>{site.city}</option>
                    ))}
                  </select>
                </div>
                <div className="col">
                  <select
                    name="area"
                    className="form-control form-select"
                    id="area"
                    onChange={searchSitesWithArea}
                  >
                    <option value="area">Area</option>
                    {filterSite?.map((site) => (
                      <option value={site.area}>{site.area}</option>
                    ))}
                  </select>
                </div>
                <div className="col">
                  <select
                    name="status"
                    className="form-control form-select"
                    id="status"
                    value={selectedItem}
                    onChange={searchSitesWithStatus}
                  >
                    <option value="status">Status</option>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                    <option value="sold">Sold</option>
                  </select>
                </div>
                {loggedInUserData?.role === ROLE.ADMIN && (
                  <div className="col">
                    <CSVLink
                      filename={"site-lists"}
                      className="btn btn-light bg-white text-primary"
                      data={sites}
                    >
                      <i className="fas fa-download"></i>&nbsp;Export
                    </CSVLink>
                  </div>
                )}
              </div>
            </div>
            <div className="ms-auto p-2 bd-highlight">
              {loggedInUserData?.role === ROLE.ADMIN && (
                <button
                  className="btn btn-primary text-white"
                  onClick={() => goTo("/add-site")}
                >
                  <i className="fas fa-plus"></i>&nbsp; Create New Site
                </button>
              )}
            </div>
          </div>
          {/* row start*/}
          <div className="row p-2"></div>
          <div className="col-md-12 table-responsive">
            <table className="table">
              <thead className="table-dark">
                <tr>
                  <th scope="col">Site</th>
                  <th scope="col">Address</th>
                  <th scope="col">Status</th>
                  <th scope="col">Outstanding Risk</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentSites?.length === 0 && (
                  <tr>
                    <td colSpan={5}>No Sites found</td>
                  </tr>
                )}
                {currentSites?.map((itm, i) => (
                  <tr key={i}>
                    <th scope="col">
                      <span
                        className="text-primary cursor"
                        onClick={() => {
                          selectGlobalSite(itm);
                        }}
                      >
                        {itm?.siteName}
                      </span>
                    </th>
                    <th scope="col">{itm?.address1}</th>
                    <th scope="col">
                      <ListStatusBadge status={itm?.status} />
                    </th>
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
                      <Tooltip title={`View ${itm?.siteName}`} arrow>
                        <button
                          className="btn btn-sm btn-light"
                          onClick={() => {
                            setTimeout(() => {
                              goTo("/update-site");
                            }, 1000);
                            updateSiteData({ ...itm, isViewMode: true });
                          }}
                        >
                          <i className="fas fa-eye"></i>
                        </button>{" "}
                      </Tooltip>
                      &nbsp;
                      {loggedInUserData?.role === ROLE.ADMIN && (
                        <Fragment>
                          <Tooltip title={`Edit ${itm?.siteName}`} arrow>
                            <button
                              className="btn btn-sm btn-light"
                              onClick={() => {
                                setTimeout(() => {
                                  goTo(
                                    `/update-site?siteId=${itm?.siteId}&isViewMode=edit`
                                  );
                                }, 1000);
                                updateSiteData({ ...itm, isViewMode: false });
                              }}
                            >
                              <i className="fas fa-pen"></i>
                            </button>{" "}
                          </Tooltip>
                          &nbsp;
                          <Tooltip title={`Delete ${itm?.siteName}`} arrow>
                            <button
                              className="btn btn-sm btn-light text-danger"
                              onClick={() => deleteSiteById(itm)}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
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
              totalPages={Math.ceil(filterSite.length / sitesPerPage)}
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
  success: state.site.success,
  error: state.site.error,
  sites: state.site.sites,
  filterSite: state.site.filterSite,
  loggedInUserData: state.site.loggedInUserData,
});
export default connect(mapStateToProps, {
  getSites,
  deleteSite,
  setFilterSite,
  updateSiteData,
  selectGlobalSite,
})(Sites);
