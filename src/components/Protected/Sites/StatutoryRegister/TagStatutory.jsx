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

const TagStatutory = ({ showModal, setShowModal, statutoryCategory, refresh, siteId }) => {
  const [open, setOpen] = useState(showModal);
  const [isLoading, setIsLoading] = useState(false);
  const [extension, setExtension] = useState("");
  const handleOpen = () => setShowModal(true);
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
      toast.warn("Please select folder or existing file to tag with statutory.");
    } else if (isFolderSelected) {
      const res = await get(
        `/api/document/parent/${selectedMandatoryFolder?.[0]?.id}/folders?siteId=${siteId}`
      );
      const files = res?.document?.files;
      if (files) {
        const fileIds = files?.map((item) => item.id);
        const url = `/api/document/tag-file`;
        const data = {
          fileIds: fileIds,
          statutoryCategoryId: Number(statutoryCategory?.id),
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
      const fileIds = selectedMandatoryFile?.map(itm => itm?.id);
      const url = `/api/document/tag-file`;
      const data = {
        fileIds: fileIds,
        statutoryCategoryId: Number(statutoryCategory?.id),
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
      <Dialog open={open} maxWidth="lg" fullWidth onClose={handleClose}>
        <DialogTitle>Tag Documents</DialogTitle>
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

export default TagStatutory;
