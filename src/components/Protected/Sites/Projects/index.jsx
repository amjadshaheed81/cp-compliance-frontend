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
import { get } from "../../../../api";
import { toast } from "react-toastify";

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
  // contractor data
  const [data, setData] = useState([
    {
      contractors: [],
      company: " ",
      budget: " ",
      status: "New",
    },
  ]);
  const { register, handleSubmit, reset, getValues, setValue, watch } = useForm(
    {}
  );
  const submitProject = (formData) => {
    if (isDateOlderThanToday(formData.startDate)) {
      toast.error("Start date cannot be in past !");
      return;
    }
    if (selectedProject?.id) {
      updateProjectdata(formData);
    } else {
      submitProjectdata(formData);
    }
  };
  function isDateOlderThanToday(dateString) {
    const inputDate = new Date(dateString);
    const today = new Date();
    return inputDate.getTime() < today.getTime();
  }
  const updateProjectdata = (formData) => {
    const payload = {
      projectId: selectedProject?.id,
      projectName: formData?.projectName,
      siteId: selectedProject?.siteId,
      status: "Active",
      budget: formData?.budget,
      startDate: `${formData?.startDate} 10:00:00`,
      endDate: selectedProject?.endDate,
      projectManagerUserId: parseInt(formData?.manager),
      description: formData?.shortDescription,
    };
    const contractors = [];
    const quoteIds = [];
    for (let i of data) {
      if (i?.quoteId) {
        quoteIds.push(i?.quoteId);
      }
      contractors.push({
        quoteId: i?.quoteId || null,
        siteId: i?.siteId || siteSelectedForGlobal?.siteId,
        contractorUserId: parseInt(i?.contractorUserId),
        status: "Received",
        projectManagerUserId: parseInt(formData?.manager),
      });
    }
    let mandatoryFolders = selectedMandatoryFolder?.map((itm) => {
      if (!itm?.isSaved) {
        return  itm.id
      }
    });
    mandatoryFolders = mandatoryFolders?.filter(x => x);
    const folders = {
      mandatoryFolders: mandatoryFolders,
      removeMandatoryFolders: null,
      quoteIds: quoteIds?.length === 0 ? null : quoteIds,
      removeQuoteId: null,
    };
    addUpdateProject(payload, contractors, folders);
  };
  const submitProjectdata = (formData) => {
    const payload = {
      projectId: formData?.projectId || null,
      projectName: formData?.projectName,
      siteId: siteSelectedForGlobal?.siteId,
      status: "Active",
      budget: formData?.budget,
      startDate: `${formData?.startDate} 10:00:00`,
      endDate: "",
      projectManagerUserId: parseInt(formData?.manager),
      description: formData?.shortDescription,
    };
    const contractors = [];
    for (let i of data) {
      contractors.push({
        quoteId: null,
        siteId: siteSelectedForGlobal?.siteId,
        contractorUserId: parseInt(i?.contractorUserId),
        status: "Received",
        projectManagerUserId: parseInt(formData?.manager),
      });
    }
    const mandatoryFolders = selectedMandatoryFolder?.map((itm) => itm.id);
    const folders = {
      mandatoryFolders: mandatoryFolders,
      removeMandatoryFolders: null,
      quoteIds: null,
      removeQuoteId: null,
    };
    addUpdateProject(payload, contractors, folders);
    resetFields();
  };
  useEffect(() => {
    getContractorList();
    getManagerList();
    if (siteSelectedForGlobal?.siteId) {
      getProjectList(siteSelectedForGlobal?.siteId);
    } else{
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Please select site from site search and try again.",
      });
    }
  }, []);
  const searchSite = (e) => {
    const val = e.target.value;

    if (val) {
      const list = projectList?.filter((x) =>
        String(x?.name).toLowerCase().includes(String(val).toLowerCase())
      );
      setFilterProjects(list);
    } else {
      setFilterProjects(projectList);
    }
  };
  useEffect(() => {
    if (projectList) {
      setFilterProjects(projectList);
    }
  }, [projectList]);
  /**
   *
   * @function updateSelectedProject
   * function to fetch selected project detail
   */
  const updateSelectedProject = async (project) => {
    const res = await get(`api/project/${project?.id}/details`);
    setSelectedProject(res);
    setSelectedMandatoryFolder(
      res?.projectFolders?.map((itm) => {
        return { ...itm, isSaved: true };
      })
    );
    setData(res?.contractors);
    setValue("projectId", res?.id);
    setValue("projectName", res?.name);
    setValue("budget", res?.budget);
    setValue("startDate", res?.startDate?.split("T")?.[0]);
    setValue("shortDescription", res?.description);
    setValue("manager", res?.projectManagerUserId);
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
    setSelectedMandatoryFolder([]);
    setSelectedContractors([]);
    setData([])
  };
  return (
    <>
      <Header />
      <SidebarNew />
      <div
        className="container-fluid pad-side"
      >
        <BreadCrumHeader header={"Site Projects"} page={"Projects"} />
        <div className="row">
          <div className="col-md-2 border-end">
            <div className="mb-2">
              <input
                type="text"
autoComplete="off"
          readOnly
          onFocus={(e) => e.target.removeAttribute("readonly")}
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
autoComplete="off"
          readOnly
          onFocus={(e) => e.target.removeAttribute("readonly")}
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
                    type="number"
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
autoComplete="off"
          readOnly
          onFocus={(e) => e.target.removeAttribute("readonly")}
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
                    onClick={(e) => {
                      e?.preventDefault();
                      const d = [...data];
                      d.push({
                        contractors: [],
                        company: " ",
                        budget: " ",
                        status: "New",
                      });
                      setData(d);
                    }}
                  >
                    <i className="fas fa-plus"></i>&nbsp;Add
                  </button>
                </div>
              </div>
              <div className="row mb-2" style={{ height: "auto" }}>
                <Contractors
                  setData={setData}
                  data={data}
                  contractsList={contractsList}
                  setSelectedContractors={setSelectedContractors}
                />
                <div className="col-md-12">
                  {/* <div>
                    {success && <Success msg={success} />}
                     {error && <Error msg={error} />} 
                  </div> */}
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
