// reducers.js
import {
  ADD_SITE_FAILURE,
  ADD_SITE_SUCCESS,
  GET_SITES_SUCCESS,
  GET_SITES_FAILURE,
} from "./../actionTypes";

const initialState = {
  site: [],
  sites: [],
  error: "",
  success: "",
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
      };
    case ADD_SITE_SUCCESS:
      return {
        ...state,
        success: "Successfully added site",
        error: "",
      };
    case GET_SITES_SUCCESS:
      return {
        ...state,
        sites: action.payload,
        success: "",
        error: "",
      };
    case GET_SITES_FAILURE:
      return {
        ...state,
        success: "",
        error: action.payload,
      };
    default:
      return state;
  }
};

export default reducer;
