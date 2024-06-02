import { GET_CONTRACTOR_LIST, GET_MANAGER_LIST } from "../actions/userAction";

const initialState = {
  isLoading: false,
  contractsList: [],
  ManagerList: [],
  success: "",
  error: "",
};
const userReducer = (state = initialState, action) => {
  switch (action.type) {
    case GET_CONTRACTOR_LIST:
      return {
        ...state,
        contractsList: action.payload,
      };
    case GET_MANAGER_LIST:
      return {
        ...state,
        ManagerList: action.payload,
      };
    default:
      return state;
  }
};

export default userReducer;
