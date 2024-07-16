import { CPCOM_STATE_STORE } from "../Constant/Session";

export const saveState = (state) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(CPCOM_STATE_STORE, serializedState);
  } catch (err) {
    console.error("Could not save state", err);
  }
};

export const loadState = () => {
  try {
    const serializedState = localStorage.getItem(CPCOM_STATE_STORE);
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch (err) {
    console.error("Could not load state", err);
    return undefined;
  }
};
