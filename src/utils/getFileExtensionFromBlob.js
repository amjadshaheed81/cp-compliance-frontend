export const getFileExtensionFromBlob = (blob) => {
  // Extract the MIME type from the Blob
  const mimeType = blob.type;

  // Define a mapping of common MIME types to file extensions
  const mimeToExtensionMap = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "application/pdf": "pdf",
    "text/plain": "txt",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "docx",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/zip": "zip",
    // Add more MIME types and their corresponding extensions as needed
  };

  // Get the file extension from the MIME type map
  const extension = mimeToExtensionMap[mimeType];

  // Return the extension or a default value if not found
  return extension || "unknown";
};
