// reducers.js
import {
  GET_SITES_ASSET,
  GET_SITES_DOOR_ASSET,
  GET_SITES_PAT_ASSET,
  GET_SITES_PFP_ASSET,
} from "../actions/siteAssets";
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
  SAVE_UTILITY_ENERGY_DETAILS_FAILURE,
  SAVE_UTILITY_ENERGY_DETAILS,
  GET_UTILITY_ENERGY_DETAILS,
  GET_UTILITY_ENERGY_DETAILS_FAILURE,
  SAVE_SITE_LIFTS_INFORMATION,
  SAVE_SITE_LIFTS_INFORMATION_FAILURE,
  GET_SITE_LIFTS_INFORMATION,
  SAVE_SITE_LANDSCAPED_INFORMATION,
  SAVE_SITE_LANDSCAPED_INFORMATION_FAILURE,
  GET_SITE_LANDSCAPE_INFORMATION,
  SET_SITE_LOADER,
  SET_SITE_INFORMATION_FAILURE,
  RESET_SITE_MESSAGES,
  GET_SITE_SECURITY_INFORMATION,
  GET_SITE_SECURITY_INFORMATION_FAILURE,
  SAVE_SITE_LAYOUT,
  SAVE_SITE_LAYOUT_FAILURE,
  GET_USER_ALL,
  USER_LOGIN,
  USER_LOGOUT,
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
  siteSelectedForGlobal: JSON.parse(localStorage.getItem("site")),
  saveSiteUtilityInfo: null,
  saveSiteLiftsInfo: null,
  saveSiteLandscapesInfo: null,
  isLoading: false,
  users: [],
  loggedInUserData: null,
  siteAssets: [],
  siteDoorItems: [],
  sitePATItems: [],
  sitePFPItems: [],
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
        isLoading: false,
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
        isLoading: false,
      };
    case GET_SITES_SUCCESS:
      return {
        ...state,
        sites: action.payload,
        filterSite: action.payload,
        localDetailsSuccess: "",
        localDetailsError: "",
        timingSuccess: "",
        timingError: "",
        updateError: "",
        updateSuccess: "",
        updateSiteImageSuccess: "",
        updateSiteImageFailure: "",
        isLoading: false,
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
        isLoading: false,
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
        isLoading: false,
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
        isLoading: false,
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
        isLoading: false,
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
        isLoading: false,
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
        isLoading: false,
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
        isLoading: false,
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
        isLoading: false,
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
        isLoading: false,
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
        isLoading: false,
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
        isLoading: false,
      };
    case GET_KEY_CONTACTS:
      return {
        ...state,
        keyContactsFailure: "",
        keyContacts: action.payload,
        isLoading: false,
      };
    case GET_KEY_CONTACTS_FAILURE:
      return {
        ...state,
        keyContactsFailure: action.payload,
        isLoading: false,
        error: "Something went wrong while fetching key contacts",
        success: "",
      };
    case GET_SITES_BY_ID_SUCCESS:
      return {
        ...state,
        updateSiteImageSuccess: "",
        siteDetailsById: action.payload?.data,
        isLoading: false,
      };
    case GET_SITES_BY_ID_FAILURE:
      return {
        ...state,
        siteDetailsByFailure: "",
        isLoading: false,
      };
    case GET_ADDRESS_ON_POST_CODE_SUCCESS:
      return {
        ...state,
        getAddresOnPostCodeSuccess: action.payload,
        isLoading: false,
      };
    case GET_ADDRESS_ON_POST_CODE_FAILURE:
      return {
        ...state,
        isLoading: false,
        getAddresOnPostCodeFailure: action.payload,
      };
    case GET_SITE_INFORMATION:
      return {
        ...state,
        siteInformationFailure: "",
        success: "",
        error: "",
        isLoading: false,
        siteInformation: action.payload,
      };
    case SET_SITE_INFORMATION:
      return {
        ...state,
        isLoading: false,
        siteInformationFailure: "",
        setSiteInformation: action.payload,
        success: "site information has been saved successfully",
      };
    case SET_SITE_INFORMATION_FAILURE:
      return {
        ...state,
        isLoading: false,
        error: "Something went wrong while saving site information.",
      };
    case GET_SITE_INFORMATION_FAILURE:
      return {
        ...state,
        isLoading: false,
        siteInformationFailure: action.payload,
        error: "Something went wrong while site fetching site informatio.",
      };
    case SAVE_SITE_AREA_INFORMATION_FAILURE:
      return {
        ...state,
        siteareainfo: action.payload,
        isLoading: false,
        error: "Something went wrong while saving site area information.",
      };
    case SAVE_SITE_AREA_INFORMATION:
      return {
        ...state,
        success: "Site area information has been saved successfully.",
        siteareainfo: action.payload,
        isLoading: false,
      };
    case GET_SITE_AREA_INFORMATION:
      return {
        ...state,
        error: "",
        success: "",
        siteAreaInformation: action.payload,
        isLoading: false,
      };
    case GET_SITE_SECURITY_INFORMATION:
      return {
        ...state,
      };
    case GET_SITE_SECURITY_INFORMATION_FAILURE:
      return {
        ...state,
        error: "Something went wrong while fetching site security information",
        success: "",
      };
    case GET_SITE_AREA_INFORMATION_FAILURE:
      return {
        ...state,
        isLoading: false,
        error:
          "Something went wrong while fetching site area information. Please try again.",
        siteAreaInformation:
          "Something went wrong while fetching site area information. Please try again.",
      };
    case SAVE_SITE_SECURITY_INFORMATION:
      return {
        ...state,
        siteSecurityInfo: action.payload,
        success: "Site security information has been saved successfully.",
        isLoading: false,
      };
    case SAVE_SITE_SECURITY_INFORMATION_FAILURE:
      return {
        ...state,
        isLoading: false,
        error:
          "Something went wrong while saving site security information. Please try again.",
        siteSecurityInfo:
          "Something went wrong while fetching key contacts. Please try again.",
      };
    case SAVE_UTILITY_ENERGY_DETAILS:
      return {
        ...state,
        isLoading: false,
        success: "Site utility energy details has been updated successfully.",
        saveSiteUtilityInfo: action.payload,
      };
    case SAVE_UTILITY_ENERGY_DETAILS_FAILURE:
      return {
        ...state,
        isLoading: false,
        error:
          "Something went wrong while saving energy details. Please try again.",
        saveSiteUtilityInfo:
          "Something went wrong while fetching key contacts. Please try again.",
      };
    case GET_UTILITY_ENERGY_DETAILS:
      return {
        ...state,
        isLoading: false,
        getSiteUtilityInfo: action.payload,
      };
    case GET_UTILITY_ENERGY_DETAILS_FAILURE:
      return {
        ...state,
        isLoading: false,
        error:
          "Something went wrong while fetching utility energy details. Please try again.",
        getSiteUtilityInfo:
          "Something went wrong while fetching key contacts. Please try again.",
      };
    case GET_SITE_LAYOUT:
      return {
        ...state,
        isLoading: false,
        siteLayoutFailure: "",
        siteLayout: action.payload,
      };
    case GET_SITE_LAYOUT_FAILURE:
      return {
        ...state,
        isLoading: false,
        siteLayout: [],
        siteLayoutFailure: action.payload,
      };
    //TODO: move to fileFolderReducers
    case GET_DOCUMENTS_ROOT_FOLDER:
      return {
        ...state,
        isLoading: false,
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
        isLoading: false,
        subfolderFiles: action.payload,
      };
    case GET_DOCUMENTS_SUB_FOLDER_FILES_FAILURE:
      return {
        ...state,
        isLoading: false,
        subfolderFiles: "",
      };
    case UPDATE_DOCUMENT_FILE_SUCCESS:
      return {
        ...state,
        isLoading: false,
        uploadDocumentFile: action.payload,
      };
    case UPDATE_DOCUMENT_FILE_FAILURE:
      return {
        ...state,
        isLoading: false,
        subfolderFiles: "",
      };
    case SELECT_GLOBAL_SITE:
      return {
        ...state,
        isLoading: false,
        siteSelectedForGlobal: action.payload,
      };
    case CREATE_FOLDER:
      return {
        ...state,
        isLoading: false,
        createFolder: action.payload,
      };
    case SAVE_SITE_LIFTS_INFORMATION:
      return {
        ...state,
        isLoading: false,
        success: "Site lifts information has been saves successfully",
        saveSiteLiftsInfo: action.payload,
      };
    case SAVE_SITE_LIFTS_INFORMATION_FAILURE:
      return {
        ...state,
        isLoading: false,
        error: "Something went wrong while saving site lifts information",
        saveSiteLiftsInfo: "error",
      };
    case GET_SITE_LIFTS_INFORMATION:
      return {
        ...state,
        isLoading: false,
        saveSiteLiftsInfo: action.payload,
      };
    case SAVE_SITE_LANDSCAPED_INFORMATION:
      return {
        ...state,
        isLoading: false,
        success: "Successfully saved site landscape information",
        saveSiteLandscapesInfo: action.payload,
      };
    case SAVE_SITE_LANDSCAPED_INFORMATION_FAILURE:
      return {
        ...state,
        isLoading: false,
        success: "",
        error: "something went wrong while saving landscape information",
        saveSiteLandscapesInfo: "error",
      };
    case GET_SITE_LANDSCAPE_INFORMATION:
      return {
        ...state,
        isLoading: false,
        saveSiteLandscapesInfo: action.payload,
      };
    case SET_SITE_LOADER:
      return {
        ...state,
        isLoading: action.payload,
      };
    case RESET_SITE_MESSAGES:
      return {
        ...state,
        error: "",
        success: "",
      };
    case SAVE_SITE_LAYOUT:
      return {
        ...state,
        isLoading: false,
        error: "",
        success: "Successfuly updated site layout",
      };
    case SAVE_SITE_LAYOUT_FAILURE:
      return {
        ...state,
        isLoading: false,
        error:
          "Something went wrong while saving floor layout. please try again",
        success: "",
      };
    case GET_USER_ALL:
      return {
        ...state,
        users: action.payload,
      };
    case USER_LOGIN:
      return {
        ...state,
        isLoading: false,
        loggedInUserData: action.payload,
      };
    case USER_LOGOUT:
      return {
        ...initialState,
      };
    case GET_SITES_ASSET:
      return {
        ...state,
        siteAssets: action.payload,
      };
    case GET_SITES_DOOR_ASSET:
      return {
        ...state,
        siteDoorItems: action.payload,
      };
    case GET_SITES_PAT_ASSET:
      return {
        ...state,
        sitePATItems: action.payload,
      };
    case GET_SITES_PFP_ASSET:
      return {
        ...state,
        sitePFPItems: action.payload,
      };
    default:
      return state;
  }
};

export default reducer;
