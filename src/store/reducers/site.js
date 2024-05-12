// reducers.js
import {
  ADD_SITE_FAILURE,
  ADD_SITE_SUCCESS,
  GET_SITES_SUCCESS,
  GET_SITES_FAILURE,
  FILTER_SITES,
  UPDATE_SITE_SUCCESS,
  UPDATE_SITE_FAILURE,
  UPDATE_SITE,
  UPDATE_SITE_LOCAL_DETAILS,
  UPDATE_SITE_LOCAL_DETAILS_FAILURE,
  UPDATE_TIMINIG_SUCCESS,
  UPDATE_TIMINIG_FAILURE,
  UPDATE_SITE_IMAGE_SUCCESS,
  UPDATE_SITE_IMAGE_FAILURE,
  GET_KEY_CONTACTS,
  GET_KEY_CONTACTS_FAILURE,
  GET_SITES_BY_ID_SUCCESS,
  GET_SITES_BY_ID_FAILURE,
  GET_ADDRESS_ON_POST_CODE,
  GET_ADDRESS_ON_POST_CODE_FAILURE,
  GET_ADDRESS_ON_POST_CODE_SUCCESS,
} from "./../actionTypes";

const initialState = {
  site: [],
  sites: [],
  filterSite: [],
  updateSite: {},
  keyContacts: [],
  error: "",
  success: "",
  localDetailsSuccess: "",
  localDetailsError: "",
  updateError: "",
  updateSuccess: "",
  updateSiteImageSuccess: "",
  updateSiteImageFailure: "",
  keyContactsFailure: "",
  currentSiteData: "",
  updateSiteImageSuccess: ""
};

