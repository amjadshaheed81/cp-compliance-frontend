import { combineReducers } from "redux";
import login from "./reducers/login";
import site from "./reducers/site";
import fileFoldersReducers from "./reducers/fileFoldersReducers";
import siteContractsReducer from "./reducers/siteContracts";

const rootReducer = combineReducers({
  login: login,
  site: site,
  fileFoldersReducers: fileFoldersReducers,
  siteContracts: siteContractsReducer,
});

export default rootReducer;
