import {
  del,
  get,
  post,
  postMultiPartFormData,
  put,
  uploadPhoto,
} from "../../api";
import {
  ADD_SITE_FAILURE,
  ADD_SITE_SUCCESS,
  FILTER_SITES,
  FILTER_SITES_FAILURE,
  GET_SITES_FAILURE,
  GET_SITES_SUCCESS,
  UPDATE_SITE,
  UPDATE_SITE_FAILURE,
  UPDATE_SITE_LOCAL_DETAILS,
  UPDATE_SITE_LOCAL_DETAILS_FAILURE,
  UPDATE_SITE_SUCCESS,
  UPDATE_TIMINIG_FAILURE,
  UPDATE_TIMINIG_SUCCESS,
  UPDATE_SITE_IMAGE_SUCCESS,
  UPDATE_SITE_IMAGE_FAILURE,
  GET_KEY_CONTACTS,
  GET_KEY_CONTACTS_FAILURE,
  GET_SITES_BY_ID_SUCCESS,
  GET_SITES_BY_ID_FAILURE,
  GET_ADDRESS_ON_POST_CODE_SUCCESS,
  GET_ADDRESS_ON_POST_CODE_FAILURE,
  GET_SITE_INFORMATION,
  GET_SITE_INFORMATION_FAILURE,
  SET_SITE_INFORMATION,
  SET_SITE_INFORMATION_FAILURE,
  SAVE_SITE_AREA_INFORMATION_FAILURE,
  SAVE_SITE_AREA_INFORMATION,
  GET_SITE_LAYOUT,
  GET_SITE_LAYOUT_FAILURE,
  GET_SITE_AREA_INFORMATION,
  GET_SITE_AREA_INFORMATION_FAILURE,
  SAVE_SITE_SECURITY_INFORMATION,
  SAVE_SITE_SECURITY_INFORMATION_FAILURE,
  GET_SITE_SECURITY_INFORMATION_FAILURE,
  GET_SITE_SECURITY_INFORMATION,
  GET_DOCUMENTS_ROOT_FOLDER,
  GET_DOCUMENTS_ROOT_FOLDER_FAILURE,
} from "../actionTypes";

export const addSite = (formData, goTo) => {
  return async (dispatch) => {
    try {
      const url = "/api/siteservice/site";
      const userData = await post(url, formData);
      dispatch({
        type: ADD_SITE_SUCCESS,
        payload: userData,
      });
      setTimeout(() => {
        goTo("/update-site");
      }, 1000);
    } catch (error) {
      dispatch({
        type: ADD_SITE_FAILURE,
        payload: "Something went wrong while adding site. Please try again.",
      });
    }
  };
};

export const updateSiteDetail = (formData) => {
  // const {id, ...data} = formData;
  return async (dispatch) => {
    try {
      const url = "/api/siteservice/updateSite";
      const res = await put(url, formData);
      dispatch({
        type: UPDATE_SITE_SUCCESS,
        payload: "Site has been updated successully",
      });
    } catch (error) {
      dispatch({
        type: UPDATE_SITE_FAILURE,
        payload: "Something went wrong while updating site. Please try again.",
      });
    }
  };
};

export const updateSiteImage = (data, siteId) => {
  return async (dispatch) => {
    const formData = new FormData();
    const file = data.target.files[0];
    // const file_size = formData.target.files[0].size;
    formData.append("file", file);
    formData.append("fileName", `site-photo`);
    try {
      const url = `/api/siteservice/site/${siteId}/upload`;
      const res = await uploadPhoto(url, formData);
      if (res.status === 200) {
        dispatch({
          type: UPDATE_SITE_IMAGE_SUCCESS,
          payload: res,
        });
      }
    } catch (error) {
      dispatch({
        type: UPDATE_SITE_IMAGE_FAILURE,
        payload:
          "Something went wrong while updating site image. Please try again.",
      });
    }
  };
};

