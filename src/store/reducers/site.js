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
  GET_SITE_INFORMATION_FAILURE,
  GET_SITE_INFORMATION,
  SET_SITE_INFORMATION,
  SAVE_SITE_AREA_INFORMATION_FAILURE,
  SAVE_SITE_AREA_INFORMATION,
  GET_SITE_LAYOUT,
  GET_SITE_LAYOUT_FAILURE,
  GET_SITE_AREA_INFORMATION_FAILURE,
  GET_SITE_AREA_INFORMATION,
  SAVE_SITE_SECURITY_INFORMATION_FAILURE,
  SAVE_SITE_SECURITY_INFORMATION,
  GET_DOCUMENTS_ROOT_FOLDER_FAILURE,
  GET_DOCUMENTS_ROOT_FOLDER,
  GET_DOCUMENTS_SUB_FOLDER_FILES,
  GET_DOCUMENTS_SUB_FOLDER_FILES_FAILURE,
  SELECT_GLOBAL_SITE,
  UPDATE_DOCUMENT_FILE_FAILURE,
  UPDATE_DOCUMENT_FILE_SUCCESS,
  CREATE_FOLDER,
  SAVE_SITE_UTILITY_INFORMATION,
  SAVE_SITE_UTILITY_INFORMATION_FAILURE,
  GET_SITE_UTILITY_INFORMATION,
} from "./../actionTypes";

const initialState = {
  site: [],
  sites: [],
  filterSite: [],
  updateSite: {},
  keyContacts: [],
  siteInformation: {},
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
  updateSiteImageSuccess: "",
  siteLayout: [],
  siteLayoutFailure: "",
  siteSelectedForGlobal: {},
  saveSiteUtilityInfo: null,
};

const reducer = (state = initialState, action) => {
  // console.log("action", action);
  // console.log("state", state);

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
        currentSiteData: action.payload,
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
        updateSiteImageSuccess: "",
        siteDetailsById: action.payload?.data,
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
    case GET_SITE_INFORMATION:
      return {
        ...state,
        siteInformationFailure: "",
        siteInformation: action.payload,
      };
    case SET_SITE_INFORMATION:
      return {
        ...state,
        siteInformationFailure: "",
        setSiteInformation: action.payload,
      };
    case GET_SITE_INFORMATION_FAILURE:
      return {
        ...state,
        siteInformationFailure: action.payload,
      };
    case SAVE_SITE_AREA_INFORMATION_FAILURE:
      return {
        ...state,
        siteareainfo: action.payload,
      };
    case SAVE_SITE_AREA_INFORMATION:
      return {
        ...state,
        siteareainfo: action.payload,
      };
    case GET_SITE_AREA_INFORMATION:
      return {
        ...state,
        siteAreaInformation: action.payload,
      };
    case GET_SITE_AREA_INFORMATION_FAILURE:
      return {
        ...state,
        siteAreaInformation:
          "Something went wrong while fetching key contacts. Please try again.",
      };
    case SAVE_SITE_SECURITY_INFORMATION:
      return {
        ...state,
        siteSecurityInfo: action.payload,
      };
    case SAVE_SITE_SECURITY_INFORMATION_FAILURE:
      return {
        ...state,
        siteSecurityInfo:
          "Something went wrong while fetching key contacts. Please try again.",
      };
    case SAVE_SITE_UTILITY_INFORMATION:
      return {
        ...state,
        saveSiteUtilityInfo: action.payload,
      };
    case SAVE_SITE_UTILITY_INFORMATION_FAILURE:
      return {
        ...state,
        saveSiteUtilityInfo:
          "error",
      };
    case GET_SITE_UTILITY_INFORMATION:
      return {
        ...state,
        saveSiteUtilityInfo: action.payload,
      };
    case GET_SITE_LAYOUT:
      return {
        ...state,
        siteLayoutFailure: "",
        siteLayout: action.payload,
      };
    case GET_SITE_LAYOUT_FAILURE:
      return {
        ...state,
        siteLayout: [],
        siteLayoutFailure: action.payload,
      };
    //TODO: move to fileFolderReducers
    case GET_DOCUMENTS_ROOT_FOLDER:
      return {
        ...state,
        rootFolder: action.payload,
      };
    case GET_DOCUMENTS_ROOT_FOLDER_FAILURE:
      return {
        ...state,
        rootFolderFailure: "",
      };
    case GET_DOCUMENTS_SUB_FOLDER_FILES:
      return {
        ...state,
        subfolderFiles: action.payload,
      };
    case GET_DOCUMENTS_SUB_FOLDER_FILES_FAILURE:
      return {
        ...state,
        subfolderFiles: "",
      };
    case UPDATE_DOCUMENT_FILE_SUCCESS:
      return {
        ...state,
        uploadDocumentFile: action.payload,
      };
    case UPDATE_DOCUMENT_FILE_FAILURE:
      return {
        ...state,
        subfolderFiles: "",
      };
    case SELECT_GLOBAL_SITE:
      return {
        ...state,
        siteSelectedForGlobal: action.payload,
      };
    case CREATE_FOLDER:
      return {
        ...state,
        createFolder: action.payload,
      };
    default:
      return state;
  }
};

export default reducer;
