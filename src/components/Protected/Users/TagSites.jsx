import React, { useState } from "react";
import { Button } from "@mui/material";
import { connect } from "react-redux";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Pagination from "../../common/Pagination/Pagination";

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
  const handleOpen = () => setShowSiteTagModal(true);
  const handleClose = () => setShowSiteTagModal(false);
  const [sitesPerPage] = useState(7);
  const [currentPage, setCurrentPage] = useState(1);
  const indexOfLastSite = currentPage * sitesPerPage;
  const indexOfFirstSite = indexOfLastSite - sitesPerPage;
  const currentSites = taggedSites?.slice(indexOfFirstSite, indexOfLastSite) || [];
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };
  return (
    <React.Fragment>
      <Dialog
        open={showSiteTagModal}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle> {taggedSites?.length} Site Tagged</DialogTitle>
        <DialogContent dividers>
          <div className="row p-2">
            <div className="col-md-12 table-responsive">
              <table className="table" style={{ border: "1px solid" }}>
                <thead className="table-dark">
                  <tr>
                    <th scope="col">Site Name</th>
                  </tr>
                </thead>
                <tbody>
                  {currentSites?.map((itm) => (
                    <tr>
                      <td>{itm?.name ? itm?.name : itm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="row">
            <Pagination
              totalPages={Math.ceil(taggedSites.length / sitesPerPage)}
              currentPage={currentPage}
              onPageChange={handlePageChange}
            />
          </div>
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