export const updateLocalDetails = (formData) => {
  // const {id, ...data} = formData;
  return async (dispatch) => {
    try {
      const url = "/api/siteservice/updateLocalDetails";
      const res = await put(url, formData);
      dispatch({
        type: UPDATE_SITE_LOCAL_DETAILS,
        payload: "Local details has been updated successfully.",
      });
    } catch (error) {
      dispatch({
        type: UPDATE_SITE_LOCAL_DETAILS_FAILURE,
        payload: "Something went wrong while updating site. Please try again.",
      });
    }
  };
};

export const updateTimings = (formData) => {
  return async (dispatch) => {
    try {
      const url = "/api/siteservice/updateTimings";
      const res = await put(url, formData);
      dispatch({
        type: UPDATE_TIMINIG_SUCCESS,
        payload: "Site Timings has been updated successfully.",
      });
    } catch (error) {
      dispatch({
        type: UPDATE_TIMINIG_FAILURE,
        payload:
          "Something went wrong while updating site timing. Please try again.",
      });
    }
  };
};

export const deleteSite = (id) => {
  return async () => {
    try {
      const url = `/api/siteservice/site/${id}`;
      await del(url);
      return "Success";
    } catch (error) {
      return "Error";
    }
  };
};

export const getSites = () => {
  return async (dispatch) => {
    try {
      const url = "/api/siteservice/site/all";
      const siteList = await get(url);
      dispatch({
        type: GET_SITES_SUCCESS,
        payload: siteList,
      });
    } catch (error) {
      dispatch({
        type: GET_SITES_FAILURE,
        payload: "Something went wrong while fetching site. Please try again.",
      });
    }
  };
};

export const getSiteById = (id) => {
  return async (dispatch) => {
    try {
      const url = `/api/siteservice/site/${id}`;
      const siteList = await get(url);
      dispatch({
        type: GET_SITES_BY_ID_SUCCESS,
        payload: siteList,
      });
    } catch (error) {
      dispatch({
        type: GET_SITES_BY_ID_FAILURE,
        payload: "Something went wrong while fetching site. Please try again.",
      });
    }
  };
};

export const setFilterSite = (siteList) => {
  return async (dispatch) => {
    try {
      dispatch({
        type: FILTER_SITES,
        payload: siteList,
      });
    } catch (error) {
      dispatch({
        type: FILTER_SITES_FAILURE,
        payload:
          "Something went wrong while filtering sites. Please try again.",
      });
    }
  };
};

export const updateSite = (itm) => {
  return async (dispatch) => {
    try {
      dispatch({
        type: UPDATE_SITE,
        payload: itm,
      });
    } catch (error) {
      console.log("===>", error);
      dispatch({
        type: UPDATE_SITE_FAILURE,
        payload:
          "Something went wrong while filtering sites. Please try again.",
      });
    }
  };
};

export const deleteKeyContact = (id) => {
  return async () => {
    try {
      const url = `/api/siteservice/keyContacts/${id}`;
      await del(url);
      return "Success";
    } catch (error) {
      return "Error";
    }
  };
};
export const getKeyContact = (id) => {
  return async (dispatch) => {
    try {
      const url = `/api/siteservice/keyContacts/${id}`;
      const keyContactList = await get(url);
      dispatch({
        type: GET_KEY_CONTACTS,
        payload: keyContactList,
      });
    } catch (error) {
      dispatch({
        type: GET_KEY_CONTACTS_FAILURE,
        payload:
          "Something went wrong while fetching key contacts. Please try again.",
      });
    }
  };
};
export const addKeyContact = (formData, id) => {
  return async (dispatch) => {
    try {
      const url = "/api/siteservice/updateKeyContacts";
      const userData = await put(url, formData);
      if (userData?.status === 200) {
        const url = `/api/siteservice/keyContacts/${id}`;
        const keyContactList = await get(url);
        dispatch({
          type: GET_KEY_CONTACTS,
          payload: keyContactList,
        });
      }
    } catch (error) {
      dispatch({
        type: ADD_SITE_FAILURE,
        payload: "Something went wrong while adding site. Please try again.",
      });
    }
  };
};