const reducer = (state = initialState, action) => {
  console.log("action", action);
  console.log("state", state);

  switch (action.type) {
    case ADD_SITE_FAILURE:
      return {
        ...state,
        error: action.payload,
        success: "",
        localDetailsSuccess: "",
        localDetailsError: "",
        timingSuccess: "",
        timingError: "",
        updateError: "",
        updateSuccess: "",
      };
    case ADD_SITE_SUCCESS:
      return {
        ...state,
        success: "Successfully added site",
        error: "",
        localDetailsSuccess: "",
        localDetailsError: "",
        timingSuccess: "",
        timingError: "",
        updateError: "",
        updateSuccess: "",
        updateSiteImageSuccess: "",
        updateSiteImageFailure: "",
        updateSite: action.payload?.data,
        currentSiteData: action.payload
      };
    case GET_SITES_SUCCESS:
      return {
        ...state,
        sites: action.payload,
        filterSite: action.payload,
        success: "",
        error: "",
        localDetailsSuccess: "",
        localDetailsError: "",
        timingSuccess: "",
        timingError: "",
        updateError: "",
        updateSuccess: "",
        updateSiteImageSuccess: "",
        updateSiteImageFailure: "",
      };
    case GET_SITES_FAILURE:
      return {
        ...state,
        success: "",
        error: action.payload,
        localDetailsSuccess: "",
        localDetailsError: "",
        timingSuccess: "",
        timingError: "",
        updateError: "",
        updateSuccess: "",
        updateSiteImageSuccess: "",
        updateSiteImageFailure: "",
      };
    case FILTER_SITES:
      return {
        ...state,
        filterSite: action.payload,
        success: "",
        error: "",
        localDetailsSuccess: "",
        localDetailsError: "",
        timingSuccess: "",
        timingError: "",
        updateError: "",
        updateSuccess: "",
        updateSiteImageSuccess: "",
        updateSiteImageFailure: "",
      };
    case UPDATE_SITE:
      return {
        ...state,
        updateSite: action.payload,
        success: "",
        error: "",
        localDetailsSuccess: "",
        localDetailsError: "",
        timingSuccess: "",
        timingError: "",
        updateError: "",
        updateSuccess: "",
        updateSiteImageSuccess: "",
        updateSiteImageFailure: "",
      };
    case UPDATE_SITE_SUCCESS:
      return {
        ...state,
        success: "",
        error: "",
        updateError: "",
        updateSuccess: action.payload,
        localDetailsSuccess: "",
        localDetailsError: "",
        timingSuccess: "",
        timingError: "",
        updateSiteImageSuccess: "",
        updateSiteImageFailure: "",
      };
    case UPDATE_SITE_FAILURE:
      return {
        ...state,
        success: "",
        error: "",
        updateError: action.payload,
        updateSuccess: "",
        localDetailsSuccess: "",
        localDetailsError: "",
        timingSuccess: "",
        timingError: "",
        updateSiteImageSuccess: "",
        updateSiteImageFailure: "",
      };
    case UPDATE_SITE_LOCAL_DETAILS:
      return {
        ...state,
        success: "",
        error: "",
        updateError: "",
        updateSuccess: "",
        timingSuccess: "",
        timingError: "",
        localDetailsSuccess: action.payload,
        localDetailsError: "",
        updateSiteImageSuccess: "",
        updateSiteImageFailure: "",
      };
    case UPDATE_SITE_LOCAL_DETAILS_FAILURE:
      return {
        ...state,
        success: "",
        error: "",
        localDetailsSuccess: "",
        updateError: "",
        updateSuccess: "",
        timingSuccess: "",
        timingError: "",
        localDetailsError: action.payload,
        updateSiteImageSuccess: "",
        updateSiteImageFailure: "",
      };
    case UPDATE_TIMINIG_SUCCESS:
      return {
        ...state,
        success: "",
        error: "",
        localDetailsSuccess: "",
        localDetailsError: "",
        updateError: "",
        updateSuccess: "",
        timingSuccess: action.payload,
        timingError: "",
        updateSiteImageSuccess: "",
        updateSiteImageFailure: "",
      };
    case UPDATE_TIMINIG_FAILURE:
      return {
        ...state,
        success: "",
        error: "",
        localDetailsSuccess: "",
        localDetailsError: "",
        timingSuccess: "",
        updateError: "",
        updateSuccess: "",
        timingError: action.payload,
        updateSiteImageSuccess: "",
        updateSiteImageFailure: "",
      };
    case UPDATE_SITE_IMAGE_SUCCESS:
      return {
        ...state,
        success: "",
        error: "",
        localDetailsSuccess: "",
        localDetailsError: "",
        timingSuccess: "",
        updateError: "",
        updateSuccess: "",
        timingError: "",
        updateSiteImageSuccess: action.payload,
        updateSiteImageFailure: "",
      };
    case UPDATE_SITE_IMAGE_FAILURE:
      return {
        ...state,
        success: "",
        error: "",
        localDetailsSuccess: "",
        localDetailsError: "",
        timingSuccess: "",
        updateError: "",
        updateSuccess: "",
        timingError: "",
        updateSiteImageSuccess: "",
        updateSiteImageFailure: action.payload,
      };
    case GET_KEY_CONTACTS:
      return {
        ...state,
        keyContactsFailure: "",
        keyContacts: action.payload,
      };
    case GET_KEY_CONTACTS_FAILURE:
      return {
        ...state,
        keyContactsFailure: action.payload,
      };
    case GET_SITES_BY_ID_SUCCESS:
      return {
        ...state,
        siteDetailsById: action.payload,
      };
    case GET_SITES_BY_ID_FAILURE:
      return {
        ...state,
        siteDetailsByFailure: "",
      };
      case GET_ADDRESS_ON_POST_CODE_SUCCESS:
      return {
        ...state,
        getAddresOnPostCodeSuccess: action.payload,
      };
    case GET_ADDRESS_ON_POST_CODE_FAILURE:
      return {
        ...state,
        getAddresOnPostCodeFailure: action.payload,
      };
    default:
      return state;
  }
};

export default reducer;
