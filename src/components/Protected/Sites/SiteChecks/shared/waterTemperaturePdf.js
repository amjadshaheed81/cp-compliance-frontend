import { jsPDF } from "jspdf";

/**
 * Match the Water Temperature grid: one latest saved row for each asset,
 * ordered by persisted outlet sort order. Each download uses a fresh GET,
 * never unsaved form state.
 */
export const selectLatestSavedWaterOutlets = (records = []) => {
  if (!Array.isArray(records)) {
    throw new Error("Water Temperature data must be a list.");
  }

  const latestByAsset = new Map();
  records.forEach((record) => {
    if (!record?.assetId) return;
    const assetKey = String(record.assetId);
    const existing = latestByAsset.get(assetKey);
    if (
      !existing ||
      new Date(record.r1Date).getTime() > new Date(existing.r1Date).getTime()
    ) {
      latestByAsset.set(assetKey, record);
    }
  });

  return [...latestByAsset.values()].sort(
    (a, b) => Number(a.sortOrder) - Number(b.sortOrder)
  );
};

const valueText = (value) => {
  if (value === undefined || value === null || String(value).trim() === "" || value === "null") {
    return "-";
  }
  return String(value);
};

const readingValueText = (value) => {
  if (value === undefined || value === null || value === "" || value === "null") return "";
  return String(value); // 0 is a valid reading.
};

const formatReadingDate = (value) => {
  if (!value) return "N/A";
  // Match the grid's DD-MM-YYYY format. Backend LocalDateTime values are
  // date-only for this report; do not shift dates between timezones.
  const isoDate = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDate) return `${isoDate[3]}-${isoDate[2]}-${isoDate[1]}`;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleDateString("en-GB", { timeZone: "Europe/London" }).replace(/\//g, "-");
};

const resolveLocation = (value, siteLayout = []) => {
  if (value === null || value === undefined || value === "null" || value === "") return "-";
  const node = siteLayout.find((item) => String(item.id) === String(value));
  return valueText(node?.nodeName || value);
};

/**
 * The PDF has the same NINE data columns as the grid. The three readings,
 * including their displayed dates, are stacked in one READINGS cell.
 * The grid's final action-buttons column is deliberately not printed.
 */
export const buildWaterTemperaturePdfRows = (records, siteAssets = [], siteLayout = []) => {
  const assetsById = new Map(siteAssets.map((asset) => [String(asset.assetId), asset]));
  return selectLatestSavedWaterOutlets(records).map((row) => {
    const asset = assetsById.get(String(row.assetId));
    const assetLabel = asset
      ? `${row.assetId} - ${valueText(asset.assetName)} - ${valueText(asset.category)}`
      : `${row.assetId} - ${valueText(row.assetName)}`;
    const isAlert = (reading) => {
      if (reading === null || reading === undefined || reading === "") return false;
      return (row.temperature === "Hot" && Number(reading) < 50) ||
        (row.temperature === "Cold" && Number(reading) > 20);
    };
    const testDate = formatReadingDate(row.r1Date);
    const readings = [row.reading1, row.reading2, row.reading3];
    return {
      cells: [
        valueText(row.sortOrder),
        assetLabel,
        valueText(row.outletType),
        valueText(row.temperature),
        valueText(row.normalRunTime),
        valueText(row.usageFrequency),
        resolveLocation(row.floor, siteLayout),
        resolveLocation(row.room, siteLayout),
      ],
      readings: readings.map((reading, index) =>
        `${["1st", "2nd", "3rd"][index]} : ${readingValueText(reading)} ${testDate === "N/A" ? "N/A" : `(${testDate})`}`
      ),
      alertReadings: readings.map(isAlert),
    };
  });
};

// A4 landscape, 10 mm margins: 297 - 20 = 277 mm total.
// Width proportions follow the grid rather than the old 12-column report.
const TABLE_COLUMNS = [
  { label: "ORDER", width: 12 },
  { label: "ASSET", width: 51 },
  { label: "OUTLET TYPE", width: 22 },
  { label: "TEMPERATURE", width: 24 },
  { label: "NORM RUN TIME", width: 27 },
  { label: "USAGE FREQUENCY", width: 24 },
  { label: "FLOOR", width: 23 },
  { label: "ROOM", width: 49 },
  { label: "READINGS", width: 45 },
];

const createReportFileName = (siteName, checkId, generatedAt) => {
  const safeSite = String(siteName || "site")
    .replace(/[^a-z0-9_-]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 45) || "site";
  const dateParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(generatedAt);
  const part = (type) => dateParts.find((item) => item.type === type)?.value;
  const date = `${part("year")}-${part("month")}-${part("day")}`;
  return `Water_Temperature_${safeSite}_Check_${checkId}_${date}.pdf`;
};

/**
 * Generate the grid-style A4 landscape PDF on demand in the browser.
 * No POST, PUT, document-storage request or inspection state update occurs.
 */