export const deleteSiteImage = (id) => {
  return async () => {
    try {
      const url = `/api/siteservice/site/${id}/delete`;
      await del(url);
      return "Success";
    } catch (error) {
      return "Error";
    }
  };
};
export const handleOnPostCodeSearch = (e) => {
  // basicDetailsForm.setValue("postcode", e?.target?.value, {
  //   shouldValidate: true,
  // });
  return async (dispatch) => {
    try {
      // const url = `https://api.getaddress.io/autocomplete/l1w?api-key=pdSw7G1TEk6kghR1DNzddQ41182&all=true`
      const url = `https://api.getaddress.io/autocomplete/${e?.target?.value}?api-key=pdSw7G1TEk6kghR1DNzddQ41182&all=true`;
      // const url = `https://maps.googleapis.com/maps/api/geocode/json?components=postal_code:EC1A 1BB|country:UK&key=AIzaSyCszO_QrjGQ_w8ouOXQinr5yvVasIOqHoo`;
      // const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json
      // ?input=${e?.target?.value}
      // &types=geocode
      // &key=AIzaSyCszO_QrjGQ_w8ouOXQinr5yvVasIOqHoo&all`;
      // const url = `https://api.getaddress.io/autocomplete/${e?.target?.value}?API_KEY=AIzaSyCszO_QrjGQ_w8ouOXQinr5yvVasIOqHoo&all=true`;
      const response = await get(url);
      const res = [];
      response?.suggestions?.forEach((itm) => {
        res.push({
          id: itm?.id,
          name: `${itm?.address}`,
          url: `${itm?.url}`,
        });
      });
      dispatch({
        type: GET_ADDRESS_ON_POST_CODE_SUCCESS,
        payload: res,
      });
    } catch (error) {
      dispatch({
        type: GET_ADDRESS_ON_POST_CODE_FAILURE,
        payload: "Please enter a valid post code.",
      });
    }
  };
};

// export const handleOnPostCodeSelect = async (e) => {
//   // basicDetailsForm.setValue("postcode", e?.target?.value, {
//   //   shouldValidate: true,
//   // });
//   return async (dispatch) => {
//     try {
//       const url = `https://api.getaddress.io/autocomplete/${e?.target?.value}?API_KEY=AIzaSyCszO_QrjGQ_w8ouOXQinr5yvVasIOqHoo&all=true`;
//       const response = await get(url);
//       const res = [];
//       response?.suggestions?.forEach((itm) => {
//         res.push({
//           id: itm?.id,
//           name: `${itm?.address}`,
//           url: `${itm?.url}`,
//         });
//       });
//       dispatch({
//         type: GET_ADDRESS_ON_POST_CODE_SUCCESS,
//         payload: res,
//       });
//     } catch (error) {
//       dispatch({
//         type: GET_ADDRESS_ON_POST_CODE_FAILURE,
//         payload: "Please enter a valid post code.",
//       });
//     }
//   };
// };
export const saveSiteBuildingData = (siteId, formData) => {
  const data = {
    ...formData,
    siteId,
  };
  return async (dispatch) => {
    try {
      const url = "/api/siteservice/siteinfo";
      const buildingData = await post(url, data);
      if (buildingData?.status === 200) {
        // const url = `/api/siteservice/siteinfo/${id}?q=siteInfo`;
        // const siteInformation = await get(url);
        dispatch({
          type: SET_SITE_INFORMATION,
          payload: buildingData,
        });
      }
    } catch (error) {
      dispatch({
        type: SET_SITE_INFORMATION_FAILURE,
        payload: "Something went wrong while adding site. Please try again.",
      });
    }
  };
};

export const getSiteInformation = (id, setValue) => {
  return async (dispatch) => {
    try {
      const url = `/api/siteservice/siteinfo/${id}?q=siteInfo`;
      const siteInformation = await get(url);
      console.log("site information siteInformation", siteInformation);
      setValue("buildYear", siteInformation?.buildYear);
      setValue(
        "buildingUnderClientControl",
        siteInformation?.buildingUnderClientControl
      );
      setValue("canteenInBuilding", siteInformation?.canteenInBuilding);
      setValue("dedicatedKitchenArea", siteInformation?.dedicatedKitchenArea);
      dispatch({
        type: GET_SITE_INFORMATION,
        payload: siteInformation,
      });
    } catch (error) {
      dispatch({
        type: GET_SITE_INFORMATION_FAILURE,
        payload:
          "Something went wrong while fetching key contacts. Please try again.",
      });
    }
  };
};

