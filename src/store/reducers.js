import { combineReducers } from "redux";
import login from "./reducers/login";
import site from "./reducers/site";

const rootReducer = combineReducers({
  login: login,
  site: site,
});

export default rootReducer;
