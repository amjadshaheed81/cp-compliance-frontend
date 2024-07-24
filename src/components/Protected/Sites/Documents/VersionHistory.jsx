import React, { useEffect, useState } from "react";
import {
  Button,
  Modal,
  Typography,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import TextSnippetOutlinedIcon from "@mui/icons-material/TextSnippetOutlined";
import { get } from "../../../../api";
import { toast } from "react-toastify";
import moment from "moment";
import CircularProgress from "@mui/material/CircularProgress";

const VersionHistory = ({ versionHistory, setVersionHistory, fileId }) => {
  const [open, setOpen] = useState([]);
  const [fileVerions, setFileVerions] = useState([]);
  const handleOpen = () => setVersionHistory(true);
  const handleClose = () => setVersionHistory(false);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    getVerions();
  }, []);
  const getVerions = async () => {
    try {
      setIsLoading(true);
      const versions = await get(`/api/document/file/${fileId}/history`);
      console.log("versions", versions);
      setFileVerions(versions?.files || []);
      setIsLoading(false);
    } catch (e) {
      setIsLoading(false);
      toast.error("Something went wrong while fetching file verions.");
      setFileVerions([]);
    }
  };

  return (
    <>
      <Button onClick={handleOpen}>Version History</Button>
      <Dialog open={open} maxWidth="lg" fullWidth onClose={handleClose}>
        <DialogTitle> Version History</DialogTitle>
        <DialogContent>
          <form className="row">
            {/* <div className="d-flex">
              <div>
                <label htmlFor="folder" name="folder">
                  Folder
                </label>
                <input type="text" name="folder" className="form-control" />
              </div>
              <div>
                <label htmlFor="file" name="file">
                  File
                </label>
                <input type="text" name="file" className="form-control" />
              </div>
              <div>
                <label htmlFor="fileUpload" name="fileUpload">
                  Upload New Version
                </label>
                <input type="file" name="fileUpload" className="form-control" />
              </div>
            </div> */}
            <div className="table-responsive">
              <table className="table f-11">
                <thead className="table-dark">
                  <tr>
                    <th scope="col">File</th>
                    <th scope="col">Version</th>
                    <th scope="col">Uploaded By</th>
                    <th scope="col">Date</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && (
                    <tr>
                      <td colSpan={4} align="center">
                        <CircularProgress />
                      </td>
                    </tr>
                  )}
                  {!isLoading && fileVerions?.length === 0 && (
                    <tr>
                      <td colSpan={5}>No Result Found</td>
                    </tr>
                  )}
                  {!isLoading &&
                    fileVerions?.map((file) => (
                      <tr>
                        <div>
                          <TextSnippetOutlinedIcon
                            style={{ color: "#384BD3" }}
                          />
                          <span className="p-3 cursor">{file?.name}</span>
                        </div>
                        <td>{file?.fileVersion ? file?.fileVersion : "--"}</td>
                        <td>
                          {file?.uploaderUserName
                            ? file?.uploaderUserName
                            : "--"}
                        </td>
                        <td>
                          {file?.expiryDate
                            ? moment(file?.expiryDate).format("YYYY-MM-DD")
                            : "--"}
                        </td>
                        <td>
                          <a
                            style={{ color: "gray", cursor: "pointer" }}
                            download
                            href={file?.fileBlobUrl}
                          >
                            <i
                              className="fa fa-eye fa-2x"
                              aria-hidden="true"
                              size="md"
                            ></i>
                          </a>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </form>
        </DialogContent>
        <DialogActions>
          <Button
            type="button"
            onClick={handleClose}
            className="bg-light text-primary"
          >
            Close
          </Button>
          <Button onClick={handleClose} className="bg-primary text-light">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default VersionHistory;
