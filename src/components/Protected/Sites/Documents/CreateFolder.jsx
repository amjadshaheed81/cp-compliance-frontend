import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Box,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { post } from "../../../../api";
import { isAdminLogin } from "../../../../utils/isManagerAdminLogin";

const CreateFolder = ({
  showFolderModal,
  setShowFolderModal,
  folderId,
  folder2,
  refresh,
  siteId,
  loggedInUserData,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isShared, setIsShared] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const handleClose = () => {
    reset();
    setIsShared(false);
    setShowFolderModal(false);
  };

  const submitFolder = async (data) => {
    // Admin check for statutory folders
    if (
      folder2?.name === "Statutory Documents" &&
      !isAdminLogin(loggedInUserData)
    ) {
      toast.error("Only Admin can create folder in statutory");
      return;
    }

    const folderData = {
      folderName: data.folderName,
      parentFolderId: folderId,
      siteId: siteId,
      sharedFolder: isShared, // No need for Boolean() conversion
      isStatutoryRegister: folder2?.name === "Statutory Documents",
    };

    setIsLoading(true);

    post("/api/document/folder", folderData)
      .then(() => {
        toast.success("Folder created successfully!");
        handleClose();
        refresh();
      })
      .catch((error) => {
        console.error("Error creating folder:", error);
        if (error?.response?.data?.message === "Folder exists") {
          toast.error("Folder with same name already exists");
        } else {
          toast.error("Failed to create folder. Please try again.");
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <Dialog
      open={showFolderModal}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        component: "form",
        onSubmit: handleSubmit(submitFolder),
      }}
    >
      <DialogTitle>Create New Folder</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            fullWidth
            label="Folder Name"
            variant="outlined"
            {...register("folderName", {
              required: "Folder name is required",
              minLength: {
                value: 3,
                message: "Folder name must be at least 3 characters",
              },
              maxLength: {
                value: 50,
                message: "Folder name cannot exceed 50 characters",
              },
            })}
            error={!!errors.folderName}
            helperText={errors.folderName?.message}
            disabled={isLoading}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={isShared}
                onChange={(e) => setIsShared(e.target.checked)}
                color="primary"
              />
            }
            label="Default Folder (Visible to all users)"
            disabled={isLoading}
          />

          {isLoading && (
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <CircularProgress />
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={isLoading}>
          Create Folder
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateFolder;
