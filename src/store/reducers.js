// reducers.js
import {
  LOGIN_SUCCESS,
  LOGOUT_SUCCESS,
  LOGIN_FAILURE,
  ADD_SITE_FAILURE,
  ADD_SITE_SUCCESS,
} from "./actionTypes";

// Retrieve authentication data from browser storage
const storedUserData = localStorage.getItem("userData");
const initialState = {
  products: [],
  site: [],
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
        site: [...state.site, action.payload],
        success: "Successfully added site",
        error: "",
      };
    default:
      return state;
  }
};

export default rootReducer;