export const saveAreaAndOccupancyDetails = (siteId, formData) => {
  const data = {
    ...formData,
    siteId,
  };
  return async (dispatch) => {
    try {
      const url = "/api/siteservice/siteareainfo";
      const siteareainfo = await post(url, data);
      if (siteareainfo?.status === 200) {
        // const url = `/api/siteservice/siteinfo/${id}?q=siteInfo`;
        // const siteInformation = await get(url);
        dispatch({
          type: SAVE_SITE_AREA_INFORMATION,
          payload: siteareainfo,
        });
      }
    } catch (error) {
      dispatch({
        type: SAVE_SITE_AREA_INFORMATION_FAILURE,
        payload: "Something went wrong while adding site. Please try again.",
      });
    }
  };
};

export const getAreaAndOccupancy = (id, setValue) => {
  return async (dispatch) => {
    try {
      const url = `/api/siteservice/siteinfo/${id}?q=siteArea`;
      const siteAreaInformation = await get(url);
      setValue("totalBuildingArea", siteAreaInformation?.totalBuildingArea);
      setValue("clientOccupiedArea", siteAreaInformation?.clientOccupiedArea);
      setValue("tenantOccupiedArea", siteAreaInformation?.tenantOccupiedArea);
      setValue("maxOccupancy", siteAreaInformation?.maxOccupancy);
      setValue("meetingClients", siteAreaInformation?.meetingClients);
      setValue("numberOfStaff", siteAreaInformation?.numberOfStaff);
      setValue("tenantInOccupation", siteAreaInformation?.tenantInOccupation);
      setValue("tenantName", siteAreaInformation?.tenantName);
      setValue(
        "vacantAreaInBuilding",
        siteAreaInformation?.vacantAreaInBuilding
      );
      setValue("numOfFloors", siteAreaInformation?.numOfFloors);
      setValue(
        "carParkSpaceAboveGround",
        siteAreaInformation?.carParkSpaceAboveGround
      );
      setValue(
        "carParkSpaceBelowGround",
        siteAreaInformation?.carParkSpaceBelowGround
      );
      setValue("numOfBasementLevels", siteAreaInformation?.numOfBasementLevels);
      dispatch({
        type: GET_SITE_AREA_INFORMATION,
        payload: siteAreaInformation,
      });
    } catch (error) {
      dispatch({
        type: GET_SITE_AREA_INFORMATION_FAILURE,
        payload:
          "Something went wrong while fetching key contacts. Please try again.",
      });
    }
  };
};

export const saveSafetyAndSecurityDetails = (siteId, formData) => {
  const data = {
    ...formData,
    siteId,
  };
  return async (dispatch) => {
    try {
      const url = "/api/siteservice/sitesecurityinfo";
      const siteSecurityInfo = await post(url, data);
      if (siteSecurityInfo?.status === 200) {
        // const url = `/api/siteservice/siteinfo/${id}?q=siteInfo`;
        // const siteInformation = await get(url);
        dispatch({
          type: SAVE_SITE_SECURITY_INFORMATION,
          payload: siteSecurityInfo,
        });
      }
    } catch (error) {
      dispatch({
        type: SAVE_SITE_SECURITY_INFORMATION_FAILURE,
        payload: "Something went wrong while adding site. Please try again.",
      });
    }
  };
};

