import React, { useEffect, useState } from "react";
import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
} from "@mui/material";
import { useForm } from "react-hook-form";
import CircularProgress from "@mui/material/CircularProgress";
import { put } from "../../../../api";
import { toast } from "react-toastify";

const EditDocument = ({
                          showEditDocumentModal,
                          setEditDocumentModal,
                          selectedFile,
                          refresh,
                      }) => {
    const [open, setOpen] = useState(showEditDocumentModal);
    const [extension, setExtension] = useState("");
    const handleOpen = () => setEditDocumentModal(true);
    const handleClose = () => setEditDocumentModal(false);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
        getValues,
        watch,
        setValue,
    } = useForm({});

    useEffect(() => {
        reset({
            fileName: selectedFile?.name || "", // Show the full name
            issueDate: selectedFile?.issueDate
                ? selectedFile?.issueDate?.split("T")?.[0]
                : "",
            expiryDate: selectedFile?.expiryDate
                ? selectedFile?.expiryDate?.split("T")?.[0]
                : "",
            note: selectedFile?.note ? selectedFile?.note : "",
        });
    }, [selectedFile, reset]);

    const submitEditDocument = async (data) => {
        const payload = {
            ...data,
            // fileName is already the full name from the form
            issueDate: data?.issueDate ? `${data?.issueDate}T10:00:00` : "",
            expiryDate: data?.expiryDate ? `${data?.expiryDate}T10:00:00` : "",
        };

        try {
            setIsLoading(true);
            const res = await put(`/api/document/file/${selectedFile?.id}`, payload);
            if (res?.status === 200) {
                toast.success("successfully file updated.");
                refresh();
                handleClose();
            } else {
                toast.error(
                    "File is not updated due to technical issue. Please try again."
                );
            }
            setIsLoading(false);
        } catch (e) {
            setIsLoading(false);
            toast.error(
                "File is not updated due to technical issue. Please try again."
            );
        }
    };



    return (
        <>
            <Dialog open={open} maxWidth="lg" fullWidth onClose={handleClose}>
                <form onSubmit={handleSubmit(submitEditDocument)}>
                    <DialogTitle>Edit Document</DialogTitle>
                    <DialogContent>
                        <div className="row" style={{ height: "auto" }}>
                            <div className="col-md-6">
                                <div className="form-group mt-2">
                                    <label for="assetName">File Name</label>
                                    <input
                                        type="text"
                                        autoComplete="off"
                                        readOnly
                                        onFocus={(e) => e.target.removeAttribute("readonly")}
                                        className="form-control"
                                        id="fileName"
                                        name="fileName"
                                        placeholder=""
                                        {...register("fileName")}
                                    />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-group mt-2">
                                    <label for="assetName">Issue Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        id="issueDate"
                                        name="issueDate"
                                        placeholder=""
                                        {...register("issueDate")}
                                    />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-group mt-2">
                                    <label for="assetName">Expiry Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        id="expiryDate"
                                        name="expiryDate"
                                        placeholder=""
                                        {...register("expiryDate")}
                                    />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-group mt-2">
                                    <label for="assetName">Note</label>
                                    <input
                                        type="textarea"
                                        className="form-control"
                                        id="note"
                                        name="note"
                                        placeholder=""
                                        {...register("note")}
                                    />
                                </div>
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
                                <Button
                                    type="button"
                                    onClick={handleClose}
                                    className="bg-light text-primary"
                                >
                                    Close
                                </Button>
                                <Button type="submit" className="bg-primary text-light">
                                    Save
                                </Button>
                            </>
                        )}
                    </DialogActions>
                </form>
            </Dialog>
        </>
    );
};

export default EditDocument;
