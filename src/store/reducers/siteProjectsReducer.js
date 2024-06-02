import {
  ADD_UPDATE_SITE_PROJECT,
  ADD_UPDATE_SITE_PROJECT_FAILURE,
  GET_ALL_PROJECTS,
} from "../actions/siteProjectActions";

const initialState = {
  isLoading: false,
  projectList: [],
  success: "",
  error: "",
};
const siteProjectReducer = (state = initialState, action) => {
  switch (action.type) {
    case GET_ALL_PROJECTS:
      return {
        ...state,
        projectList: action.payload,
      };
    case ADD_UPDATE_SITE_PROJECT:
      return {
        ...state,
        error: "",
        success: action.payload,
      };
    case ADD_UPDATE_SITE_PROJECT_FAILURE:
      return {
        ...state,
        success: "",
        error: action.payload,
      };
    default:
      return state;
  }
};

export default siteProjectReducer;
