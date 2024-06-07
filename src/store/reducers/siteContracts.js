import {
  GET_CONTRACT_DETAIL,
  GET_CONTRACT_DETAIL_FAILURE,
  GET_CONTRACT_LIST,
  GET_CONTRACT_LIST_FAILURE,
  SET_LOADING_CONTRACT,
  UPDATE_CONTRACT_DETAIL,
  UPDATE_CONTRACT_DETAIL_FAILURE,
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
        isLoading: false,
      };
    case GET_CONTRACT_LIST_FAILURE:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    case GET_CONTRACT_DETAIL:
      return {
        ...state,
        contractDetail: action.payload,
        error: "",
        success: "",
        isLoading: false,
      };
    case GET_CONTRACT_DETAIL_FAILURE:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    case UPDATE_CONTRACT_DETAIL:
      return {
        ...state,
        success: action.payload,
        error: "",
        isLoading: false,
      };
    case UPDATE_CONTRACT_DETAIL_FAILURE:
      return {
        ...state,
        success: "",
        error: action.payload,
        isLoading: false,
      };
    case SET_LOADING_CONTRACT:
      return {
        ...state,
        isLoading: true,
      };
    default:
      return state;
  }
};

export default siteContractsReducer;
