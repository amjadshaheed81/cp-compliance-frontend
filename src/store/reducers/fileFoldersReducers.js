import { GET_DOCUMENTS_ROOT_FOLDER, GET_DOCUMENTS_ROOT_FOLDER_FAILURE } from "../actionTypes";

const initialState = {
    isLoading: false,
    currentFolder: "",
    userFolders: [],
    userFiles: [],
    adminFolder: [],
    adminFiles: [],
    userFolderFailure:"",
}
const fileFoldersReducers = (state = initialState, action) => {
    switch (action.type) {
        case GET_DOCUMENTS_ROOT_FOLDER:
            return {
                ...state,
                userFolders: action.payload,
            };
        case GET_DOCUMENTS_ROOT_FOLDER_FAILURE:
            return {
                ...state,
                userFolderFailure:"",
            };
        default:
            return state;
    }
}

export default fileFoldersReducers;