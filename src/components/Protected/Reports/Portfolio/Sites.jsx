import React, { useState, Fragment, useEffect } from "react";
import { connect } from "react-redux";
import { CSVLink } from "react-csv";
import {
  getSites,
  deleteSite,
  setFilterSite,
} from "../../../../store/thunk/site";
import "./Sites.css";
import ListStatusBadge from "../../../common/Alert/Status/ListStatusBadge";
import Pagination from "../../../common/Pagination/Pagination";
import { ROLE } from "../../../../Constant/Role";
import { get } from "../../../../api";
import { calculateLastPageIndex } from "../../../../utils/calculateSearchedPageNumber";

const Sites = ({
  filterSite,
  getSites,
  sites,
  setFilterSite,
  loggedInUserData,
  setSiteChart,
}) => {
  const [selectedItem, setSelectedItem] = useState("status");
  useEffect(() => {
    if (sites) {
      setSiteChart({
        totalSites: sites?.length,
        openSites: sites?.filter(
          (itm) => String(itm.status).toLowerCase() === "open"
        )?.length,
        soldSites: sites?.filter(
          (itm) => String(itm.status).toLowerCase() === "sold"
        )?.length,
        closedSites: sites?.filter(
          (itm) => String(itm.status).toLowerCase() === "closed"
        )?.length,
      });
    }
  }, [sites]);
  const [sitesPerPage] = useState(7);
  const [currentPage, setCurrentPage] = useState(1);
  const [risks, setrisks] = useState({});

  const indexOfLastSite = currentPage * sitesPerPage;
  const indexOfFirstSite = indexOfLastSite - sitesPerPage;
  const currentSites = filterSite.slice(indexOfFirstSite, indexOfLastSite);
  const cityOptions = sites.filter(
    (obj1, i, arr) => arr.findIndex((obj2) => obj2.city === obj1.city) === i
  );
  const areaOption = sites.filter(
    (obj1, i, arr) => arr.findIndex((obj2) => obj2.area === obj1.area) === i
  );
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  useEffect(() => {
    getSites(loggedInUserData);
    getRisks();
  }, []);

  const getRisks = async () => {
    const risksdata = await get("/api/site-check/risks");
    setrisks(risksdata);
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
      setCurrentPage(1); // calculateLastPageIndex(list?.length, sitesPerPage)
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
      <div>
        <div>
          <div className="d-flex bd-highlight">
            <div className="pt-2 bd-highlight ">
              <div className="row" style={{ height: "auto" }}>
                <div className="col-md-4 col-sm-4 mt-2">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search site"
                    onChange={searchSite}
                  />
                </div>
                <div className="col-md-4 col-sm-4 mt-2">
                  <select
                    name="city"
                    className="form-control form-select"
                    id="city"
                    onChange={searchSitesWithCity}
                  >
                    <option value="city">City</option>
                    {cityOptions?.map((site) => (
                      <option value={site.city}>{site.city}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4 col-sm-4 mt-2">
                  <select
                    name="area"
                    className="form-control form-select"
                    id="area"
                    onChange={searchSitesWithArea}
                  >
                    <option value="area">Area</option>
                    {areaOption?.map((site) => (
                      <option value={site.area}>{site.area}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4 col-sm-4 mt-2">
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
                  <div className="col-md-4 col-sm-4 mt-2">
                    <CSVLink
                      filename={"site-lists.csv"}
                      className="btn btn-light bg-white text-primary"
                      data={sites}
                    >
                      <i className="fas fa-download"></i>&nbsp;Export
                    </CSVLink>
                  </div>
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
                  <th scope="col">Site</th>
                  <th scope="col">Address</th>
                  <th scope="col">Status</th>
                  <th scope="col">Outstanding Risk</th>
                  <th scope="col">Area</th>
                  <th scope="col">Client Responsibility</th>
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
                      <span className="text-primary">{itm?.siteName}</span>
                      <p>
                        <small>{itm?.postCode}</small>
                      </p>
                    </th>
                    <th scope="col">{itm?.address1}</th>
                    <th scope="col">
                      <ListStatusBadge status={itm?.status} />
                    </th>
                    <th scope="col">
                      <span className="badge bg-danger p-2 m-1 risk-span">
                        {risks?.[itm?.siteId]?.riskScoreRed ?? 0}
                      </span>
                      <span className="badge bg-warning p-2 m-1 risk-span">
                        {risks?.[itm?.siteId]?.riskScoreAmber ?? 0}
                      </span>
                      <span className="badge bg-info p-2 m-1 risk-span">
                        {risks?.[itm?.siteId]?.riskScoreYellow ?? 0}
                      </span>
                      <span className="badge bg-success p-2 m-1 risk-span">
                        {risks?.[itm?.siteId]?.riskScoreGreen ?? 0}
                      </span>
                    </th>
                    <th scope="col">{itm?.area}</th>
                    <th scope="col">
                      {itm?.clientResponsiblity ? "Yes" : "No"}
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
})(Sites);
