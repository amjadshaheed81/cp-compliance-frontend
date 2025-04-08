import React, { useEffect, useState } from "react";
import BreadCrumHeader from "../../../common/BreadCrumHeader/BreadCrumHeader";
import Header from "../../../common/Header/Header";
import SidebarNew from "../../../common/Sidebar/SidebarNew";
import { toast } from "react-toastify";
import CreateFiles from "./CreateFiles";

import CreateParentFolder from "./CreateParentFolder";
import CreateNewFolderIcon from "@mui/icons-material/CreateNewFolder";
import { connect } from "react-redux";
import Edit from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { getDocumentsRootFolder, setLoader } from "../../../../store/thunk/site";
import { Chip, Tooltip, Button } from "@mui/material";
import { isAdminLogin, isManagerAdminLogin } from "../../../../utils/isManagerAdminLogin";
import { useNavigate } from "react-router-dom";
import { get,del,put } from "../../../../api";
import "./Documents.css";
import Swal from "sweetalert2";

const AdminParentFolder = ({
  rootFolder,
  getDocumentsRootFolder,
  siteSelectedForGlobal,
  loggedInUserData,
  setLoader,
}) => {

  const [showFolderModal, setShowFolderModal] = useState(false);
  const [isCreateParentFolderModalOpen, setIsCreateParentFolderModalOpen] =
    React.useState(false);
  const [fileList, setFileList] = useState([]);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  useEffect(() => {
    if (siteSelectedForGlobal?.siteId) {
      setLoader(true);
      getDocumentsRootFolder(siteSelectedForGlobal?.siteId);
    } else {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Please select site from site search and try again.",
      });
    }
  }, [siteSelectedForGlobal]);


  
 
  return (
    <>
      <Header />
      <SidebarNew />
      {showFolderModal && (
          <CreateParentFolder
            showFolderModal={showFolderModal}
            setShowFolderModal={setShowFolderModal}
            refresh={() => {
              getDocumentsRootFolder(siteSelectedForGlobal?.siteId);
            }}
          />
        )}
      <div className="container-fluid pad-side">
        <BreadCrumHeader header={"Shared Folder Management"} page={"Folder  "} />
        <div className="row mt-4 mb-4">
          <div className="col-md-6 col-sm-12">
          <button
          onClick={
            ()=>setShowFolderModal(true)}
                  className="btn btn-primary rounded w-50 login-submit"
                >
                   Add new Folder <CreateNewFolderIcon />
                </button>
          
          </div>
          
        </div>
       
        <div className="table-responsive w-100">
          <table className="table f-11">
            <thead className="table-dark">
              <tr>
                <th scope="col"> Name</th>
                
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rootFolder?.parentFolders?.map((folder, index) => {
                return (
                  <tr>
                    <td>
                      <div
                        role="button"
                        tabIndex={0}
                        //onClick={() => navigateToSubFolder(folder?.id)}
                      >
                        <i
                          style={{ color: "#384BD3" }}
                          className="fas fa-folder fa-2x"
                        ></i>
                        <span className="p-3">{folder?.name} </span>
                      </div>
                    </td>
                   
                    <td>
                    {isManagerAdminLogin(loggedInUserData) && (
                          <>
                            {/* <Tooltip title={`Create New Folder`} arrow>
                              <CreateNewFolderIcon
                                onClick={() => {
                                  setShowFolderModal(true);
                                  setFolderId2(folder?.id);
                                  setFolder2(folder);
                                }}
                                style={{ color: "384bd3", cursor: "pointer" }}
                              />
                            </Tooltip> */}

                            {/* <Tooltip title={`Select or Upload New File`} arrow>
                              <NoteAddIcon
                                onClick={() => {
                                  setShowModal(true);
                                  setfolder(folder);
                                }}
                                style={{ color: "384bd3", cursor: "pointer" }}
                              />
                            </Tooltip> */}

                            {/* <Tooltip title={`Bulk Upload`} arrow>
                              <FolderCopyIcon
                                onClick={() => {
                                  setBulkUploadModal(true);
                                  setfolder(folder);
                                }}
                                style={{ color: "384bd3", cursor: "pointer" }}
                              />
                            </Tooltip> */}
                            {isAdminLogin(loggedInUserData) && (
                              <>
                                <Tooltip title={`Delete Folder`} arrow>
                                  <DeleteIcon
                                    onClick={() => {
                                      Swal.fire({
                                        title: `Do you want to delete ${folder?.name}`,
                                        showDenyButton: false,
                                        showCancelButton: true,
                                        confirmButtonText: "Delete",
                                      }).then(async (result) => {
                                        if (result.isConfirmed) {
                                          try {
                                            const url = `/api/document/parent-folder/${folder?.id}/delete`;
                                            const res = await del(url);
                                            if (res?.status === 200) { 
                                              getDocumentsRootFolder(siteSelectedForGlobal?.siteId);
                                              toast.success(
                                                `${folder?.name} has been deleted successully`
                                              );
                                            } else {
                                              toast.error(
                                                "Something went wrong while deleting document. Please try again!"
                                              );
                                            }
                                          } catch (e) {
                                            toast.error(
                                              "Something went wrong while deleting document. Please try again!"
                                            );
                                          }
                                        } else if (result.isDenied) {
                                          // Swal.fire("Changes are not saved", "", "info");
                                        }
                                      });
                                    }}
                                    style={{ color: "red", cursor: "pointer" }}
                                  />
                                </Tooltip>
                                <Tooltip title={`Edit Folder Name`} arrow>
                                  <Edit
                                    onClick={() => {
                                      Swal.fire({
                                        title: "Update Folder Name",
                                        input: "text",
                                        inputAttributes: {
                                          autocapitalize: "off",
                                        },
                                        inputValue: folder?.name || "",
                                        showCancelButton: true,
                                        confirmButtonText: "Update",
                                        showLoaderOnConfirm: true,
                                        preConfirm: async (data) => {
                                          if (!data) {
                                            Swal.showValidationMessage(
                                              "Folder name is required"
                                            );
                                            return false; // Prevent further processing if input is empty
                                          }
                                          try {
                                            const url = `/api/document/folder/${folder?.id}/manage`;
                                            const response = await put(url, {
                                              folderName: data,
                                            });
                                            if (response?.status === 200) {
                                              toast.success(
                                                `${folder?.name} has been updated successully`
                                              );
                                              getDocumentsRootFolder(siteSelectedForGlobal?.siteId);
                                            } else {
                                              toast.error(
                                                "Something went wrong while updating document. Please try again!"
                                              );
                                            }
                                          } catch (error) {
                                            Swal.showValidationMessage(`
                                          Request failed: ${error}
                                        `);
                                          }
                                        },
                                        allowOutsideClick: () =>
                                          !Swal.isLoading(),
                                      });
                                    }}
                                    style={{
                                      color: "384bd3",
                                      cursor: "pointer",
                                    }}
                                  />
                                </Tooltip>
                              </>
                            )}
                          </>
                        )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

const mapStateToProps = (state) => ({
  rootFolder: state.site.rootFolder,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
  loggedInUserData: state.site.loggedInUserData,
});

export default connect(mapStateToProps, {  
  getDocumentsRootFolder,
  setLoader, })(
    AdminParentFolder
);

