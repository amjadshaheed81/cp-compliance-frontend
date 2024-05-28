import BreadCrumHeader from "../../../common/BreadCrumHeader/BreadCrumHeader";
import Header from "../../../common/Header/Header";
import SidebarNew from "../../../common/Sidebar/SidebarNew";
import TabPanel from "../../../common/TabPanel/TabPanel";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import Contractors from "./Contractors";

const Projects = () => {
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
              <li class="nav-item">
                <a class="nav-link active" aria-current="page" href="#">
                  Project A
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" aria-current="page" href="#">
                  Project B
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" aria-current="page" href="#">
                  Project C
                </a>
              </li>
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
            <div className="row mb-2" style={{ height: "auto" }}>
              <div className="col-md-3">
                <p>
                  <strong>Add Mandatory Folders</strong>
                </p>
                <div>
                  <button
                    className="btn btn-sm btn-light text-primary w-100"
                    // onClick={() => goTo("/add-site")}
                  >
                    <i className="fas fa-plus"></i>&nbsp; Select Folder
                  </button>
                </div>
              </div>
            </div>
            <div className="row mb-2" style={{ height: "auto" }}>
              <div className="col-md-3">
                <p>
                  <strong>Add Contractor</strong>
                </p>
                <div>
                  <button
                    className="btn btn-sm btn-light text-primary w-100 mb-2"
                    // onClick={() => goTo("/add-site")}
                  >
                    <i className="fas fa-plus"></i>&nbsp;Add
                  </button>
                </div>
              </div>
              <Contractors />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default Projects;
