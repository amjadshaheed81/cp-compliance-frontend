import { del, get, post } from "../../api";
import {
  ADD_SITE_FAILURE,
  ADD_SITE_SUCCESS,
  GET_SITES_FAILURE,
  GET_SITES_SUCCESS,
} from "../actionTypes";

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
        payload: "Something wend wrong while adding site. Please try again.",
      });
    }
  };
};

export const deleteSite = (id) => {
  return async () => {
    try {
      const url = `/api/siteservice/site/${id}`;
      await del(url);
      return 'Success';
    } catch (error) {
      return 'Error';
    }
  };
};

export const getSites = () => {
  return async (dispatch) => {
    try {
      const url = "/api/siteservice/site/all";
      const siteList = await get(url);
      dispatch({
        type: GET_SITES_SUCCESS,
        payload: siteList,
      });
    } catch (error) {
      dispatch({
        type: GET_SITES_FAILURE,
        payload: "Something wend wrong while fetching site. Please try again.",
      });
    }
  };
};