export const getSafetyAndSecurityDetails = (id, setValue) => {
  return async (dispatch) => {
    try {
      const url = `/api/siteservice/siteinfo/${id}?q=siteSafety`;
      const siteSafetyInformation = await get(url);
      setValue("extFabric", siteSafetyInformation?.extFabric);
      setValue(
        "extMetallicFireEscapeStaircases",
        siteSafetyInformation?.extMetallicFireEscapeStaircases
      );
      setValue(
        "extTimberFireEscapeStaircases",
        siteSafetyInformation?.extTimberFireEscapeStaircases
      );
      setValue("verticalLadder", siteSafetyInformation?.verticalLadder);
      setValue("confinedSpaces", siteSafetyInformation?.confinedSpaces);
      setValue(
        "accessibleUnguardedRoofAreas",
        siteSafetyInformation?.accessibleUnguardedRoofAreas
      );
      setValue("fragileRoof", siteSafetyInformation?.fragileRoof);
      setValue(
        "lightingConductoreInstalltion",
        siteSafetyInformation?.lightingConductoreInstalltion
      );
      setValue("fireAlarmSystem", siteSafetyInformation?.fireAlarmSystem);
      setValue("firePanelLocation", siteSafetyInformation?.firePanelLocation);
      setValue("lpgStorageOnSite", siteSafetyInformation?.lpgStorageOnSite);
      setValue(
        "lpgBulkStorageOnSite",
        siteSafetyInformation?.lpgBulkStorageOnSite
      );
      setValue("hoseReels", siteSafetyInformation?.hoseReels);
      setValue(
        "securityGuardEmployed",
        siteSafetyInformation?.securityGuardEmployed
      );
      setValue("internalCCTV", siteSafetyInformation?.internalCCTV);
      setValue("externalCCTV", siteSafetyInformation?.externalCCTV);
      setValue("automaticBarrier", siteSafetyInformation?.automaticBarrier);
      setValue(
        "automaticGatesSliding",
        siteSafetyInformation?.automaticGatesSliding
      );
      setValue(
        "automaticGatesHinged",
        siteSafetyInformation?.automaticGatesHinged
      );
      setValue("manualSwingGates", siteSafetyInformation?.manualSwingGates);
      dispatch({
        type: GET_SITE_SECURITY_INFORMATION,
        payload: siteSafetyInformation,
      });
    } catch (error) {
      dispatch({
        type: GET_SITE_SECURITY_INFORMATION_FAILURE,
        payload:
          "Something went wrong while fetching key contacts. Please try again.",
      });
    }
  };
};

export const getSiteLayout = (id) => {
  return async (dispatch) => {
    try {
      const url = `/api/siteservice/layout/${id}`;
      const List = await get(url);
      dispatch({
        type: GET_SITE_LAYOUT,
        payload: List,
      });
    } catch (error) {
      dispatch({
        type: GET_SITE_LAYOUT_FAILURE,
        payload:
          "Something went wrong while fetching site layout. Please try again.",
      });
    }
  };
};

export const addSiteLayoutNode = (formData) => {
  console.log("formData", formData);
  return async (dispatch) => {
    try {
      const url = "/api/siteservice/createNode";
      const siteareainfo = await post(url, formData);
      console.log("siteareainfo", siteareainfo);
      if (siteareainfo?.status === 200) {
        const url = `/api/siteservice/layout/${formData?.siteId}`;
        const List = await get(url);
        dispatch({
          type: GET_SITE_LAYOUT,
          payload: List,
        });
      }
    } catch (error) {
      console.error(error);
    }
  };
};

export const uploadFloorPlan = (formData, siteId) => {
  console.log("formData", formData);
  return async (dispatch) => {
    try {
      const url = "/api/siteservice/uploadfloorplan";
      const siteareainfo = await postMultiPartFormData(url, formData);
      console.log("siteareainfo", siteareainfo);
      if (siteareainfo?.status === 200) {
        const url = `/api/siteservice/layout/${siteId}`;
        const List = await get(url);
        dispatch({
          type: GET_SITE_LAYOUT,
          payload: List,
        });
      }
    } catch (error) {
      console.error(error);
    }
  };
};

//TODO: move to documents reducers
export const getDocumentsRootFolder = () => {
  return async (dispatch) => {
    try {
      const url = "/api/document/parent/folders";
      const folderList = await get(url);
      dispatch({
        type: GET_DOCUMENTS_ROOT_FOLDER,
        payload: folderList,
      });
    } catch (error) {
      dispatch({
        type: GET_DOCUMENTS_ROOT_FOLDER_FAILURE,
        payload: "Something went wrong while fetching site. Please try again.",
      });
    }
  };
};
