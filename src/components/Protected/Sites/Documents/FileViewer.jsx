import React, { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();
export const options = {
    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
  };
const FileViewer = ({ fileUrl }) => {
  const [numPages, setNumPages] = useState();
  const [pageNumber, setPageNumber] = useState(1);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }
  // Get the file extension
  const fileExtension = fileUrl;
  console.log("fileUrl", fileUrl);
  // Determine the rendering logic based on the file extension
  if (fileExtension.includes("pdf")) {
    return (
      <div>
        <Document file={fileUrl} onLoadSuccess={onDocumentLoadSuccess} options={options} >
          <Page pageNumber={pageNumber} />
        </Document>
        <p>
          Page {pageNumber} of {numPages}
        </p>
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
