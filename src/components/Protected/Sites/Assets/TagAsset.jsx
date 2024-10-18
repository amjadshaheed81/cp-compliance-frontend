import React, { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import MandatoryFolders from "../Contracts/MandatoryFolders";
import SelectMandatoryFile from "../Documents/File/SelectMandatoryFile";
import { toast } from "react-toastify";
import { get, put } from "../../../../api";
import PdfViewer from "../Documents/PdfViewer";
import moment from "moment";
import TextSnippetOutlinedIcon from "@mui/icons-material/TextSnippetOutlined";

const TagAsset = ({
  selectedAsset,
  showModal,
  setShowModal,
  assetId,
  refresh,
}) => {
  const [open, setOpen] = useState(showModal);
  const [isLoading, setIsLoading] = useState(false);
  const [extension, setExtension] = useState("");
  const handleOpen = () => setShowModal(true);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState("");
  const [selectedMandatoryFolder, setSelectedMandatoryFolder] = useState([]);
  const [selectedMandatoryFile, setSelectedMandatoryFile] = useState([]);
  const handleClose = () => {
    setShowModal(false);
    refresh();
  };
  const handleSave = async () => {
    const isFolderSelected = selectedMandatoryFolder?.length > 0;
    const isFileSelected = selectedMandatoryFile?.length > 0;
    if (!isFolderSelected && !isFileSelected) {
      toast.warn("Please select folder or existing file to tag with asset.");
    } else if (isFolderSelected) {
      const res = await get(
        `/api/document/parent/${selectedMandatoryFolder?.[0]?.id}/folders`
      );
      const files = res?.document?.files;
      if (files) {
        const fileIds = files?.map((item) => item.id);
        const url = `/api/document/tag-file`;
        const data = {
          fileIds: fileIds,
          assetId: Number(assetId),
        };
        const res = await put(url, data);
        if (res?.status === 200) {
          setIsLoading(false);
          toast.success("Files tags successfully.");
          handleClose();
          refresh();
        } else {
          setIsLoading(false);
          toast.error("Something went wrong while tagging files.");
          handleClose();
        }
      } else {
        setIsLoading(false);
        toast.warning("There is no files available in this document to tag.");
      }
    } else if (isFileSelected) {
      const fileId = selectedMandatoryFile[0]?.id;
      const url = `/api/document/tag-file`;
      const data = {
        fileId: fileId,
        assetId: Number(assetId),
      };
      const res = await put(url, data);
      if (res?.status === 200) {
        setIsLoading(false);
        toast.success("File tag successfully.");
        handleClose();
        refresh();
      } else {
        setIsLoading(false);
        toast.error("Something went wrong while tagging files.");
        handleClose();
      }
    }
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
      <Dialog open={open} maxWidth="lg" fullWidth onClose={handleClose}>
        <DialogTitle>Tag Assets</DialogTitle>
        <DialogContent>
          <div className="row">
            <div className="col-md-12">
              <MandatoryFolders
                isStatutory={false}
                isSingleFolderSelect={true}
                setSelectedMandatoryFolder={setSelectedMandatoryFolder}
                selectedMandatoryFolder={selectedMandatoryFolder}
              />
            </div>
            <div className="col-md-12">
              <SelectMandatoryFile
                isStatutory={false}
                setSelectedMandatoryFile={setSelectedMandatoryFile}
                selectedMandatoryFile={selectedMandatoryFile}
              />
            </div>
          </div>
          <div className="container-fluid">
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
                  {selectedAsset?.files?.map((file) => (
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
                        {file?.uploaderUserName ? file?.uploaderUserName : "--"}
                      </td>
                      <td>
                        {file?.expiryDate
                          ? moment(file?.expiryDate).format("DD/MM/YYYY")
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
          </div>
        </DialogContent>
        <DialogActions>
          {isLoading && (
            <Box sx={{ display: "flex" }}>
              <CircularProgress />
            </Box>
          )}
          {!isLoading && (
            <>
              {" "}
              <Button onClick={handleClose} className="bg-light text-primary">
                Close
              </Button>
              <Button onClick={handleSave} className="bg-primary text-light">
                Save
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TagAsset;
