import { connect } from "react-redux";
import BreadCrumHeader from "../../../common/BreadCrumHeader/BreadCrumHeader";
import Header from "../../../common/Header/Header";
import SidebarNew from "../../../common/Sidebar/SidebarNew";
import Contractors from "./Contractors";
import MandatoryFolders from "./MandatoryFolders";
import {
  getProjectList,
  addUpdateProject,
  deleteProject,
} from "../../../../store/thunk/projects";
import {
  getContractorList,
  getManagerList,
} from "../../../../store/thunk/user";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Success from "../../../common/Alert/Success";
import Error from "../../../common/Alert/Error";
import Swal from "sweetalert2";

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
  addUpdateProject,
  deleteProject,
}) => {
  const [selectedMandatoryFolder, setSelectedMandatoryFolder] = useState([]);
  const [selectedContractors, setSelectedContractors] = useState([]);
  const [selectedProject, setSelectedProject] = useState({});
  const [filterProjects, setFilterProjects] = useState([]);
  const { register, handleSubmit, reset, getValues, setValue, watch } = useForm(
    {}
  );
  const submitProject = (data) => {
    const payload = {
      projectId: data?.projectId || null,
      projectName: data?.projectName,
      siteId: siteSelectedForGlobal?.siteId,
      status: "New",
      budget: data?.budget,
      startDate: `${data?.startDate} 10:00:00`,
      endDate: "",
      projectManagerUserId: parseInt(data?.manager),
      description: data?.shortDescription,
    };
    const contractors = [
      {
        quoteId: selectedContractors?.[0],
        siteId: siteSelectedForGlobal?.siteId,
        contractorUserId: selectedContractors?.[0],
        status: "Pending",
        projectManagerUserId: parseInt(data?.manager),
      },
    ];
    const mandatoryFolders = selectedMandatoryFolder?.map((itm) => itm.id);
    const folders = {
      mandatoryFolders: mandatoryFolders,
      removeMandatoryFolders: null,
      quoteIds: null,
      removeQuoteId: null,
    };
    addUpdateProject(payload, contractors, folders);
  };
  useEffect(() => {
    getContractorList();
    getManagerList();
    getProjectList(siteSelectedForGlobal?.siteId);
  }, []);
  const searchSite = (e) => {
    const val = e.target.value;
    
    if(val){
      const list = projectList?.filter((x) =>
        String(x?.name).toLowerCase().includes(String(val).toLowerCase())
      );
      setFilterProjects(list);
    }
    else {
      setFilterProjects(projectList);
    }
  }
  useEffect(() => {
    if(projectList) {
      setFilterProjects(projectList);
    }
  }, [projectList])
  const updateSelectedProject = (project) => {
    setSelectedProject(project);
    setValue("projectId", project?.id);
    setValue("projectName", project?.name);
    setValue("budget", project?.budget);
    setValue("startDate", project?.startDate?.split("T")?.[0]);
    setValue("shortDescription", project?.description);
    setValue("manager", project?.projectManagerUserId);
  };
  const deleteProjectData = async () => {
    const res = await deleteProject(selectedProject?.id);
    if (res === "Success") {
      Swal.fire({
        icon: "success",
        title: "Success...",
        text: "Project has been successfully deleted",
      });
      getProjectList(siteSelectedForGlobal?.siteId);
      resetFields();
      setSelectedProject({});
    } else {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Something went wrong while deleting project. Please try again!",
      });
    }
  };
  const resetFields = () => {
    reset({
      projectId: "",
      projectName: "",
      budget: "",
      startDate: "",
      shortDescription: "",
      manager: "",
    });
  };
  return (
    <>
      <Header />
      <SidebarNew />
      <div
        className="container-fluid"
        style={{ paddingLeft: "5rem", paddingRight: "2rem" }}
      >
        <BreadCrumHeader header={"Site Projects"} page={"Projects"} />
        <div className="row">
          <div className="col-md-2 border-end">
            <div className="mb-2">
              <input
                type="text"
                className="form-control"
                placeholder="Search..."
                onChange={searchSite}
              />
            </div>
            <div className="mb-2">
              <button
                style={{
                  fontSize: "10px",
                  padding: "2px",
                }}
                className="btn btn-sm btn-primary text-white w-100"
                onClick={(e) => {
                  e.preventDefault();
                  resetFields();
                  setSelectedProject({});
                }}
              >
                <i className="fas fa-cog"></i>&nbsp; Create New Project
              </button>
            </div>
            <ul className="nav flex-column">
              {filterProjects?.map((itm) => (
                <li
                  className="nav-item mb-1"
                  key={itm?.id}
                  style={{ cursor: "pointer" }}
                  onClick={(e) => {
                    e.preventDefault();
                    updateSelectedProject(itm);
                  }}
                >
                  <div
                    className="bg-light text-primary rounded-1 p-1"
                    role="alert"
                  >
                    {itm?.name}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="col-md-10">
            <form onSubmit={handleSubmit(submitProject)}>
              <h5 className="border-bottom p-2">Project Details</h5>
              <span className="badge bg-light text-primary">New</span>

              <div className="row" style={{ height: "auto" }}>
                <div className="col-md-4">
                  <label for="projectName" className="form-label">
                    Project Name
                  </label>
                  <input
                    type="text"
                    name="projectName"
                    className="form-control"
                    id="projectName"
                    {...register("projectName")}
                  />
                </div>
                <div className="col-md-4">
                  <label for="budget" className="form-label">
                    Budget (GBP)
                  </label>
                  <input
                    type="text"
                    name="budget"
                    className="form-control"
                    id="budget"
                    {...register("budget")}
                  />
                </div>
                <div className="col-md-4">
                  <label for="startDate" className="form-label">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    className="form-control"
                    id="startDate"
                    {...register("startDate")}
                  />
                </div>
                <div className="col-md-4">
                  <label for="manager" className="form-label">
                    Manager
                  </label>
                  <select
                    className="form-control form-select"
                    name="manager"
                    id="manager"
                    {...register("manager")}
                  >
                    <option value={""}>Select Manager</option>
                    {ManagerList?.map((itm) => (
                      <option value={itm?.id}>{itm?.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-8">
                  <label for="shortDescription" className="form-label">
                    Short Description
                  </label>
                  <input
                    type="text"
                    name="shortDescription"
                    className="form-control"
                    id="shortDescription"
                    {...register("shortDescription")}
                  />
                </div>
              </div>
              <MandatoryFolders
                setSelectedMandatoryFolder={setSelectedMandatoryFolder}
                selectedMandatoryFolder={selectedMandatoryFolder}
              />
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
                <Contractors
                  contractsList={contractsList}
                  setSelectedContractors={setSelectedContractors}
                />
                <div className="col-md-12">
                  <div>
                    {success && <Success msg={success} />}
                    {error && <Error msg={error} />}
                  </div>
                  <div className="float-end">
                    <button type="button" className="btn btn-light mb-3 mr-4">
                      Cancel
                    </button>
                    &nbsp; &nbsp;
                    {selectedProject?.id && (
                      <>
                        <button
                          type="button"
                          className="btn btn-light mb-3 mr-4"
                          onClick={(e) => {
                            e.preventDefault();
                            deleteProjectData();
                          }}
                        >
                          Delete
                        </button>
                        &nbsp; &nbsp;
                      </>
                    )}
                    <button type="submit" className="btn btn-primary mb-3 mr-4">
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </form>
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
  contractsList: state.userReducer.contractsList,
  ManagerList: state.userReducer.ManagerList,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
});
export default connect(mapStateToProps, {
  getProjectList,
  getContractorList,
  getManagerList,
  addUpdateProject,
  deleteProject,
})(Projects);
