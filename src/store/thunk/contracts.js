import { get } from "../../api";
import {
  GET_CONTRACT_DETAIL,
  GET_CONTRACT_DETAIL_FAILURE,
  GET_CONTRACT_LIST,
  GET_CONTRACT_LIST_FAILURE,
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
      const url = `/api/project/contractDetails/${id}`;
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
