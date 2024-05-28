import { combineReducers } from "redux";
import login from "./reducers/login";
import site from "./reducers/site";
import fileFoldersReducer from "./reducers/fileFoldersReducers";

const rootReducer = combineReducers({
  login: login,
  site: site,
  fileFoldersReducer: fileFoldersReducer,
});

export default rootReducer;
