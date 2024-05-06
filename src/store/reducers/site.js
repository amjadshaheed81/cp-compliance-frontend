// reducers.js
import {
  ADD_SITE_FAILURE,
  ADD_SITE_SUCCESS,
  GET_SITES_SUCCESS,
  GET_SITES_FAILURE,
  FILTER_SITES,
  UPDATE_SITE_SUCCESS,
  UPDATE_SITE_FAILURE,
  UPDATE_SITE,
  UPDATE_SITE_LOCAL_DETAILS,
  UPDATE_SITE_LOCAL_DETAILS_FAILURE,
} from "./../actionTypes";

const initialState = {
  site: [],
  sites: [],
  filterSite: [],
  updateSite: {},
  error: "",
  success: "",
  localDetailsSuccess: "",
  localDetailsError: "",
};

const reducer = (state = initialState, action) => {
  console.log("action", action);
  console.log("state", state);

  switch (action.type) {
    case ADD_SITE_FAILURE:
      return {
        ...state,
        error: action.payload,
        success: "",
        localDetailsSuccess: "",
        localDetailsError: "",
      };
    case ADD_SITE_SUCCESS:
      return {
        ...state,
        success: "Successfully added site",
        error: "",
        localDetailsSuccess: "",
        localDetailsError: "",
      };
    case GET_SITES_SUCCESS:
      return {
        ...state,
        sites: action.payload,
        filterSite: action.payload,
        success: "",
        error: "",
        localDetailsSuccess: "",
        localDetailsError: "",
      };
    case GET_SITES_FAILURE:
      return {
        ...state,
        success: "",
        error: action.payload,
        localDetailsSuccess: "",
        localDetailsError: "",
      };
    case FILTER_SITES:
      return {
        ...state,
        filterSite: action.payload,
        success: "",
        error: "",
        localDetailsSuccess: "",
        localDetailsError: "",
      };
    case UPDATE_SITE:
      return {
        ...state,
        updateSite: action.payload,
        success: "",
        error: "",
        localDetailsSuccess: "",
        localDetailsError: "",
      };
    case UPDATE_SITE_SUCCESS:
      return {
        ...state,
        success: action.payload,
        error: "",
        localDetailsSuccess: "",
        localDetailsError: "",
      };
    case UPDATE_SITE_FAILURE:
        return {
          ...state,
          success: "",
          error: action.payload,
          localDetailsSuccess: "",
          localDetailsError: "",
        };
    case UPDATE_SITE_LOCAL_DETAILS:
        return {
          ...state,
          success: "",
          error: "",
          localDetailsSuccess: action.payload,
          localDetailsError: "",
        };
    case UPDATE_SITE_LOCAL_DETAILS_FAILURE:
        return {
          ...state,
          success: "",
          error: "",
          localDetailsSuccess: "",
          localDetailsError: action.payload,
        };
    default:
      return state;
  }
};

export default reducer;
