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
import { toast } from "react-toastify";
import { get, put } from "../../../../../api";
import { getDocumentsRootFolder } from "../../../../../store/thunk/site";
import MoveDown from "@mui/icons-material/MoveDown";

import Swal from "sweetalert2";

const CopyFolder = ({
  getDocumentsRootFolder,
  rootFolder,
  siteSelectedForGlobal,
  selectedFileForCopy,
  handleClose,
}) => {
  const [openFolder, setFolderOpen] = useState(false);
  const [filteredFolders, setFilteredFolders] = useState([]);
  useEffect(() => {
    setFilteredFolders(rootFolder?.parentFolders || []);
  }, [rootFolder]);
  useEffect(() => {
    //getDocumentsRootFolder(siteSelectedForGlobal?.siteId);
  }, [siteSelectedForGlobal]);

  const handleFolderOpen = (e) => {
    e?.preventDefault();
    setFolderOpen((prev) => !prev);
  };

  const handleFolderClose = () => {
    setFolderOpen(false);
    setFilteredFolders(rootFolder?.parentFolders || []);
  };

  const handleRemoveFolder = (id) => {};

  const handleAddFolder = (folder) => {
    Swal.fire({
        target: document.getElementById("Modal-container"),
        title: `Do you want to move ${selectedFileForCopy?.name} to ${folder?.name}`,
        showDenyButton: false,
        showCancelButton: true,
        confirmButtonText: "Move",
      }).then(async (result) => {
        if (result.isConfirmed) {
          const url = `/api/document/file/${selectedFileForCopy?.id}/move/${folder?.id}`;
          const res = await put(url);
          if (res.status === 200) {
            toast.success(`${selectedFileForCopy?.name} is successfully moved to  ${folder?.name}`);
            handleClose();
            // getSites(loggedInUserData);
          } else {
            toast.error(
              "Something went wrong while deleting site. Please try again!"
            );
          }
        } else if (result.isDenied) {
          // Swal.fire("Changes are not saved", "", "info");
        }
      });
  };
  const checkSubFolder = async (folderId) => {
    const res = await get(`/api/document/parent/${folderId}/folders`);
    if (res?.document?.childFolders?.length > 0) {
      setFilteredFolders(res?.document?.childFolders || []);
    } else {
      toast.warn(
        "There is no sub folders available for selected parent folder."
      );
    }
  };
  const goToRootFolder = () => {
    setFilteredFolders(rootFolder?.parentFolders || []);
  };
  return (
    <>
      <div className="mb-2" style={{ height: "auto" }} id="Modal-container">
        <form className="row border-top">
          <div className="col-md-12 p-2 border-top">
            <div className="float-end">
              <Button
                type="button"
                className="btn btn-light text-primary"
                onClick={() => goToRootFolder()}
              >
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
                {filteredFolders?.length === 0 && (
                  <tr>
                    <td colSpan={2}>No Result Found</td>
                  </tr>
                )}
                {filteredFolders?.map((folder) => (
                  <tr key={folder.id}>
                    <td>
                      <i
                        style={{ color: "#384BD3" }}
                        className="fas fa-folder fa-2x"
                      ></i>
                      <span
                        className="p-3 text-primary cursor"
                        onClick={() => checkSubFolder(folder.id)}
                      >
                        {folder.name}
                      </span>
                    </td>
                    <td>
                      <span
                        className="text-primary cursor"
                        onClick={() => handleAddFolder(folder)}
                      >
                        <MoveDown />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </form>
      </div>
    </>
  );
};

const mapStateToProps = (state) => ({
  rootFolder: state.site.rootFolder,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
});

export default connect(mapStateToProps, { getDocumentsRootFolder })(CopyFolder);
