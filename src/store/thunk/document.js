import { del, get, post, postFloorPlans, put, uploadPhoto } from "../../api";
import { GET_DOCUMENTS_ROOT_FOLDER, GET_DOCUMENTS_ROOT_FOLDER_FAILURE } from "../actionTypes";

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