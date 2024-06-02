import { GET_ALL_PROJECTS } from "../actions/siteProjectActions";
import { GET_CONTRACTOR_LIST, GET_MANAGER_LIST } from "../actions/userAction";

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
    default:
      return state;
  }
};

export default siteProjectReducer;
