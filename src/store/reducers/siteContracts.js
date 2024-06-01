import {
  GET_CONTRACT_LIST,
  GET_CONTRACT_LIST_FAILURE,
} from "../actions/siteContractsActions";

const initialState = {
  isLoading: false,
  contractsList: [],
  filterContract: [],
  success: "",
  error: "",
};
const siteContractsReducer = (state = initialState, action) => {
  switch (action.type) {
    case GET_CONTRACT_LIST:
      return {
        ...state,
        contractsList: action.payload,
        filterContract: action.payload,
        error: "",
        success: "",
      };
    case GET_CONTRACT_LIST_FAILURE:
      return {
        ...state,
        error: action.payload,
      };
    default:
      return state;
  }
};

export default siteContractsReducer;
