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
  GET_DOCUMENTS_SUB_FOLDER_FILES_FAILURE,
  GET_DOCUMENTS_SUB_FOLDER_FILES,
  SELECT_GLOBAL_SITE,
  UPDATE_DOCUMENT_FILE_SUCCESS,
  UPDATE_DOCUMENT_FILE_FAILURE,
  CREATE_FOLDER,
  SAVE_UTILITY_ENERGY_DETAILS_FAILURE,
  SAVE_UTILITY_ENERGY_DETAILS,
  GET_UTILITY_ENERGY_DETAILS,
  GET_UTILITY_ENERGY_DETAILS_FAILURE,
  SAVE_SITE_UTILITY_INFORMATION_FAILURE,
  SAVE_SITE_UTILITY_INFORMATION,
  GET_SITE_UTILITY_INFORMATION,
  GET_SITE_LIFTS_INFORMATION,
  SAVE_SITE_LIFTS_INFORMATION_FAILURE,
  SAVE_SITE_LIFTS_INFORMATION,
  GET_SITE_LANDSCAPE_INFORMATION,
  SAVE_SITE_LANDSCAPED_INFORMATION,
  SAVE_SITE_LANDSCAPED_INFORMATION_FAILURE,
  SET_SITE_LOADER,
  RESET_SITE_MESSAGES,
} from "../actionTypes";

