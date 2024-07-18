import React, { Fragment, useEffect, useState } from "react";
import { Button } from "@mui/material";
import { connect } from "react-redux";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { QRCodeSVG } from "qrcode.react";
import PrintIcon from '@mui/icons-material/Print';

const ShowQRCode = ({
  showAddModal,
  setShowAddModal,
  selectedAsset,
}) => {
  const handleOpen = () => setShowAddModal(true);
  const handleClose = () => setShowAddModal(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAsset, setCurrentAsset] = useState(false);
  useEffect(()=>{
    setCurrentAsset(selectedAsset);
  }, [selectedAsset])
  const handlePrint = () => {
    window.print();
  }
  return (
    <React.Fragment>
      <Dialog open={showAddModal} onClose={handleClose} maxWidth="lg" fullWidth>
          <DialogTitle>{currentAsset?.assetName} - Asset QR Code</DialogTitle>
          <DialogContent dividers>
            {!isLoading && (
              <Fragment>
                <div className="row">
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
              <Button onClick={handleClose} className="bg-light text-primary no-print-element">
                Cancel
              </Button>
              <Button onClick={() => handlePrint()} className="bg-primary text-light no-print-element">
              <PrintIcon /> Print
              </Button>
            </DialogActions>
          )}
      </Dialog>
    </React.Fragment>
  );
};

const mapStateToProps = () => ({});
export default connect(mapStateToProps, {})(ShowQRCode);
