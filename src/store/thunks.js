// thunks.js
import { LOGIN_SUCCESS, LOGOUT_SUCCESS, LOGIN_FAILURE } from "./actionTypes";
// Mock login API call
const loginApi = async (email, password) => {
  // Assuming there's an API endpoint for login
  try {
    const response = await fetch("api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error("Login failed");
    }

    return await response.json();
  } catch (error) {
    throw new Error(error.message);
  }
};

export const login = (username, password) => {
  return async (dispatch) => {
    try {
      const userData = await loginApi(username, password);
      dispatch({
        type: LOGIN_SUCCESS,
        payload: userData,
      });
      // Store authentication data in browser storage
      localStorage.setItem("userData", JSON.stringify(userData));
    } catch (error) {
      dispatch({
        type: LOGIN_FAILURE,
        payload: error.message,
      });
    }
  };
};

export const logout = () => {
  return (dispatch) => {
    // Clear authentication data from browser storage
    localStorage.removeItem("userData");
    dispatch({
      type: LOGOUT_SUCCESS,
    });
  };
};
