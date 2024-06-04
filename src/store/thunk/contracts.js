import { get, postMultiPartFormData } from "../../api";
import {
  GET_CONTRACT_DETAIL,
  GET_CONTRACT_DETAIL_FAILURE,
  GET_CONTRACT_LIST,
  GET_CONTRACT_LIST_FAILURE,
  UPDATE_CONTRACT_DETAIL,
  UPDATE_CONTRACT_DETAIL_FAILURE,
} from "../actions/siteContractsActions";

export const getSiteContracts = (id) => {
  return async (dispatch) => {
    try {
      const url = `/api/project/allcontracts/${id}`;
      const List = await get(url);
      dispatch({
        type: GET_CONTRACT_LIST,
        payload: List,
      });
    } catch (error) {
      dispatch({
        type: GET_CONTRACT_LIST_FAILURE,
        payload:
          "Something went wrong while fetching site contracts. Please try again.",
      });
    }
  };
};

export const getSiteContractDetails = (id) => {
  return async (dispatch) => {
    try {
      const url = `/api/project/contractdetails/${id}`;
      const data = await get(url);
      dispatch({
        type: GET_CONTRACT_DETAIL,
        payload: data,
      });
    } catch (error) {
      dispatch({
        type: GET_CONTRACT_DETAIL_FAILURE,
        payload:
          "Something went wrong while fetching site contract detail. Please try again.",
      });
    }
  };
};

export const updateContractDetail = (formData) => {
  return async (dispatch) => {
    try {
      const url = "/api/project/updateContract";
      const siteareainfo = await postMultiPartFormData(url, formData);
      if (siteareainfo?.status === 200) {
        dispatch({
          type: UPDATE_CONTRACT_DETAIL,
          payload: 'Contract detail has been successfully updated',
        });
      } else {
        dispatch({
          type: UPDATE_CONTRACT_DETAIL_FAILURE,
          payload: 'Contract detail has been successfully updated',
        });
      }
    } catch (error) {
      dispatch({
        type: UPDATE_CONTRACT_DETAIL_FAILURE,
        payload: 'Contract detail has been successfully updated',
      });
    }
  };
};