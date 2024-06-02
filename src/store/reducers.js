import { combineReducers } from "redux";
import login from "./reducers/login";
import site from "./reducers/site";
import fileFoldersReducers from "./reducers/fileFoldersReducers";
import siteContractsReducer from "./reducers/siteContracts";
import userReducer from "./reducers/user";

const rootReducer = combineReducers({
  login: login,
  site: site,
  fileFoldersReducers: fileFoldersReducers,
  siteContracts: siteContractsReducer,
  userReducer: userReducer,
});

export default rootReducer;
