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
import { useForm } from "react-hook-form";
import { Validation } from "../../../../Constant/Validation";
import { InputError } from "../../../common/InputError";
import PdfViewer from "./PdfViewer";

const VersionHistory = ({ versionHistory, setVersionHistory, fileId }) => {
  const [open, setOpen] = useState([]);
  const [fileVerions, setFileVerions] = useState([]);
  const handleOpen = () => setVersionHistory(true);
  const handleClose = () => setVersionHistory(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState("");
  const {
    register,
    formState: { errors },
    handleSubmit,
    setValue,
  } = useForm({});
  useEffect(() => {
    getVerions();
  }, []);
  const getVerions = async () => {
    try {
      setIsLoading(true);
      const versions = await get(`/api/document/file/${fileId}/history`);
      setFileVerions(versions?.files || []);
      setValue("folder", versions?.files?.[0]?.folderName);
      setIsLoading(false);
    } catch (e) {
      setIsLoading(false);
      toast.error("Something went wrong while fetching file verions.");
      setFileVerions([]);
    }
  };
  const handleVersionSubmit = async (data) => {
    console.log("data", data);
  };
  return (
    <>
      {showPdfModal && (
        <PdfViewer
          showPdfModal={showPdfModal}
          setShowPdfModal={setShowPdfModal}
          selectedPdf={selectedPdf}
        />
      )}
      <Button onClick={handleOpen}>Version History</Button>
      <Dialog open={open} maxWidth="lg" fullWidth onClose={handleClose}>
        <form
          className="container-fluid"
          onSubmit={handleSubmit(handleVersionSubmit)}
        >
          <DialogTitle> Version History</DialogTitle>
          <DialogContent>
            <div className="row mb-2" style={{ height: "auto" }}>
              <div className="col-md-4">
                <label htmlFor="folder" name="folder">
                  Folder
                </label>
                <input
                  disabled
                  {...register("folder", {
                    required: {
                      value: true,
                      message: `${Validation.REQUIRED} folder `,
                    },
                  })}
                  type="text"
                  name="folder"
                  className="form-control"
                />
                {errors?.folder && (
                  <InputError
                    message={errors?.folder?.message}
                    key={errors?.folder?.message}
                  />
                )}
              </div>
              <div className="col-md-4">
                <label htmlFor="fileName" name="fileName">
                  File Name
                </label>
                <input
                  {...register("fileName", {
                    required: {
                      value: true,
                      message: `${Validation.REQUIRED} file name`,
                    },
                  })}
                  type="text"
                  name="fileName"
                  className="form-control"
                />
                {errors?.fileName && (
                  <InputError
                    message={errors?.fileName?.message}
                    key={errors?.fileName?.message}
                  />
                )}
              </div>
              <div className="col-md-4">
                <label htmlFor="fileUpload" name="fileUpload">
                  Upload New Version
                </label>
                <input
                  type="file"
                  {...register("fileUpload", {
                    required: {
                      value: true,
                      message: `Please select file`,
                    },
                  })}
                  name="fileUpload"
                  className="form-control"
                />
                {errors?.fileUpload && (
                  <InputError
                    message={errors?.fileUpload?.message}
                    key={errors?.fileUpload?.message}
                  />
                )}
              </div>
            </div>
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
                          <button
                            onClick={(e) => {
                              e?.preventDefault();
                              setShowPdfModal(true);
                              setSelectedPdf(file?.fileBlobUrl);
                            }}
                          >
                            <TextSnippetOutlinedIcon
                              style={{ color: "#384BD3" }}
                            />
                            <span className="p-3 cursor">{file?.name}</span>
                          </button>
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
                          <button
                            className="btn btn-sm boder-less"
                            onClick={(e) => {
                              e?.preventDefault();
                              setShowPdfModal(true);
                              setSelectedPdf(file?.fileBlobUrl);
                            }}
                          >
                            <i
                              className="fa fa-eye fa-2x"
                              aria-hidden="true"
                              size="md"
                            ></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </DialogContent>
          <DialogActions>
            <Button
              type="button"
              onClick={handleClose}
              className="bg-light text-primary"
            >
              Close
            </Button>
            <Button type="submit" className="bg-primary text-light">
              Save New Version
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};

export default VersionHistory;
