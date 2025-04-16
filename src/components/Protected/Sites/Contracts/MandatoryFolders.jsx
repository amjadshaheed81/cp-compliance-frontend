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
import { toast } from "react-toastify";
import { get } from "../../../../api";

const MandatoryFolders = ({
  getDocumentsRootFolder,
  rootFolder,
  selectedMandatoryFolder,
  setSelectedMandatoryFolder,
  siteSelectedForGlobal,
  isStatutory,
  isSingleFolderSelect,
  setFiles,
}) => {
  const [openFolder, setFolderOpen] = useState(false);
  const [filteredFolders, setFilteredFolders] = useState([]);
  useEffect(() => {
    setFilteredFolders(rootFolder?.parentFolders || []);
  }, [rootFolder]);
  // useEffect(() => {
  //   getDocumentsRootFolder(siteSelectedForGlobal?.siteId);
  // }, [getDocumentsRootFolder, siteSelectedForGlobal]);

  const handleFolderOpen = (e) => {
    e?.preventDefault();
    setFolderOpen((prev) => !prev);
  };

  const handleFolderClose = () => {
    setFolderOpen(false);
    setFilteredFolders(rootFolder?.parentFolders || []);
  };

  const handleRemoveFolder = (id) => {
    setSelectedMandatoryFolder((prev) =>
      prev.filter((folder) => folder.id !== id)
    );
  };

  const handleAddFolder = (folder) => {
    if(isStatutory || isSingleFolderSelect) {
      if(selectedMandatoryFolder?.length > 0) {
        toast.warn("You can select only one folder to upload file.")
      } else {
        setSelectedMandatoryFolder([
          ...selectedMandatoryFolder,
          folder,
        ]);
      }
    } else {
      const isFolderAlreadySelected = selectedMandatoryFolder?.filter(itm => itm?.id === folder?.id);
      if(isFolderAlreadySelected?.length > 0) {
        toast.warn(`${folder?.name} is already selected`);
      } else{
        setSelectedMandatoryFolder((prev) => [...prev, folder]);
      }
    }
  };
  const checkSubFolder = async (folderId) => {
    const res = await get(`/api/document/parent/${folderId}/folders`);
    if(res?.document?.childFolders?.length > 0) {
      setFilteredFolders(res?.document?.childFolders || []);
    } else {
      toast.warn("There is no sub folders available for selected parent folder.")
    }
  };
  const goToRootFolder = () => {
    setFilteredFolders(rootFolder?.parentFolders || []);
  }
  return (
    <>
      <div className="row mb-2" style={{ height: "auto" }}>
        <div className={isStatutory ? "col-md-12 mt-4" : "col-md-3 mt-4"}>
          <Button
            className="btn btn-sm btn-light text-primary w-100"
            onClick={handleFolderOpen}
            style={{fontSize: '12px'}}
          >
            <i className="fas fa-plus"></i>&nbsp; New Document Location
          </Button>
        </div>
        <div className="mt-2">
          {selectedMandatoryFolder?.map((folder) => (
            <Fragment>
              <Chip
                key={folder.id}
                label={folder?.requirement ? folder?.requirement : folder?.name}
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
                <Button type="button" className="btn btn-light text-primary" onClick={() => goToRootFolder()}>
                  <i className="fas fa-home"></i> Root
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
                  {
                    filteredFolders?.length === 0 && <tr>
                      <td colSpan={2}>No Result Found</td>
                    </tr>
                  }
                  {filteredFolders?.map((folder) => (
                    <tr key={folder.id}>
                      <td>
                        <i
                          style={{ color: "#384BD3" }}
                          className="fas fa-folder fa-2x"
                        ></i>
                        <span className="p-3 text-primary cursor" onClick={() => checkSubFolder(folder.id)}>{folder.name}</span>
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
                <span>
                  <Chip
                    key={folder.id}
                    label={folder?.name}
                    color="primary"
                    onDelete={() => handleRemoveFolder(folder.id)}
                  ></Chip>
                  &nbsp;
                </span>
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
