import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import Snackbar, { SnackbarOrigin } from "@mui/material/Snackbar";
import { resetSiteMessageState } from "../../../store/thunk/site";

const SnackBarMessage = ({ error, success, resetSiteMessageState }) => {
  const [state, setState] = useState({
    open: false,
    vertical: "top",
    horizontal: "center",
  });
  const { vertical, horizontal, open } = state;

  useEffect(() => {
    console.log("success", success);
    if (success || error) {
      setState({ ...state, open: true });
    } else {
      setState({ ...state, open: false });
    }
    return () => {
        setTimeout(() => {
            resetSiteMessageState();
        }, 6000);
    };
  }, [error, success]);
  const handleClose = () => {
    setState({ ...state, open: false });
  };
  return (
    <Snackbar
      anchorOrigin={{ vertical, horizontal }}
      open={open}
      onClose={handleClose}
      message={success || error}
      key={vertical + horizontal}
    />
  );
};
const mapStateToProps = (state) => ({
  error: state.site.error,
  success: state.site.success,
});
export default connect(mapStateToProps, { resetSiteMessageState })(SnackBarMessage);
