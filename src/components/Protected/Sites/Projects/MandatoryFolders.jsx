import React, { Fragment, useEffect, useState } from "react";
import { Box, Modal, Typography } from "@mui/material";
import { connect } from "react-redux";
import { getDocumentsRootFolder } from "../../../../store/thunk/site";

const MandatoryFolders = ({
  getDocumentsRootFolder,
  rootFolder,
  selectedMandatoryFolder,
  setSelectedMandatoryFolder,
}) => {
  const [openFolder, setFolderOpen] = useState(false);
  const handleFolderOpen = () => {
    setFolderOpen(!openFolder);
  };
  const handleFolderClose = () => {
    setFolderOpen(false);
  };
  useEffect(() => {
    getDocumentsRootFolder();
  }, []);
  const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 700,
    height: 400,
    overflow: "scroll",
    bgcolor: "background.paper",
    border: "2px solid #fff",
    boxShadow: 24,
    p: 4,
  };
  return (
    <Fragment>
      <div className="row mb-2" style={{ height: "auto" }}>
        <div className="col-md-3">
          <p>
            <strong>Add Mandatory Folders</strong>
          </p>
          <div>
            <button
              className="btn btn-sm btn-light text-primary w-100"
              onClick={handleFolderOpen}
            >
              <i className="fas fa-plus"></i>&nbsp; Select Folder
            </button>
          </div>
        </div>
        <div className="mt-2">
          {selectedMandatoryFolder?.map((itm) => (
            <Fragment>
              <span className="badge bg-light text-primary">
                {itm?.name}{" "}
                <i
                  className="fas fa-times"
                  size="sm"
                  onClick={() => {
                    setSelectedMandatoryFolder(
                      selectedMandatoryFolder?.filter(
                        (value) => value?.id != itm?.id
                      )
                    );
                  }}
                ></i>
              </span>
              &nbsp;
            </Fragment>
          ))}
        </div>
      </div>
      <Modal
        open={openFolder}
        onClose={handleFolderClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Select Mandatory Folders
          </Typography>
          <form className="row border-top">
            <div className="col-md-12 pt-4 border-top">
              <div className="float-end">
                <button type="button" className="btn btn-light text-primary">
                  <i className="fas fa-solid fa-home"></i> Root
                </button>
                &nbsp; &nbsp;
                <button type="button" className="btn btn-light text-primary">
                  <i className="fas fa-solid fa-arrow-left"></i> Back
                </button>
              </div>
            </div>
            <table className="table f-11">
              <thead className="table-dark">
                <tr>
                  <th scope="col">Folder</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rootFolder?.parentFolders?.map((folder, index) => (
                  <tr>
                    <td>
                      <i
                        style={{ color: "#384BD3" }}
                        className="fas fa-folder fa-2x"
                      ></i>
                      <span className="p-3">{folder?.name}</span>
                    </td>
                    <td>
                      <span
                        className="text-primary"
                        onClick={() => {
                          setSelectedMandatoryFolder([
                            ...selectedMandatoryFolder,
                            folder,
                          ]);
                        }}
                      >
                        <i className="fas fa-plus" size="sm"></i>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div>
              {selectedMandatoryFolder?.map((itm) => (
                <Fragment>
                  <span className="badge bg-light text-primary">
                    {itm?.name}{" "}
                    <i
                      className="fas fa-times"
                      size="sm"
                      onClick={() => {
                        setSelectedMandatoryFolder(
                          selectedMandatoryFolder?.filter(
                            (value) => value?.id != itm?.id
                          )
                        );
                      }}
                    ></i>
                  </span>
                  &nbsp;
                </Fragment>
              ))}
            </div>
            <div className="col-md-12 pt-4 border-top">
              <div className="float-end">
                <button
                  type="button"
                  className="btn btn-light mb-3 mr-4 text-primary"
                  onClick={() => {
                    setFolderOpen(false);
                  }}
                >
                  Cancel
                </button>
                &nbsp; &nbsp;
                <button
                  type="button"
                  className="btn btn-primary mb-3 mr-4"
                  onClick={() => {
                    setFolderOpen(false);
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </form>
        </Box>
      </Modal>
    </Fragment>
  );
};
const mapStateToProps = (state) => ({
  rootFolder: state.site.rootFolder,
});
export default connect(mapStateToProps, { getDocumentsRootFolder })(
  MandatoryFolders
);
