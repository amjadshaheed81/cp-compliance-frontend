import { get } from "../../api";
import { GET_CONTRACTOR_LIST, GET_MANAGER_LIST } from "../actions/userAction";

export const getContractorList = () => {
  return async (dispatch) => {
    try {
      const url = `/api/user/all?userType=Contractor`;
      const data = await get(url);
      dispatch({
        type: GET_CONTRACTOR_LIST,
        payload: data,
      });
    } catch (error) {
      console.error(error);
    }
  };
};

export const getManagerList = () => {
  return async (dispatch) => {
    try {
      const url = `/api/user/all?userType=Manager`;
      const data = await get(url);
      dispatch({
        type: GET_MANAGER_LIST,
        payload: data,
      });
    } catch (error) {
      console.error(error);
    }
  };
};
