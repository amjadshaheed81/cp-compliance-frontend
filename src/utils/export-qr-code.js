import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import { toast } from "react-toastify";

export const printMultipleSelectedAsset = async (selectedItems) => {
  console.log("selectedItems", selectedItems);
  if (!selectedItems || selectedItems.length === 0) {
    toast.warn("Please select asset to print.");
    return;
  }

  const doc = new jsPDF("p", "mm", "a4");
  const marginTop = 10;
  let currentHeight = marginTop;

  for (const element of selectedItems) {
    const assetName = element?.assetName || "Unknown Asset";
    const assetId = element?.assetId;
    const qrCodeUrl = `${window.location.origin}/#/view-asset?assetId=${assetId}`;

    // Generate QR code as a base64 image
    const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl, { width: 50 });

    // Add asset name
    doc.text(assetName, 10, currentHeight);

    // Add QR code image
    doc.addImage(qrCodeDataUrl, "PNG", 10, currentHeight + 10, 50, 50);

    // Adjust the height for the next element
    currentHeight += 70;

    // Add a page if needed
    if (currentHeight > 280) {
      doc.addPage();
      currentHeight = marginTop;
    }
  }

  // Save the PDF
  doc.save("assets-qr-code.pdf");
};
