import React, { Fragment, useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { connect } from "react-redux";
import { getDocumentsRootFolder } from "../../../../store/thunk/site";

const MandatoryFolders = ({
  getDocumentsRootFolder,
  rootFolder,
  selectedMandatoryFolder,
  setSelectedMandatoryFolder,
  siteSelectedForGlobal,
}) => {
  const [openFolder, setFolderOpen] = useState(false);

  useEffect(() => {
    getDocumentsRootFolder(siteSelectedForGlobal?.siteId);
  }, [getDocumentsRootFolder, siteSelectedForGlobal]);

  const handleFolderOpen = (e) => {
    e?.preventDefault();
    setFolderOpen((prev) => !prev);
  };

  const handleFolderClose = () => {
    setFolderOpen(false);
  };

  const handleRemoveFolder = (id) => {
    setSelectedMandatoryFolder((prev) =>
      prev.filter((folder) => folder.id !== id)
    );
  };

  const handleAddFolder = (folder) => {
    setSelectedMandatoryFolder((prev) => [...prev, folder]);
  };

  return (
    <>
      <div className="row mb-2" style={{ height: "auto" }}>
        <div className="col-md-8 mt-4">
          <Button
            className="btn btn-sm btn-light text-primary w-100"
            onClick={handleFolderOpen}
          >
            <i className="fas fa-plus"></i>&nbsp; Select Folder
          </Button>
        </div>
        <div className="mt-2">
          {selectedMandatoryFolder?.map((folder) => (
            <Fragment>
              <Chip
                key={folder.id}
                label={folder?.name}
                color="primary"
                onDelete={() => handleRemoveFolder(folder.id)}
              ></Chip>
              &nbsp;
            </Fragment>
          ))}
        </div>
      </div>
      <Dialog
        open={openFolder}
        onClose={handleFolderClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Select Mandatory Folders</DialogTitle>
        <DialogContent>
          <form className="row border-top">
            <div className="col-md-12 p-2 border-top">
              <div className="float-end">
                <Button type="button" className="btn btn-light text-primary">
                  <i className="fas fa-home"></i> Root
                </Button>
                &nbsp; &nbsp;
                <Button type="button" className="btn btn-light text-primary">
                  <i className="fas fa-arrow-left"></i> Back
                </Button>
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
                  {rootFolder?.parentFolders?.map((folder) => (
                    <tr key={folder.id}>
                      <td>
                        <i
                          style={{ color: "#384BD3" }}
                          className="fas fa-folder fa-2x"
                        ></i>
                        <span className="p-3">{folder.name}</span>
                      </td>
                      <td>
                        <span
                          className="text-primary cursor"
                          onClick={() => handleAddFolder(folder)}
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
              {selectedMandatoryFolder?.map((folder) => (
                <Fragment>
                  <Chip
                    key={folder.id}
                    label={folder?.name}
                    color="primary"
                    onDelete={() => handleRemoveFolder(folder.id)}
                  ></Chip>
                  &nbsp;
                </Fragment>
              ))}
            </div>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFolderClose} className="bg-light text-primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const mapStateToProps = (state) => ({
  rootFolder: state.site.rootFolder,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
});

export default connect(mapStateToProps, { getDocumentsRootFolder })(
  MandatoryFolders
);
