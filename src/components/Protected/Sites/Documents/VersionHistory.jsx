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
import { get, put, uploadNewVersion } from "../../../../api";
import { toast } from "react-toastify";
import moment from "moment";
import CircularProgress from "@mui/material/CircularProgress";
import { useForm } from "react-hook-form";
import { Validation } from "../../../../Constant/Validation";
import { InputError } from "../../../common/InputError";
import PdfViewer from "./PdfViewer";
import { connect } from "react-redux";

const VersionHistory = ({
  versionHistory,
  setVersionHistory,
  fileId,
  siteSelectedForGlobal,
  loggedInUserData,
  refresh,
  isVersionModeEdit,
}) => {
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
      setValue("name", versions?.files?.[0]?.name?.split(".")?.[0]);
      setIsLoading(false);
    } catch (e) {
      setIsLoading(false);
      toast.error("Something went wrong while fetching file verions.");
      setFileVerions([]);
    }
  };
  const checkAndAddExpiryCalenderEvent = async (data, folderId) => {
    const body = {
      siteId: siteSelectedForGlobal?.siteId,
      startDate: moment(data?.expiryDate),
      endDate: moment(data?.expiryDate),
      shortText: "Document Expiring : " + data?.name,
      eventType: "Document Expring",
      userId: loggedInUserData?.id,
       section: `/subfolder/?id=${folderId}`
    };
    await put("/api/user/calendar", body);
  };
  const handleVersionSubmit = async (formData) => {

       
    
    try {
      const oldfileExtension = fileVerions?.[0]?.name?.split(".")?.pop();
      
      const fileExtension = formData?.fileUpload?.[0]?.name?.split(".")?.pop();
      if(oldfileExtension  !== fileExtension) {
        toast.error(
          "Please select a file with same file extension : "+ oldfileExtension
        );
        return;
      }
      setIsLoading(true);
      const data = {
        folderId: fileVerions?.[0]?.folderId,
        files: [
          {
            ...formData?.fileUpload[0],
            id: fileId,
            name: `${formData?.name}.${fileExtension}`,
            originalFileName: formData?.fileUpload?.[0]?.name,
            fileVersion: fileVerions?.length + 1,
            siteId: siteSelectedForGlobal?.siteId,
          },
        ],
      };
      submitFile(data, formData.fileUpload[0]);
      checkAndAddExpiryCalenderEvent(data?.files[0], data.folderId);
    } catch (e) {
      toast.error(
        "Something went wrong while adding new file. Please try again!!"
      );
      setIsLoading(false);
    }
  };
  const submitFile = async (data, fileUpload) => {
    setIsLoading(true);
    const reqData = {
      files: fileUpload,
      documentRequestString: {
        ...data,
      },
    };

    reqData.documentRequestString.folderId = fileVerions?.[0]?.folderId;
    reqData.documentRequestString.files[0].id = fileId;
    reqData.documentRequestString.files[0].issueDate = `${moment(
      new Date()
    ).format("YYYY-MM-DD")} 10:00:00`;
    reqData.documentRequestString.files[0].expiryDate = `${moment(new Date())
      .add(1, "years")
      .format("YYYY-MM-DD")} 10:00:00`;
    reqData.documentRequestString.files[0].uploaderUserId =
      loggedInUserData?.id || "";
    reqData.documentRequestString.files[0].reviewerUserId =
      loggedInUserData?.id || "";
    reqData.documentRequestString.files[0].referenceNumber =
      data.files[0].note || "";
      console.log("reqData", reqData);
    delete reqData.documentRequestString.files[0].folder;
    const url = `/api/document/file/newVersion/upload`;
    const formData = new FormData();
    formData.append("file", reqData.files);
    formData.append(
      "documentRequestString",
      JSON.stringify(reqData.documentRequestString)
    );
    try{
      await uploadNewVersion(url, formData);
      setIsLoading(false);
      toast.success("New Version uploaded successfully");
      refresh();
      handleClose();
    }catch(e){
      console.log(e);
      toast.error("Version is not uploaded!!");
      setIsLoading(false);
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
      <Button onClick={handleOpen}>Version History</Button>
      <Dialog open={open} maxWidth="lg" fullWidth onClose={handleClose}>
        <form
          className="container-fluid"
          onSubmit={handleSubmit(handleVersionSubmit)}
        >
          <DialogTitle> Version History</DialogTitle>
          <DialogContent>
            {isVersionModeEdit && (
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
                  <label htmlFor="name">File Name</label>
                  <input
                    {...register("name", {
                      required: {
                        value: true,
                        message: `${Validation.REQUIRED} file name`,
                      },
                    })}
                    type="text"
                    name="name"
                    className="form-control"
                  />
                  {errors?.name && (
                    <InputError
                      message={errors?.name?.message}
                      key={errors?.name?.message}
                    />
                  )}
                </div>
                <div className="col-md-4">
                  <label htmlFor="fileUpload" name="fileUpload">
                    Select New File
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
            )}
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
          </DialogContent>
          <DialogActions>
            <Button
              type="button"
              onClick={handleClose}
              className="bg-light text-primary"
            >
              Close
            </Button>
            {isVersionModeEdit && (
              <Button type="submit" className="bg-primary text-light">
                Save New Version
              </Button>
            )}
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};

const mapStateToProps = (state) => ({
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
  loggedInUserData: state.site.loggedInUserData,
});

export default connect(mapStateToProps, { })(VersionHistory);
