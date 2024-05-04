// reducers.js
import { LOGIN_SUCCESS, LOGOUT_SUCCESS, LOGIN_FAILURE } from "./../actionTypes";

// Retrieve authentication data from browser storage
const storedUserData = localStorage.getItem("userData");
const initialState = {
  isLoggedIn: !!storedUserData,
  user: storedUserData ? JSON.parse(storedUserData) : null,
  error: "",
  success: "",
};

const reducer = (state = initialState, action) => {
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
    default:
      return state;
  }
};

export default reducer;
