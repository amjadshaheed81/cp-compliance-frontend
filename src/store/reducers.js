import { combineReducers } from "redux";
import login from "./reducers/login";
import site from "./reducers/site";
import fileFoldersReducers from "./reducers/fileFoldersReducers";

const rootReducer = combineReducers({
  login: login,
  site: site,
  fileFoldersReducers: fileFoldersReducers,
});

export default rootReducer;
