import React from "react";
import { Button } from "@mui/material";
import { connect } from "react-redux";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { Chip } from "@mui/material";

export const ITEM_HEIGHT = 48;
export const ITEM_PADDING_TOP = 8;
export const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
    },
  },
};

const TagSites = ({ showSiteTagModal, setShowSiteTagModal, taggedSites }) => {
    console.log("taggedSites", taggedSites)
  const handleOpen = () => setShowSiteTagModal(true);
  const handleClose = () => setShowSiteTagModal(false);
  return (
    <React.Fragment>
      <Dialog
        open={showSiteTagModal}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle> {taggedSites?.length} Site Tagged</DialogTitle>
        <DialogContent dividers>
          {taggedSites?.map(itm => (
            <Chip
              color={'primary'}
              label={itm?.name ? itm?.name : itm}
              style={{ marginLeft: "10px", marginTop: "10px" }}
            />
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} className="bg-light text-primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
};

const mapStateToProps = (state) => ({});
export default connect(mapStateToProps, {})(TagSites);
