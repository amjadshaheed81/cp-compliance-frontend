// reducers.js
import {
  LOGIN_SUCCESS,
  LOGOUT_SUCCESS,
  LOGIN_FAILURE,
  ADD_SITE_FAILURE,
  ADD_SITE_SUCCESS,
  GET_SITES_SUCCESS,
  GET_SITES_FAILURE,
} from "./actionTypes";

// Retrieve authentication data from browser storage
const storedUserData = localStorage.getItem("userData");
const initialState = {
  products: [],
  site: [],
  sites: [],
  isLoggedIn: !!storedUserData,
  user: storedUserData ? JSON.parse(storedUserData) : null,
  error: "",
  success: "",
};

const rootReducer = (state = initialState, action) => {
  console.log("action", action);
  console.log("state", state);
  
  switch (action.type) {
    case LOGIN_SUCCESS:
      return {
        ...state,
        isLoggedIn: true,
        user: action.payload,
        error: "",
      };
    case LOGOUT_SUCCESS:
      return {
        ...state,
        isLoggedIn: false,
        user: null,
        error: "",
        success: "",
      };
    case LOGIN_FAILURE:
      return {
        ...state,
        error: action.payload,
        success: "",
      };
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

export default rootReducer;
