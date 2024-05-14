import { del, get, post, put, uploadPhoto } from "../../api";
import {
  ADD_SITE_FAILURE,
  ADD_SITE_SUCCESS,
  FILTER_SITES,
  FILTER_SITES_FAILURE,
  GET_SITES_FAILURE,
  GET_SITES_SUCCESS,
  UPDATE_SITE,
  UPDATE_SITE_FAILURE,
  UPDATE_SITE_LOCAL_DETAILS,
  UPDATE_SITE_LOCAL_DETAILS_FAILURE,
  UPDATE_SITE_SUCCESS,
  UPDATE_TIMINIG_FAILURE,
  UPDATE_TIMINIG_SUCCESS,
  UPDATE_SITE_IMAGE_SUCCESS,
  UPDATE_SITE_IMAGE_FAILURE,
  GET_KEY_CONTACTS,
  GET_KEY_CONTACTS_FAILURE,
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
        payload: "Something went wrong while adding site. Please try again.",
      });
    }
  };
};

export const updateSiteDetail = (formData) => {
  // const {id, ...data} = formData;
  return async (dispatch) => {
    try {
      const url = "/api/siteservice/updateSite";
      const res = await put(url, formData);
      console.log('res ===>', res);
      dispatch({
        type: UPDATE_SITE_SUCCESS,
        payload: 'Site has been updated successully',
      });
    } catch (error) {
      dispatch({
        type: UPDATE_SITE_FAILURE,
        payload: "Something went wrong while updating site. Please try again.",
      });
    }
  };
};

export const updateSiteImage = (data, siteId) => {
  console.log('form data', data);
  console.log('siteId', siteId);
  return async (dispatch) => {
    const formData = new FormData();
    const file = data.target.files[0];
    // const file_size = formData.target.files[0].size;
    formData.append("file", file);
    formData.append("fileName", `site-photo`);
    try {
      console.log('inside');
      const url = `/api/siteservice/site/${siteId}/upload`;
      const res = await uploadPhoto(url, formData);
      console.log('status ===>', res.status);
      if (res.status === 200) {
        dispatch({
          type: UPDATE_SITE_IMAGE_SUCCESS,
          payload: res,
        });
      }
    } catch (error) {
      dispatch({
        type: UPDATE_SITE_IMAGE_FAILURE,
        payload: "Something went wrong while updating site image. Please try again.",
      });
    }
  };
};

export const updateLocalDetails = (formData) => {
  // const {id, ...data} = formData;
  return async (dispatch) => {
    try {
      const url = "/api/siteservice/updateLocalDetails";
      const res = await put(url, formData);
      console.log('res ===>', res);
      dispatch({
        type: UPDATE_SITE_LOCAL_DETAILS,
        payload: "Local details has been updated successfully.",
      });
    } catch (error) {
      dispatch({
        type: UPDATE_SITE_LOCAL_DETAILS_FAILURE,
        payload: "Something went wrong while updating site. Please try again.",
      });
    }
  };
};

export const updateTimings = (formData) => {
  return async (dispatch) => {
    try {
      const url = "/api/siteservice/updateTimings";
      const res = await put(url, formData);
      console.log('res ===>', res);
      dispatch({
        type: UPDATE_TIMINIG_SUCCESS,
        payload: "Site Timings has been updated successfully.",
      });
    } catch (error) {
      dispatch({
        type: UPDATE_TIMINIG_FAILURE,
        payload: "Something went wrong while updating site timing. Please try again.",
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
        payload: "Something went wrong while fetching site. Please try again.",
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
          "Something went wrong while filtering sites. Please try again.",
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
      console.log('===>',error);
      dispatch({
        type: UPDATE_SITE_FAILURE,
        payload:
          "Something went wrong while filtering sites. Please try again.",
      });
    }
  };
};


export const deleteKeyContact = (id) => {
  return async () => {
    try {
      const url = `/api/siteservice/keyContacts/${id}`;
      await del(url);
      return "Success";
    } catch (error) {
      return "Error";
    }
  };
};
export const getKeyContact = (id) => {
  return async (dispatch) => {
    try {
      const url = `/api/siteservice/keyContacts/${id}`;
      const keyContactList = await get(url);
      dispatch({
        type: GET_KEY_CONTACTS,
        payload: keyContactList,
      });
    } catch (error) {
      dispatch({
        type: GET_KEY_CONTACTS_FAILURE,
        payload: "Something went wrong while fetching key contacts. Please try again.",
      });
    }
  };
};
export const addKeyContact = (formData, id) => {
  return async (dispatch) => {
    try {
      const url = "/api/siteservice/updateKeyContacts";
      const userData = await put(url, formData);
      if(userData?.status === 200) {
        const url = `/api/siteservice/keyContacts/${id}`;
        const keyContactList = await get(url);
        dispatch({
          type: GET_KEY_CONTACTS,
          payload: keyContactList,
        });
      }
    } catch (error) {
      dispatch({
        type: ADD_SITE_FAILURE,
        payload: "Something went wrong while adding site. Please try again.",
      });
    }
  };
};