import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import { toast } from "react-toastify";

export const printMultipleSelectedAsset = async (selectedItems) => {
  if (!selectedItems || selectedItems.length === 0) {
    toast.warn("Please select assets to print.");
    return;
  }

  const doc = new jsPDF("p", "mm", "a4");
  const labelWidth = 45;  // width of each label in mm
  const labelHeight = 21; // height of each label in mm
  const qrCodeSize = 20;  // size of the QR code in mm
  const marginLeft = 5;   // left margin for the first label
  const marginTop = 5;    // top margin for the first label
  const horizontalSpacing = 2; // horizontal spacing between labels
  const verticalSpacing = 2;   // vertical spacing between labels
  const labelsPerRow = 4; // Number of labels per row

  let currentX = marginLeft;
  let currentY = marginTop;

  for (const [index, element] of selectedItems.entries()) {
    const assetName = element?.assetName || "Unknown Asset";
    const assetId = element?.assetId;
    const qrCodeUrl = `${window.location.origin}/#/view-asset?assetId=${assetId}`;

    // Generate QR code as a base64 image
    const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl, { width: qrCodeSize * 3.78 });

    // Add asset name above the QR code
    doc.setFontSize(8);
    doc.text(assetName, currentX, currentY + 8);

    // Add QR code image below the asset name
    doc.addImage(qrCodeDataUrl, "PNG", currentX + 12.5, currentY + 10, qrCodeSize, qrCodeSize);

    // Adjust the position for the next label
    currentX += labelWidth + horizontalSpacing;

    // Move to the next row after 4 labels (labelsPerRow)
    if ((index + 1) % labelsPerRow === 0) {
      currentX = marginLeft;
      currentY += labelHeight + verticalSpacing;
    }

    // Add a new page if needed
    if ((index + 1) % 48 === 0 && index + 1 !== selectedItems.length) {
      doc.addPage();
      currentX = marginLeft;
      currentY = marginTop;
    }
  }

  // Save the PDF
  doc.save("assets-qr-codes.pdf");
};
