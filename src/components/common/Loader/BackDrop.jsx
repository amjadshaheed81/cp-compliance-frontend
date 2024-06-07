import React, { useEffect } from "react";
import { connect } from "react-redux";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";

const BackDrop = ({ isLoading, isSiteContractLoading }) => {
  const [open, setOpen] = React.useState(false);
  useEffect(() => {
    if (isLoading || isSiteContractLoading) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [isLoading, isSiteContractLoading]);
  return (
    <Backdrop
      sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
      open={open}
    >
      <CircularProgress color="inherit" />
    </Backdrop>
  );
};
const mapStateToProps = (state) => ({
  isLoading: state.site.isLoading,
  isSiteContractLoading: state.siteContracts.isLoading,
});
export default connect(mapStateToProps, {})(BackDrop);
