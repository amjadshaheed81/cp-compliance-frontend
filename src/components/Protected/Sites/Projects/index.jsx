import { connect } from "react-redux";
import BreadCrumHeader from "../../../common/BreadCrumHeader/BreadCrumHeader";
import Header from "../../../common/Header/Header";
import SidebarNew from "../../../common/Sidebar/SidebarNew";
import Contractors from "./Contractors";
import MandatoryFolders from "./MandatoryFolders";
import { getProjectList } from "../../../../store/thunk/projects";
import {
  getContractorList,
  getManagerList,
} from "../../../../store/thunk/user";
import { useEffect } from "react";

const Projects = ({
  getProjectList,
  error,
  success,
  projectList,
  getContractorList,
  getManagerList,
  siteSelectedForGlobal,
  ManagerList,
  contractsList,
}) => {
  useEffect(() => {
    getContractorList();
    getManagerList();
    getProjectList(siteSelectedForGlobal?.siteId);
  }, []);
  return (
    <>
      <Header />
      <SidebarNew />
      <div
        class="container-fluid"
        style={{ marginLeft: "5rem", paddingRight: "9rem" }}
      >
        <BreadCrumHeader header={"Site Projects"} page={"Projects"} />
        <div className="row">
          <div className="col-md-2 border-end">
            <div className="mb-2">
              <input
                type="text"
                className="form-control"
                placeholder="Search..."
                // onChange={searchSite}
              />
            </div>
            <div className="mb-2">
              <button
                style={{
                  fontSize: "10px",
                  padding: "2px",
                }}
                className="btn btn-sm btn-primary text-white w-100"
                // onClick={() => goTo("/add-site")}
              >
                <i className="fas fa-cog"></i>&nbsp; Create New Project
              </button>
            </div>
            <ul class="nav flex-column">
              {projectList?.map((itm) => {
                <li class="nav-item" key={itm?.id}>
                  <a class="nav-link active" aria-current="page" href="#">
                    {itm?.name}
                  </a>
                </li>;
              })}
            </ul>
          </div>
          <div className="col-md-10">
            <h5 className="border-bottom p-2">Project Details</h5>
            <span class="badge bg-light text-primary">New</span>
            <div className="row" style={{ height: "auto" }}>
              <div class="col-md-4">
                <label for="projectName" class="form-label">
                  Project Name
                </label>
                <input
                  type="text"
                  name="projectName"
                  class="form-control"
                  id="projectName"
                />
              </div>
              <div class="col-md-4">
                <label for="budget" class="form-label">
                  Budget (GBP)
                </label>
                <input
                  type="text"
                  name="budget"
                  class="form-control"
                  id="budget"
                />
              </div>
              <div class="col-md-4">
                <label for="startDate" class="form-label">
                  Start Date
                </label>
                <input
                  type="text"
                  name="startDate"
                  class="form-control"
                  id="startDate"
                />
              </div>
              <div class="col-md-4">
                <label for="manager" class="form-label">
                  Manager
                </label>
                <input
                  type="text"
                  name="manager"
                  class="form-control"
                  id="manager"
                />
              </div>
              <div class="col-md-8">
                <label for="shortDescription" class="form-label">
                  Short Description
                </label>
                <input
                  type="text"
                  name="shortDescription"
                  class="form-control"
                  id="shortDescription"
                />
              </div>
            </div>
            <MandatoryFolders />
            <div className="row" style={{ height: "auto" }}>
              <p>
                <strong>Add Contractor</strong>
              </p>
              <div className="col-md-3">
                <button
                  className="btn btn-sm btn-light text-primary w-100 mb-2"
                  // onClick={() => handleOpen()}
                >
                  <i className="fas fa-plus"></i>&nbsp;Add
                </button>
              </div>
            </div>
            <div className="row mb-2" style={{ height: "auto" }}>
              <Contractors />
              <div className="col-md-12">
                <div class="float-end">
                  <button type="button" class="btn btn-light mb-3 mr-4">
                    Cancel
                  </button>
                  &nbsp; &nbsp;
                  <button type="button" class="btn btn-light mb-3 mr-4">
                    Delete
                  </button>
                  &nbsp; &nbsp;
                  <button type="submit" class="btn btn-primary mb-3 mr-4">
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
const mapStateToProps = (state) => ({
  error: state.siteProjectsReducer.error,
  success: state.siteProjectsReducer.success,
  projectList: state.siteProjectsReducer.projectList,
  contractsList: state.userReducer.projectList,
  ManagerList: state.userReducer.ManagerList,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
});
export default connect(mapStateToProps, {
  getProjectList,
  getContractorList,
  getManagerList,
})(Projects);
