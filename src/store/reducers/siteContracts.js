import {
  GET_CONTRACT_DETAIL,
  GET_CONTRACT_DETAIL_FAILURE,
  GET_CONTRACT_LIST,
  GET_CONTRACT_LIST_FAILURE,
} from "../actions/siteContractsActions";

const initialState = {
  isLoading: false,
  contractsList: [],
  filterContract: [],
  contractDetail: {},
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
    case GET_CONTRACT_DETAIL:
      return {
        ...state,
        contractDetail: action.payload,
        error: "",
        success: "",
      };
    case GET_CONTRACT_DETAIL_FAILURE:
      return {
        ...state,
        error: action.payload,
      };
    default:
      return state;
  }
};

export default siteContractsReducer;
