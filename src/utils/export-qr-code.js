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

  // Updated margins
  const marginLeft = 10;       // Left and right margins in mm (1 cm)
  const marginTop = 22;        // Top and bottom margins in mm

  // Adjusted label specifications
  const labelWidth = 46.75;    // Updated width of each label in mm to fit left and right margins perfectly
  const labelHeight = 21.2;    // Height of each label in mm remains the same
  const qrCodeSize = 18;       // Size of the QR code in mm
  const horizontalSpacing = 1; // Horizontal spacing between labels in mm
  const verticalSpacing = 1;   // Vertical spacing between labels in mm
  const labelsPerRow = 4;      // Number of labels per row
  const labelsPerColumn = 12;  // Number of labels per column (4 rows x 12 columns = 48 labels)

  // Set initial positions based on margins
  let currentX = marginLeft;
  let currentY = marginTop;

  // Loop through the selected items to generate QR codes
  for (const [index, element] of selectedItems.entries()) {
    const assetId = element?.assetId;
    const qrCodeUrl = `${window.location.origin}/#/view-asset?assetId=${assetId}`;

    // Generate QR code as a base64 image
    const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl, { width: qrCodeSize * 3.78 });

    // Draw the border with grey color, 2.5mm radius, and 0.5 line width
    doc.setDrawColor(169, 169, 169); // Set border color to grey (R, G, B)
    doc.setLineWidth(0.5);           // Set border line width
    doc.roundedRect(currentX, currentY, labelWidth, labelHeight, 2.5, 2.5); // Draw rounded border with 2.5mm radius

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

    // Move to the next row after reaching the number of labels per row
    if ((index + 1) % labelsPerRow === 0) {
      currentX = marginLeft;
      currentY += labelHeight + verticalSpacing;
    }

    // Add a new page if needed after filling 48 labels (4 rows * 12 columns)
    if ((index + 1) % (labelsPerRow * labelsPerColumn) === 0 && index + 1 !== selectedItems.length) {
      doc.addPage();
      currentX = marginLeft;
      currentY = marginTop;
    }
  }

  // Save the PDF
  doc.save("assets-qr-codes.pdf");
};
