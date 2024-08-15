import React, { useEffect, useState } from "react";
import BreadCrumHeader from "../../../common/BreadCrumHeader/BreadCrumHeader";
import Header from "../../../common/Header/Header";
import SidebarNew from "../../../common/Sidebar/SidebarNew";
import CreateFiles from "./CreateFiles";
import { connect } from "react-redux";
import { getDocumentsRootFolder } from "../../../../store/thunk/site";
import { useNavigate } from "react-router-dom";
import { get } from "../../../../api";
import "./Documents.css";
import Swal from "sweetalert2";

const Document = ({
  rootFolder,
  getDocumentsRootFolder,
  siteSelectedForGlobal,
  loggedInUserData,
}) => {
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] =
    React.useState(false);
  const [fileList, setFileList] = useState([]);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  useEffect(() => {
    if (siteSelectedForGlobal?.siteId) {
      getDocumentsRootFolder(siteSelectedForGlobal?.siteId);
    } else {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Please select site from site search and try again.",
      });
    }
  }, [siteSelectedForGlobal]);
  const navigateToSubFolder = (id) => {
    console.log("target", id);
    navigate(`/subfolder/?id=${id}`);
  };
  const searchDocument = async (e) => {
    const value = e?.target?.value;
    if (value && value.length > 0) {
      const url = `/api/document/file/search?q=${value}`;
      try {
        const response = await get(url);
        setFileList(response);
        // if (!response.includes(null)) {
        //     setFileList(response);
        // }
        // else setError("No Sites found. Please check the input");
      } catch (e) {
        setError("No Sites found. Please check the input");
      }
    } else {
      setFileList([]);
    }
  };
  return (
    <>
      <Header />
      <SidebarNew />
      {isCreateFolderModalOpen && (
        <CreateFiles
          setIsCreateFolderModalOpen={setIsCreateFolderModalOpen}
          uploaderUserId={loggedInUserData?.id}
          reviewerUserId={loggedInUserData?.id}
        />
      )}
      <div className="container-fluid pad-side">
        <BreadCrumHeader header={"Document Management"} page={"Documents"} />
        <div className="row mt-4 mb-4">
          <div className="col-md-6 col-sm-12">
            <i
              style={{
                position: "absolute",
                color: "lightgrey",
                paddingLeft: "1.5rem",
              }}
              className="fas fa-search p-3"
            ></i>
            <input
              type="text"
              style={{ textAlign: "justify", paddingLeft: "2rem" }}
              className="form-control m-2"
              id="search"
              name="search"
              placeholder="Search for Document"
              onChange={searchDocument}
            />
            {fileList && (
              <ul
                className="fileSearchResult fileSearchResultSite w-100"
                style={{
                  display: fileList ? "block" : "none",
                }}
              >
                {/* <p>{fileList}</p> */}
                {fileList?.files?.map((itm) => {
                  <p>{itm}</p>;
                  return (
                    <a href={itm.fileBlobUrl} download key={itm?.id}>
                      <span>
                        <i
                          style={{ color: "#384BD3" }}
                          className="fas fa-folder fa-1x"
                        ></i>{" "}
                        {itm?.folderName}/<b>{itm?.name}</b>
                      </span>
                    </a>
                  );
                })}
              </ul>
            )}
            {error && <p>{error}</p>}
          </div>
        </div>
        <div className="table-responsive w-100">
          <table className="table f-11">
            <thead className="table-dark">
              <tr>
                <th scope="col">Document Name</th>
                <th scope="col">Uploader</th>
                <th scope="col">Issue Date</th>
                <th scope="col">Expiry Date</th>
                <th scope="col">Source</th>
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
                        onClick={() => navigateToSubFolder(folder?.id)}
                      >
                        <i
                          style={{ color: "#384BD3" }}
                          className="fas fa-folder fa-2x"
                        ></i>
                        <span className="p-3">{folder?.name}</span>
                      </div>
                    </td>
                    <td>--</td>
                    <td>--</td>
                    <td>--</td>
                    <td>--</td>
                    <td>
                      <span
                        style={{ color: "gray" }}
                        className="cursor"
                        onClick={() => navigateToSubFolder(folder?.id)}
                      >
                        <i
                          className="fa fa-eye fa-2x"
                          aria-hidden="true"
                          size="md"
                        ></i>
                      </span>
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
})(Document);
