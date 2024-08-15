import React from "react";

const FileViewer = ({ fileUrl }) => {
  // Get the file extension
  const fileExtension = fileUrl;
  if (fileExtension.includes("pdf")) {
    return (
      <div>
        <iframe src={fileUrl} height="500px" width="500px"></iframe>
      </div>
    );
  } else if (fileExtension.includes("jpg") || fileExtension.includes("png")) {
    return (
      <img
        src={fileUrl}
        alt="File content"
        style={{ width: "100%", height: "auto" }}
      />
    );
  } else {
    return (
      <p>
        Cannot display this file type. <a href={fileUrl}>Download the file</a>.
      </p>
    );
  }
};
export default FileViewer;
