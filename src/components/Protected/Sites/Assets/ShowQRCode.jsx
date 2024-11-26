import React, { Fragment, useEffect, useState, useRef } from "react";
import { Button } from "@mui/material";
import { connect } from "react-redux";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { QRCodeSVG } from "qrcode.react";
import PrintIcon from "@mui/icons-material/Print";
import DownloadIcon from "@mui/icons-material/Download";

const ShowQRCode = ({ showAddModal, setShowAddModal, selectedAsset }) => {
  const handleOpen = () => setShowAddModal(true);
  const handleClose = () => setShowAddModal(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAsset, setCurrentAsset] = useState(false);
  useEffect(() => {
    setCurrentAsset(selectedAsset);
  }, [selectedAsset]);
  const handlePrint = () => {
    window.print();
  };
  const qrCodeRef = useRef();

  const handleDownload = (format = "png") => {
    const svgElement = qrCodeRef.current.querySelector("svg");
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
  
    const image = new Image();
    image.onload = () => {
      // Set canvas dimensions
      const textHeight = 50; // Height for the text
      const padding = 20; // Padding around QR code
      const canvasWidth = image.width + padding * 2;
      const canvasHeight = image.height + textHeight + padding * 2;
  
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
  
      // Clear the canvas
      ctx.fillStyle = "#fff"; // Set background color (white)
      ctx.fillRect(0, 0, canvas.width, canvas.height);
  
      // Draw the asset name
      ctx.fillStyle = "#000"; // Text color
      ctx.font = "bold 20px Arial"; // Font size and style
      ctx.textAlign = "center"; // Center-align the text
      ctx.fillText(
        currentAsset?.assetName || "Unnamed Asset",
        canvas.width / 2,
        textHeight / 2 + padding
      );
  
      // Draw the QR code centered
      const qrX = (canvas.width - image.width) / 2;
      const qrY = textHeight + padding;
      ctx.drawImage(image, qrX, qrY);
  
      // Trigger the download
      const link = document.createElement("a");
      link.download = `${currentAsset?.assetName || "qr-code"}.${format}`;
      link.href = canvas.toDataURL(`image/${format}`);
      link.click();
    };
  
    // Convert SVG to a base64-encoded image
    image.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };
  return (
    <React.Fragment>
      <Dialog open={showAddModal} onClose={handleClose} maxWidth="lg" fullWidth>
        <DialogTitle>{currentAsset?.assetName} - Asset QR Code</DialogTitle>
        <DialogContent dividers>
          {!isLoading && (
            <Fragment>
              <div className="row" ref={qrCodeRef}>
                <div className="col text-center">
                  <QRCodeSVG
                    value={`${window.location.origin}/#/view-asset?assetId=${currentAsset?.assetId}`}
                    style={{
                      height: "400px",
                      width: "300px",
                      margin: "0px 6px",
                    }}
                  />
                </div>
              </div>
            </Fragment>
          )}
        </DialogContent>
        {!isLoading && (
          <DialogActions>
            <Button
              onClick={handleClose}
              className="bg-light text-primary no-print-element"
            >
              Cancel
            </Button>
            <Button
              onClick={() => handlePrint()}
              className="bg-primary text-light no-print-element"
            >
              <PrintIcon /> Print
            </Button>
            <Button
              onClick={() => handleDownload()}
              className="bg-primary text-light no-print-element"
            >
              <DownloadIcon /> Download
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </React.Fragment>
  );
};

const mapStateToProps = () => ({});
export default connect(mapStateToProps, {})(ShowQRCode);
