import React, { Fragment, useEffect, useState } from "react";
import { Box, Modal, Typography } from "@mui/material";
import { connect } from "react-redux";
import { getDocumentsRootFolder } from "../../../../store/thunk/site";
import { toast } from "react-toastify";

const MandatoryFolders = ({
  getDocumentsRootFolder,
  rootFolder,
  selectedMandatoryFolder,
  setSelectedMandatoryFolder,
  siteSelectedForGlobal,
  isStatutory
}) => {
  const [openFolder, setFolderOpen] = useState(false);
  const handleFolderOpen = (e) => {
    e?.preventDefault();
    setFolderOpen(!openFolder);
  };
  const handleFolderClose = () => {
    setFolderOpen(false);
  };
  useEffect(() => {
    getDocumentsRootFolder(siteSelectedForGlobal?.siteId);
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
    border: "2px solid #969696ff",
    boxShadow: 24,
    p: 4,
  };

  // Function to determine folder background color based on file count
  const getFolderBackgroundColor = (folder) => {
    // Assuming folder has a fileCount property
    // If fileCount is 0 or undefined, return gray background, otherwise white
    return !folder.fileCount || folder.fileCount === 0 ? "#959595ff" : "#ffffff";
  };

  // Function to determine text color based on background
  const getFolderTextColor = (folder) => {
    const bgColor = getFolderBackgroundColor(folder);
    return bgColor === "#f8f9fa" ? "#6c757d" : "#000000";
  };

  return (
    <Fragment>
      <div className="row mb-2" style={{ height: "auto" }}>
        <div className={isStatutory ? "col-md-12" : "col-md-3"}>
          <p style={{ display: isStatutory ? "none" : "" }}>
            <strong>Add Mandatory Folders</strong>
          </p>
          <div>
            <button
              className="btn btn-sm btn-light text-primary w-100"
              onClick={handleFolderOpen}
            >
              <i className="fas fa-plus"></i>&nbsp; New Document Location
            </button>
          </div>
        </div>
        <div className="mt-2">
          {selectedMandatoryFolder?.map((itm) => (
            <Fragment key={itm?.id}>
              <span
                className="badge cursor"
                style={{
                  backgroundColor: getFolderBackgroundColor(itm),
                  color: getFolderTextColor(itm),
                  border: `1px solid ${getFolderTextColor(itm)}`
                }}
              >
                {itm?.name}{" "}
                <i
                  className="fas fa-times"
                  size="sm"
                  onClick={() => {
                    setSelectedMandatoryFolder(
                      selectedMandatoryFolder?.filter(
                        (value) => value?.id !== itm?.id
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
            <div className="table-responsive">
              <table className="table f-11">
                <thead className="table-dark">
                  <tr>
                    <th scope="col">Folder</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rootFolder?.parentFolders?.map((folder, index) => (
                    <tr
                      key={folder?.id || index}
                      style={{
                        backgroundColor: getFolderBackgroundColor(folder)
                      }}
                    >
                      <td>
                        <i
                          style={{
                            color: getFolderTextColor(folder) === "#000000" ? "#384BD3" : "#6c757d"
                          }}
                          className="fas fa-folder fa-2x"
                        ></i>
                        <span
                          className="p-3"
                          style={{ color: getFolderTextColor(folder) }}
                        >
                          {folder?.name}
                          {folder.fileCount !== undefined && (
                            <small className="ms-2">
                              ({folder.fileCount} {folder.fileCount === 1 ? 'file' : 'files'})
                            </small>
                          )}
                        </span>
                      </td>
                      <td>
                        <span
                          className="cursor"
                          style={{ color: getFolderTextColor(folder) }}
                          onClick={() => {
                            if (isStatutory) {
                              if (selectedMandatoryFolder?.length > 0) {
                                toast.warn("You can select only one folder to upload file for statutory.")
                              } else {
                                setSelectedMandatoryFolder([
                                  ...selectedMandatoryFolder,
                                  folder,
                                ]);
                              }
                            } else {
                              setSelectedMandatoryFolder([
                                ...selectedMandatoryFolder,
                                folder,
                              ]);
                            }
                          }}
                        >
                          <i className="fas fa-plus" size="sm"></i>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              {selectedMandatoryFolder?.map((itm) => (
                <Fragment key={itm?.id}>
                  <span
                    className="badge cursor"
                    style={{
                      backgroundColor: getFolderBackgroundColor(itm),
                      color: getFolderTextColor(itm),
                      border: `1px solid ${getFolderTextColor(itm)}`
                    }}
                  >
                    {itm?.name}{" "}
                    <i
                      className="fas fa-times"
                      size="sm"
                      onClick={() => {
                        setSelectedMandatoryFolder(
                          selectedMandatoryFolder?.filter(
                            (value) => value?.id !== itm?.id
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
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
});

export default connect(mapStateToProps, { getDocumentsRootFolder })(
  MandatoryFolders
);