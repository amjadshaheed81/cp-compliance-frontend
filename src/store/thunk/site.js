import { post } from "../../api";
import { ADD_SITE_FAILURE, ADD_SITE_SUCCESS } from "../actionTypes";

export const addSite = (formData) => {
    return async (dispatch) => {
      try {
        const url = "/api/siteservice/site";
        const userData = await post(url, formData);
        dispatch({
          type: ADD_SITE_SUCCESS,
          payload: userData,
        });
      } catch (error) {
        dispatch({
          type: ADD_SITE_FAILURE,
          payload: error.message,
        });
      }
    };
  };