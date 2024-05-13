import React, { useState, Fragment, useEffect } from "react";
import { connect } from "react-redux";
import { CSVLink } from "react-csv";
import Sidebar from "../../common/Sidebar/Sidebar";
import Header from "../../common/Header/Header";
import { getSites, deleteSite, setFilterSite, updateSite } from "../../../store/thunk/site";
import BreadCrumHeader from "../../common/BreadCrumHeader/BreadCrumHeader";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "./Sites.css";

const Sites = ({ filterSite, getSites, sites, deleteSite, setFilterSite, updateSite }) => {
  const [selectedItem, setSelectedItem] = useState("status");

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
        const res = await deleteSite(itm?.id);
        if (res === "Success") {
          Swal.fire({
            icon: "success",
            title: "Success...",
            text: "Site has been successfully deleted",
          });
          getSites();
        } else {
          Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "Something went wrong while deleting site. Please try again!",
          });
        }
      } else if (result.isDenied) {
        Swal.fire("Changes are not saved", "", "info");
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
      const list = sites?.filter((x) =>
        (String(x?.siteName).toLowerCase().includes(String(value).toLowerCase()) || 
        String(x?.address1).toLowerCase().includes(String(value).toLowerCase()))
      );
      setFilterSite(list);
    } else {
      setFilterSite(sites);
    }
  };
  const searchSitesWithStatus = (e) => {
    const val = e.target.value;
    setSelectedItem(val)
    if(val === 'status'){
      setFilterSite(sites);
    }
    if (val === 'open' || val === 'closed' || val === 'sold') {
      const list = sites?.filter((x) =>
        String(x?.status).toLowerCase().includes(String(val).toLowerCase())
      );
      setFilterSite(list);
    } else {
      setFilterSite(sites);
    }
  };
  return (
    <Fragment>
      <Sidebar />
      <div class="content">
        <Header />
        <div class="container-fluid">
          <BreadCrumHeader header={"Portfolio Management"} page={"Portfolio"} />
          {/*  */}
          {/*  */}
          <div class="d-flex bd-highlight">
            <div class="pt-2 bd-highlight ">
              <div class="row">
                <div class="col">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search site"
                    onChange={searchSite}
                  />
                </div>
                <div class="col">
                  <select
                    name="status"
                    className="form-control"
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
                <div className="col">
                  <CSVLink
                    filename={'site-lists'}
                    className="btn btn-sm btn-light bg-white text-primary"
                    data={sites}
                  >
                    <i class="fas fa-download"></i>&nbsp;Export
                  </CSVLink>
                </div>
              </div>
            </div>
            <div class="ms-auto p-2 bd-highlight">
              <button
                className="btn btn-sm btn-primary text-white"
                onClick={() => goTo("/add-site")}
              >
                <i className="fas fa-plus"></i>&nbsp; Create New Site
              </button>
            </div>
          </div>
          {/* row start*/}
          <div className="row p-2"></div>
          <div className="col-md-12">
            <table class="table">
              <thead class="table-dark">
                <tr>
                  <th scope="col">Site</th>
                  <th scope="col">Address</th>
                  <th scope="col">Status</th>
                  <th scope="col">Outstanding Risk</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filterSite?.length === 0 && (
                  <tr>
                    <td colSpan={5}>No Sites found</td>
                  </tr>
                )}
                {filterSite?.map((itm, i) => (
                  <tr key={i}>
                    <th scope="col">{itm?.siteName}</th>
                    <th scope="col">{itm?.address1}</th>
                    <th scope="col">
                      <span class="badge rounded-pill bg-success">Open</span>
                    </th>
                    <th scope="col">
                      <span class="badge bg-danger p-2 m-1 risk-span">1</span>
                      <span class="badge bg-warning p-2 m-1 risk-span">1</span>
                      <span class="badge bg-info p-2 m-1 risk-span">1</span>
                      <span class="badge bg-success p-2 m-1 risk-span">1</span>
                    </th>
                    <th scope="col">
                      <button className="btn btn-sm btn-light" onClick={() => {
                        setTimeout(() => {
                          goTo('/update-site');
                        }, 1000);
                        updateSite(itm);
                      }}>
                        <i class="fas fa-pen"></i>
                      </button>{" "}
                      &nbsp;
                      <button
                        className="btn btn-sm btn-light text-danger"
                        onClick={() => deleteSiteById(itm)}
                      >
                        <i class="fas fa-trash"></i>
                      </button>
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
  success: state.site.success,
  error: state.site.error,
  sites: state.site.sites,
  filterSite: state.site.filterSite,
});
export default connect(mapStateToProps, { getSites, deleteSite, setFilterSite, updateSite })(Sites);