export const addSite = (formData, goTo) => {
  return async (dispatch) => {
    try {
      const url = "/api/site/site";
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
      const url = "/api/site/updateSite";
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
      const url = `/api/site/site/${siteId}/upload`;
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
      const url = "/api/site/updateLocalDetails";
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
      const url = "/api/site/updateTimings";
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
      const url = `/api/site/site/${id}`;
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
      const url = "/api/site/site/all";
      const siteList = await get(url);
      if (siteList) {
        dispatch({
          type: GET_SITES_SUCCESS,
          payload: siteList,
        });
      }
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
      const url = `/api/site/site/${id}`;
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
      const url = `/api/site/keyContacts/${id}`;
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
      const url = `/api/site/keyContacts/${id}`;
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
      const url = "/api/site/updateKeyContacts";
      const userData = await put(url, formData);
      if (userData?.status === 200) {
        const url = `/api/site/keyContacts/${id}`;
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
      const url = `/api/site/site/${id}/delete`;
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
      const url = "/api/site/siteinfo";
      const buildingData = await post(url, data);
      if (buildingData?.status === 200) {
        // const url = `/api/site/siteinfo/${id}?q=siteInfo`;
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
      const url = `/api/site/siteinfo/${id}?q=siteInfo`;
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
      const url = "/api/site/siteareainfo";
      const siteareainfo = await post(url, data);
      if (siteareainfo?.status === 200) {
        // const url = `/api/site/siteinfo/${id}?q=siteInfo`;
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
      const url = `/api/site/siteinfo/${id}?q=siteArea`;
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
      const url = "/api/site/sitesecurityinfo";
      const siteSecurityInfo = await post(url, data);
      if (siteSecurityInfo?.status === 200) {
        // const url = `/api/site/siteinfo/${id}?q=siteInfo`;
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
      const url = `/api/site/siteinfo/${id}?q=siteSafety`;
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

export const saveUtilityAndEnergyDetails = (siteId, formData) => {
  const data = {
    ...formData,
    siteId,
  };
  return async (dispatch) => {
    try {
      const url = "/api/site/siteutilityinfo";
      const siteSecurityInfo = await post(url, data);
      if (siteSecurityInfo?.status === 200) {
        // const url = `/api/site/siteinfo/${id}?q=siteInfo`;
        // const siteInformation = await get(url);
        dispatch({
          type: SAVE_UTILITY_ENERGY_DETAILS,
          payload: siteSecurityInfo,
        });
      }
    } catch (error) {
      dispatch({
        type: SAVE_UTILITY_ENERGY_DETAILS_FAILURE,
        payload: "Something went wrong while adding site. Please try again.",
      });
    }
  };
};

export const getUtilityAndEnergyDetails = (id, setValue) => {
  return async (dispatch) => {
    try {
      const url = `/api/site/siteinfo/${id}?q=siteUtility`;
      const siteUtilityInformation = await get(url);
      setValue("utilGas", siteUtilityInformation?.utilGas);
      setValue("utilElectricity", siteUtilityInformation?.utilElectricity);
      setValue("utilWater", siteUtilityInformation?.utilWater);
      setValue("utilTelecom", siteUtilityInformation?.utilTelecom);
      setValue("utilMainsDrainage", siteUtilityInformation?.utilMainsDrainage);
      setValue("airConditioning", siteUtilityInformation?.airConditioning);
      setValue("coolingTower", siteUtilityInformation?.coolingTower);
      setValue(
        "waterIsolationValveInternal",
        siteUtilityInformation?.waterIsolationValveInternal
      );
      setValue("waterTankLocation", siteUtilityInformation?.waterTankLocation);
      setValue("waterTanks", siteUtilityInformation?.waterTanks);
      setValue(
        "hotWaterCalorifier",
        siteUtilityInformation?.hotWaterCalorifier
      );
      setValue(
        "hotWaterCalorifierLocation",
        siteUtilityInformation?.hotWaterCalorifierLocation
      );
      setValue("pressureVessel", siteUtilityInformation?.pressureVessel);
      setValue("gasBoiler", siteUtilityInformation?.gasBoiler);
      setValue("gasBoilerLocation", siteUtilityInformation?.gasBoilerLocation);
      setValue(
        "gasSupplyIsolation",
        siteUtilityInformation?.gasSupplyIsolation
      );
      setValue(
        "gasSupplyExternalIsolation",
        siteUtilityInformation?.gasSupplyExternalIsolation
      );
      setValue(
        "electricInstallationLocation",
        siteUtilityInformation?.electricInstallationLocation
      );
      setValue(
        "electricSubStationOnSite",
        siteUtilityInformation?.electricSubStationOnSite
      );
      setValue("externalLighting", siteUtilityInformation?.externalLighting);
      setValue("backupGenerator", siteUtilityInformation?.backupGenerator);
      setValue(
        "backupGeneratorLocation",
        siteUtilityInformation?.backupGeneratorLocation
      );
      dispatch({
        type: GET_UTILITY_ENERGY_DETAILS,
        payload: siteUtilityInformation,
      });
    } catch (error) {
      dispatch({
        type: GET_UTILITY_ENERGY_DETAILS_FAILURE,
        payload:
          "Something went wrong while fetching key contacts. Please try again.",
      });
    }
  };
};

export const saveLiftsAndStairwaysDetails = (siteId, formData) => {
  const data = {
    ...formData,
    siteId,
  };
  return async (dispatch) => {
    try {
      const url = "/api/site/siteutilityinfo";
      const siteSecurityInfo = await post(url, data);
      if (siteSecurityInfo?.status === 200) {
        // const url = `/api/site/siteinfo/${id}?q=siteInfo`;
        // const siteInformation = await get(url);
        dispatch({
          type: SAVE_UTILITY_ENERGY_DETAILS,
          payload: siteSecurityInfo,
        });
      }
    } catch (error) {
      dispatch({
        type: SAVE_UTILITY_ENERGY_DETAILS_FAILURE,
        payload: "Something went wrong while adding site. Please try again.",
      });
    }
  };
};

export const getLiftsAndStairwaysDetails = (id, setValue) => {
  return async (dispatch) => {
    try {
      const url = `/api/site/siteinfo/${id}?q=siteUtility`;
      const siteUtilityInformation = await get(url);
      setValue("utilGas", siteUtilityInformation?.utilGas);
      setValue("utilElectricity", siteUtilityInformation?.utilElectricity);
      setValue("utilWater", siteUtilityInformation?.utilWater);
      setValue("utilTelecom", siteUtilityInformation?.utilTelecom);
      setValue("utilMainsDrainage", siteUtilityInformation?.utilMainsDrainage);
      setValue("airConditioning", siteUtilityInformation?.airConditioning);
      setValue("coolingTower", siteUtilityInformation?.coolingTower);
      setValue(
        "waterIsolationValveInternal",
        siteUtilityInformation?.waterIsolationValveInternal
      );
      setValue("waterTankLocation", siteUtilityInformation?.waterTankLocation);
      setValue("waterTanks", siteUtilityInformation?.waterTanks);
      setValue(
        "hotWaterCalorifier",
        siteUtilityInformation?.hotWaterCalorifier
      );
      setValue(
        "hotWaterCalorifierLocation",
        siteUtilityInformation?.hotWaterCalorifierLocation
      );
      setValue("pressureVessel", siteUtilityInformation?.pressureVessel);
      setValue("gasBoiler", siteUtilityInformation?.gasBoiler);
      setValue("gasBoilerLocation", siteUtilityInformation?.gasBoilerLocation);
      setValue(
        "gasSupplyIsolation",
        siteUtilityInformation?.gasSupplyIsolation
      );
      setValue(
        "gasSupplyExternalIsolation",
        siteUtilityInformation?.gasSupplyExternalIsolation
      );
      setValue(
        "electricInstallationLocation",
        siteUtilityInformation?.electricInstallationLocation
      );
      setValue(
        "electricSubStationOnSite",
        siteUtilityInformation?.electricSubStationOnSite
      );
      setValue("externalLighting", siteUtilityInformation?.externalLighting);
      setValue("backupGenerator", siteUtilityInformation?.backupGenerator);
      setValue(
        "backupGeneratorLocation",
        siteUtilityInformation?.backupGeneratorLocation
      );
      dispatch({
        type: GET_UTILITY_ENERGY_DETAILS,
        payload: siteUtilityInformation,
      });
    } catch (error) {
      dispatch({
        type: GET_UTILITY_ENERGY_DETAILS_FAILURE,
        payload:
          "Something went wrong while fetching key contacts. Please try again.",
      });
    }
  };
};

export const getSiteLayout = (id) => {
  return async (dispatch) => {
    try {
      const url = `/api/site/layout/${id}`;
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
      const url = "/api/site/createNode";
      const siteareainfo = await post(url, formData);
      console.log("siteareainfo", siteareainfo);
      if (siteareainfo?.status === 200) {
        const url = `/api/site/layout/${formData?.siteId}`;
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
  return async (dispatch) => {
    try {
      const url = "/api/site/uploadfloorplan";
      const siteareainfo = await postMultiPartFormData(url, formData);
      if (siteareainfo?.status === 200) {
        const url = `/api/site/layout/${siteId}`;
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

export const getSubFilesAndFolder = (folderId) => {
  return async (dispatch) => {
    try {
      const url = `/api/document/parent/${folderId}/folders`;
      const subFolderFiles = await get(url);
      dispatch({
        type: GET_DOCUMENTS_SUB_FOLDER_FILES,
        payload: subFolderFiles,
      });
    } catch (error) {
      dispatch({
        type: GET_DOCUMENTS_SUB_FOLDER_FILES_FAILURE,
        payload: "Something went wrong while fetching site. Please try again.",
      });
    }
  };
};

export const deleteFile = (id) => {
  return async () => {
    try {
      const url = `/api/document/file/${id}/delete`;
      await del(url);
      return "Success";
    } catch (error) {
      return "Error";
    }
  };
};

export const uploadDocumentFile = (data, folderId) => {
  return async (dispatch) => {
    const formData = {
      files: data.fileUpload[0],
      documentRequestString: {
        ...data,
        folderId,
      },
    };
    try {
      const url = `/api/document/files/upload`;
      const res = await uploadPhoto(url, formData);
      if (res.status === 200) {
        dispatch({
          type: UPDATE_DOCUMENT_FILE_SUCCESS,
          payload: res,
        });
      }
    } catch (error) {
      dispatch({
        type: UPDATE_DOCUMENT_FILE_FAILURE,
        payload:
          "Something went wrong while updating site image. Please try again.",
      });
    }
  };
};

export const createDocumentFolder = (formData, folderId) => {
  return async (dispatch) => {
    try {
      const url = "/api/document/folder";
      const createFolder = await post(url, formData);
      if (createFolder?.status === 200) {
        dispatch({
          type: CREATE_FOLDER,
          payload: createFolder,
        });
      }
    } catch (error) {
      console.error(error);
    }
  };
};

export const selectGlobalSite = (site) => {
  console.log("site", site);
  return async (dispatch) => {
    try {
      dispatch({
        type: SELECT_GLOBAL_SITE,
        payload: site,
      });
    } catch (error) {
      console.error(error);
    }
  };
};

export const getSiteDetailsById = (id, isViewMode) => {
  return async (dispatch) => {
    try {
      const url = `/api/site/site/${id}`;
      const data = await get(url);
      dispatch({
        type: UPDATE_SITE,
        payload: { ...data, isViewMode },
      });
    } catch (error) {
      console.error(error);
    }
  };
};

export const saveSiteUtilityInfo = (formData) => {
  return async (dispatch) => {
    try {
      const url = "/api/site/siteutilityinfo";
      const data = await post(url, formData);
      if (data?.status === 200) {
        dispatch({
          type: SAVE_SITE_UTILITY_INFORMATION,
          payload: data,
        });
      }
    } catch (error) {
      dispatch({
        type: SAVE_SITE_UTILITY_INFORMATION_FAILURE,
        payload:
          "Something went wrong while updating site utility info. Please try again.",
      });
    }
  };
};

export const saveLiftAndStairways = (formData) => {
  return async (dispatch) => {
    try {
      const url = "/api/site/siteliftsinfo";
      const data = await post(url, formData);
      if (data?.status === 200) {
        dispatch({
          type: SAVE_SITE_LIFTS_INFORMATION,
          payload: data,
        });
      }
    } catch (error) {
      dispatch({
        type: SAVE_SITE_LIFTS_INFORMATION_FAILURE,
        payload:
          "Something went wrong while updating site lifts info. Please try again.",
      });
    }
  };
};
export const saveSiteLandScapes = (formData) => {
  return async (dispatch) => {
    try {
      const url = "/api/site/sitelandscapeinfo";
      const data = await post(url, formData);
      if (data?.status === 200) {
        dispatch({
          type: SAVE_SITE_LANDSCAPED_INFORMATION,
          payload: data,
        });
      }
    } catch (error) {
      dispatch({
        type: SAVE_SITE_LANDSCAPED_INFORMATION_FAILURE,
        payload:
          "Something went wrong while updating site land scapes info. Please try again.",
      });
    }
  };
};

/**
 * q value
 * siteInfo
 * siteArea
 * siteSafety
 * siteUtility
 * siteLifts
 * siteScape
 */
export const getSiteLandScapeInfo = (id, reset) => {
  return async (dispatch) => {
    try {
      const url = `/api/site/siteinfo/${id}?q=siteScape`;
      const siteLandscapeInfo = await get(url);
      reset(siteLandscapeInfo);
      dispatch({
        type: GET_SITE_LANDSCAPE_INFORMATION,
        payload: siteLandscapeInfo,
      });
    } catch (error) {
      console.error(error);
    }
  };
};
export const getSiteUtilityInfo = (id, reset) => {
  return async (dispatch) => {
    try {
      const url = `/api/site/siteinfo/${id}?q=siteUtility`;
      const siteUtilityInfo = await get(url);
      reset(siteUtilityInfo);
      dispatch({
        type: GET_SITE_UTILITY_INFORMATION,
        payload: siteUtilityInfo,
      });
    } catch (error) {
      console.error(error);
    }
  };
};
export const getSiteLiftStairways = (id, reset) => {
  return async (dispatch) => {
    try {
      const url = `/api/site/siteinfo/${id}?q=siteLifts`;
      const siteLiftsInfo = await get(url);
      reset(siteLiftsInfo);
      dispatch({
        type: GET_SITE_LIFTS_INFORMATION,
        payload: siteLiftsInfo,
      });
    } catch (error) {
      console.error(error);
    }
  };
};

export const setLoader = (value) => {
  return async (dispatch) => {
    dispatch({
      type: SET_SITE_LOADER,
      payload: value,
    });
  };
};

export const resetSiteMessageState = (value) => {
  return async (dispatch) => {
    dispatch({
      type: RESET_SITE_MESSAGES,
      payload: value,
    });
  };
};
