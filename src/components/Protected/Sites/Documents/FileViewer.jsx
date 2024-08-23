import React, { useEffect } from "react";

const FileViewer = ({ fileUrl }) => {
  // Get the file extension
  const fileExtension = fileUrl.toLowerCase();

  useEffect(() => {
    if (fileExtension.includes("pdf")) {
      window.open(fileUrl, "_blank", "noopener,noreferrer");
    }
  }, [fileUrl, fileExtension]);

  if (fileExtension.includes("jpg") || fileExtension.includes("jpeg") || fileExtension.includes("png")) {
    return (
      <img
        src={fileUrl}
        alt="File content"
        style={{ width: "100%", height: "auto" }}
      />
    );
  } else if (fileExtension.includes("pdf")) {
    // Optionally, you could display a message or a link as a fallback
    return (
      <p>PDF is being opened in a new tab.</p>
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