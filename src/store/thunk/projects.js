import { get, put } from "../../api";
import { ADD_UPDATE_SITE_PROJECT, ADD_UPDATE_SITE_PROJECT_FAILURE, GET_ALL_PROJECTS } from "../actions/siteProjectActions";

export const getProjectList = (siteID) => {
  return async (dispatch) => {
    try {
      const url = `/api/project/site/${siteID}/projects`;
      const data = await get(url);
      console.log("data", data);
      dispatch({
        type: GET_ALL_PROJECTS,
        payload: data?.projects,
      });
    } catch (error) {
      console.error(error);
    }
  };
};


export const addUpdateProject = (formData, projectContractor, folders) => {
    return async (dispatch) => {
      try {
        const url = "/api/project/manage";
        const addUpdateProjectData = await put(url, formData);
        if (addUpdateProjectData?.status === 200) {
            const contractorURL = `api/project/{${addUpdateProjectData?.projectId}}/contractor`;
            const contractorURLData = await put(contractorURL, projectContractor);
            const folderURL = `api/project/{${addUpdateProjectData?.projectId}}/folders`;
            const folderURLData = await put(folderURL, folders);
          dispatch({
            type: ADD_UPDATE_SITE_PROJECT,
            payload: 'Successfully added project',
          });
        }
      } catch (error) {
        dispatch({
            type: ADD_UPDATE_SITE_PROJECT_FAILURE,
            payload: "Something went wrong while adding/updating project. Please try again.",
        });
      }
    };
  };