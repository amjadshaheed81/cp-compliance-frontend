import { del, get, post, put } from "../../api";
import {
  ADD_SITE_FAILURE,
  ADD_SITE_SUCCESS,
  FILTER_SITES,
  FILTER_SITES_FAILURE,
  GET_SITES_FAILURE,
  GET_SITES_SUCCESS,
  UPDATE_SITE,
  UPDATE_SITE_FAILURE,
  UPDATE_SITE_SUCCESS,
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

export const updateSiteDetail = (formData) => {
  // const {id, ...data} = formData;
  return async (dispatch) => {
    try {
      const url = "/api/siteservice/site";
      const res = await put(url, formData);
      console.log('res ===>', res);
      dispatch({
        type: UPDATE_SITE_SUCCESS,
        payload: 'Site has been updated successully',
      });
    } catch (error) {
      dispatch({
        type: UPDATE_SITE_FAILURE,
        payload: "Something wend wrong while updating site. Please try again.",
      });
    }
  };
};

export const deleteSite = (id) => {
  return async () => {
    try {
      const url = `/api/siteservice/site/${id}`;
      await del(url);
      return "Success";
    } catch (error) {
      return "Error";
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

export const setFilterSite = (siteList) => {
  return async (dispatch) => {
    try {
      dispatch({
        type: FILTER_SITES,
        payload: siteList,
      });
    } catch (error) {
      dispatch({
        type: FILTER_SITES_FAILURE,
        payload:
          "Something wend wrong while filtering sites. Please try again.",
      });
    }
  };
};

export const updateSite = (itm) => {
  return async (dispatch) => {
    try {
      dispatch({
        type: UPDATE_SITE,
        payload: itm,
      });
    } catch (error) {
      dispatch({
        type: UPDATE_SITE_FAILURE,
        payload: "Something wend wrong while updating sites. Please try again.",
      });
    }
  };
};
