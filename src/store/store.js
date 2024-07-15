import { createStore, applyMiddleware } from "redux";
import { thunk } from "redux-thunk";
import rootReducer from "./reducers";
import { saveState, loadState } from "./localStorage";

// Load persisted state from localStorage
const persistedState = loadState();

// Create store with persisted state
const store = createStore(
  rootReducer,
  persistedState,
  applyMiddleware(thunk)
);

// Save state to localStorage whenever the store changes
store.subscribe(() => {
  saveState(store.getState());
});

export default store;