export const downloadWaterTemperaturePdf = ({
  records,
  siteName,
  siteId,
  checkId,
  siteAssets = [],
  siteLayout = [],
  generatedAt = new Date(),
}) => {
  const rows = buildWaterTemperaturePdfRows(records, siteAssets, siteLayout);
  if (rows.length === 0) throw new Error("No saved Water Temperature outlets are available.");

  const pdf = new jsPDF("landscape", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const footerY = pageHeight - 7;
  const bottomLimit = footerY - 6;
  const tableStart = 43;
  const headingHeight = 12;
  const cellPadding = 1.5;
  const lineHeight = 3.45;
  const readingGap = 0.6;
  const printedAt = generatedAt.toLocaleString("en-GB", {
    timeZone: "Europe/London", day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });

  const drawHeading = () => {
    pdf.setFillColor(28, 48, 70);
    pdf.rect(0, 0, pageWidth, 23, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(15);
    pdf.text("WATER TEMPERATURE MONITORING", margin, 13);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.text("Current saved readings - generated on demand", pageWidth - margin, 13, { align: "right" });

    pdf.setTextColor(43, 55, 70);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    const siteLine = `Site: ${valueText(siteName)}  (ID: ${valueText(siteId)})`;
    pdf.text(pdf.splitTextToSize(siteLine, 173)[0], margin, 31);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Site Check: ${valueText(checkId)}`, 184, 31);
    pdf.text(`Generated: ${printedAt}`, pageWidth - margin, 31, { align: "right" });
    pdf.setFontSize(8);
    pdf.text(`Latest saved reading for ${rows.length} outlet(s). Unsaved form edits are not included.`, margin, 38);

    // Use the same vivid blue table header as the on-screen grid.
    pdf.setFillColor(58, 78, 210);
    pdf.rect(margin, tableStart, pageWidth - 2 * margin, headingHeight, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.6);
    pdf.setDrawColor(218, 225, 231);
    pdf.setLineWidth(0.15);
    let x = margin;
    TABLE_COLUMNS.forEach((column, index) => {
      pdf.setTextColor(255, 255, 255);
      const lines = pdf.splitTextToSize(column.label, column.width - 2 * cellPadding);
      lines.forEach((line, lineIndex) => pdf.text(line, x + cellPadding, tableStart + 4 + lineIndex * 3.6));
      x += column.width;
      if (index < TABLE_COLUMNS.length - 1) pdf.line(x, tableStart, x, tableStart + headingHeight);
    });
    return tableStart + headingHeight;
  };

  let y = drawHeading();
  rows.forEach((row, rowIndex) => {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    const wrappedCells = row.cells.map((value, index) =>
      pdf.splitTextToSize(String(value), TABLE_COLUMNS[index].width - 2 * cellPadding)
    );
    const readingLines = row.readings.map((reading) =>
      pdf.splitTextToSize(reading, TABLE_COLUMNS[8].width - 2 * cellPadding)
    );
    const readingLineCount = readingLines.reduce((total, lines) => total + lines.length, 0);
    const rowHeight = Math.max(
      15,
      ...wrappedCells.map((lines) => 2 * cellPadding + lines.length * lineHeight),
      2 * cellPadding + readingLineCount * lineHeight + readingGap * 2
    );

    if (y + rowHeight > bottomLimit) {
      pdf.addPage();
      y = drawHeading();
    }

    pdf.setFillColor(...(rowIndex % 2 === 0 ? [248, 250, 252] : [255, 255, 255]));
    pdf.rect(margin, y, pageWidth - 2 * margin, rowHeight, "F");
    pdf.setDrawColor(218, 225, 231);
    pdf.setLineWidth(0.15);
    pdf.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);
    let x = margin;
    wrappedCells.forEach((lines, index) => {
      pdf.setTextColor(34, 46, 57);
      lines.forEach((line, lineIndex) =>
        pdf.text(line, x + cellPadding, y + 3.8 + lineIndex * lineHeight)
      );
      x += TABLE_COLUMNS[index].width;
      pdf.line(x, y, x, y + rowHeight);
    });
    let readingY = y + 3.8;
    readingLines.forEach((lines, index) => {
      pdf.setTextColor(...(row.alertReadings[index] ? [185, 37, 42] : [34, 46, 57]));
      lines.forEach((line) => {
        pdf.text(line, x + cellPadding, readingY);
        readingY += lineHeight;
      });
      readingY += readingGap;
    });
    y += rowHeight;
  });

  const totalPages = pdf.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    pdf.setPage(page);
    pdf.setDrawColor(218, 225, 231);
    pdf.line(margin, footerY - 3, pageWidth - margin, footerY - 3);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(90, 104, 116);
    pdf.text("Download snapshot of saved data - not a submitted inspection certificate", margin, footerY);
    pdf.text(`Page ${page} of ${totalPages}`, pageWidth - margin, footerY, { align: "right" });
  }

  const fileName = createReportFileName(siteName, checkId, generatedAt);
  pdf.save(fileName);
  return fileName;
};
