import { combineReducers } from "redux";
import login from "./reducers/login";
import site from "./reducers/site";
import fileFoldersReducers from "./reducers/fileFoldersReducers";
import siteContractsReducer from "./reducers/siteContracts";
import userReducer from "./reducers/user";
import siteProjectsReducer from "./reducers/siteProjectsReducer";
import { USER_LOGOUT, LOGOUT_SUCCESS } from "./actionTypes";

const combinedReducer = combineReducers({
  login: login,
  site: site,
  fileFoldersReducers: fileFoldersReducers,
  siteContracts: siteContractsReducer,
  userReducer: userReducer,
  siteProjectsReducer: siteProjectsReducer,
});

const rootReducer = (state, action) => {
  if (action.type === USER_LOGOUT || action.type === LOGOUT_SUCCESS) {
    // Reset every customer slice, including the older login reducer's stored user.
    return combinedReducer(undefined, { type: LOGOUT_SUCCESS });
  }
  return combinedReducer(state, action);
};

export default rootReducer;
