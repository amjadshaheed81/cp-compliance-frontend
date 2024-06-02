import { get } from "../../api";
import { GET_ALL_PROJECTS } from "../actions/siteProjectActions";

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
