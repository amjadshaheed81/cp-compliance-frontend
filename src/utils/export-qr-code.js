import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import { toast } from "react-toastify";

export const printMultipleSelectedAsset = async (selectedItems) => {
  if (!selectedItems || selectedItems.length === 0) {
    toast.warn("Please select assets to print.");
    return;
  }

  // Create a new jsPDF document with A4 size
  const doc = new jsPDF("p", "mm", "a4");

  // Avery label specifications with custom adjustments
  const labelWidth = 45;      // Adjusted width of each label in mm
  const labelHeight = 45;     // Adjusted height of each label in mm
  const qrCodeSize = 30;      // Size of the QR code in mm
  const marginLeft = 10;      // Left margin of the page in mm
  const marginTop = 15;       // Top margin of the page in mm
  const horizontalSpacing = 5; // Horizontal spacing between QR codes
  const verticalSpacing = 5;   // Vertical spacing between QR codes
  const labelsPerRow = 4;     // Number of labels per row

  let currentX = marginLeft;
  let currentY = marginTop;

  // Loop through the selected items to generate QR codes
  for (const [index, element] of selectedItems.entries()) {
    const assetId = element?.assetId;
    const qrCodeUrl = `${window.location.origin}/#/view-asset?assetId=${assetId}`;

    // Generate QR code as a base64 image
    const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl, { width: qrCodeSize * 3.78 });

    // Draw the border with grey color, 10px radius, and 0.2 line width
    doc.setDrawColor(169, 169, 169); // Set border color to grey (R, G, B)
    doc.setLineWidth(0.5);           // Set border line width
    doc.roundedRect(currentX, currentY, labelWidth, labelHeight, 2.5, 2.5); // Draw rounded border with 10px (2.5mm) radius

    // Add QR code image centered inside the label
    doc.addImage(
      qrCodeDataUrl,
      "PNG",
      currentX + (labelWidth - qrCodeSize) / 2,
      currentY + (labelHeight - qrCodeSize) / 2,
      qrCodeSize,
      qrCodeSize
    );

    // Adjust the position for the next QR code
    currentX += labelWidth + horizontalSpacing;

    // Move to the next row after 4 QR codes (labelsPerRow)
    if ((index + 1) % labelsPerRow === 0) {
      currentX = marginLeft;
      currentY += labelHeight + verticalSpacing;
    }

    // Add a new page if needed
    if ((index + 1) % (labelsPerRow * 7) === 0 && index + 1 !== selectedItems.length) {
      doc.addPage();
      currentX = marginLeft;
      currentY = marginTop;
    }
  }

  // Save the PDF
  doc.save("assets-qr-codes.pdf");
};
