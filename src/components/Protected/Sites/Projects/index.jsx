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
                onClick={(e) => {
                  e.preventDefault();
                  resetFields();
                  setSelectedProject({});
                }}
              >
                <i className="fas fa-cog"></i>&nbsp; Create New Project
              </button>
            </div>
            <ul class="nav flex-column">
              {projectList?.map((itm) => (
                <li
                  class="nav-item mb-1"
                  key={itm?.id}
                  style={{ cursor: "pointer" }}
                  onClick={(e) => {
                    e.preventDefault();
                    updateSelectedProject(itm);
                  }}
                >
                  <div class="bg-light text-primary rounded-1 p-1" role="alert">
                    {itm?.name}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="col-md-10">
            <form onSubmit={handleSubmit(submitProject)}>
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
                    {...register("projectName")}
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
                    {...register("budget")}
                  />
                </div>
                <div class="col-md-4">
                  <label for="startDate" class="form-label">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    class="form-control"
                    id="startDate"
                    {...register("startDate")}
                  />
                </div>
                <div class="col-md-4">
                  <label for="manager" class="form-label">
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
                <div class="col-md-8">
                  <label for="shortDescription" class="form-label">
                    Short Description
                  </label>
                  <input
                    type="text"
                    name="shortDescription"
                    class="form-control"
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
                  <div class="float-end">
                    <button type="button" class="btn btn-light mb-3 mr-4">
                      Cancel
                    </button>
                    &nbsp; &nbsp;
                    {selectedProject?.id && (
                      <>
                        <button
                          type="button"
                          class="btn btn-light mb-3 mr-4"
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
                    <button type="submit" class="btn btn-primary mb-3 mr-4">
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
