// reducers.js
import { LOGIN_SUCCESS, LOGOUT_SUCCESS, LOGIN_FAILURE } from "./actionTypes";

// Retrieve authentication data from browser storage
const storedUserData = localStorage.getItem("userData");
const initialState = {
  products: [],
  isLoggedIn: !!storedUserData,
  user: storedUserData ? JSON.parse(storedUserData) : null,
  error: "",
};

const rootReducer = (state = initialState, action) => {
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
      };
    case LOGIN_FAILURE:
      return {
        ...state,
        error: action.payload,
      };
    default:
      return state;
  }
};

export default rootReducer;
