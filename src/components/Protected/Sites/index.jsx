import React, { Fragment, useEffect } from "react";
import { connect } from "react-redux";
import Sidebar from "../../common/Sidebar/Sidebar";
import Header from "../../common/Header/Header";
import { getSites, deleteSite } from "../../../store/thunk/site";
import BreadCrumHeader from "../../common/BreadCrumHeader/BreadCrumHeader";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "./Sites.css";

const Sites = ({ success, error, getSites, sites, deleteSite }) => {
  useEffect(() => {
    getSites();
  }, []);
  const deleteSiteById = (id) => {
    console.log("id===>", id);
    Swal.fire({
      title: "Do you want to delete site?",
      showDenyButton: false,
      showCancelButton: true,
      confirmButtonText: "Delete",
    }).then(async (result) => {
      if (result.isConfirmed) {
        Swal.fire("Saved!", "", "success");
        const res = await deleteSite(id);
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
              {/* <input type="text" placeholder="Search for site"/> &nbsp;
              <select>
                <option value={'All'}>All</option>
              </select>&nbsp; */}
              <button className="btn btn-sm btn-light bg-white text-primary">
                <i class="fas fa-download"></i>&nbsp; Export
              </button>
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
                {sites?.length === 0 && (
                  <tr>
                    <td colSpan={5}>No Sites found</td>
                  </tr>
                )}
                {sites?.map((itm, i) => (
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
                      <button className="btn btn-sm btn-light">
                        <i class="fas fa-pen"></i>
                      </button>{" "}
                      &nbsp;
                      <button
                        className="btn btn-sm btn-light text-danger"
                        onClick={() => deleteSiteById(1)}
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
  success: state.success,
  error: state.error,
  sites: state.sites,
});
export default connect(mapStateToProps, { getSites, deleteSite })(Sites);
