import {
  buildWaterTemperaturePdfRows,
  downloadWaterTemperaturePdf,
  selectLatestSavedWaterOutlets,
} from "./waterTemperaturePdf";
import { jsPDF } from "jspdf";

jest.mock("jspdf", () => ({ jsPDF: jest.fn() }));

const saved = (assetId, r1Date, sortOrder, extra = {}) => ({
  assetId,
  r1Date,
  sortOrder,
  outletType: "Tap",
  temperature: "Hot",
  normalRunTime: "Normal",
  usageFrequency: "Daily",
  floor: "1",
  room: "2",
  reading1: 51,
  reading2: 54,
  reading3: 55,
  ...extra,
});

const mockDocument = () => {
  const calls = { texts: [], saved: [], pageAdds: 0, pages: 1 };
  const doc = {
    internal: { pageSize: { getWidth: () => 297, getHeight: () => 210 } },
    setFont: jest.fn(),
    setFontSize: jest.fn(),
    setFillColor: jest.fn(),
    setTextColor: jest.fn(),
    setDrawColor: jest.fn(),
    setLineWidth: jest.fn(),
    rect: jest.fn(),
    line: jest.fn(),
    splitTextToSize: jest.fn((text, width) => {
      const maxChars = Math.max(3, Math.floor(width / 1.25));
      const string = String(text);
      const lines = [];
      for (let i = 0; i < string.length; i += maxChars) {
        lines.push(string.slice(i, i + maxChars));
      }
      return lines.length ? lines : [""];
    }),
    text: jest.fn((value) => calls.texts.push(value)),
    addPage: jest.fn(() => { calls.pages += 1; calls.pageAdds += 1; }),
    getNumberOfPages: jest.fn(() => calls.pages),
    setPage: jest.fn(),
    save: jest.fn((value) => calls.saved.push(value)),
  };
  return { doc, calls };
};

describe("on-demand Water Temperature PDF", () => {
  test("selects latest saved record per asset and preserves outlet order", () => {
    const rows = [
      saved(11, "2026-02-01T09:00:00", 3),
      saved(22, "2026-03-01T09:00:00", 1),
      saved(11, "2026-04-01T09:00:00", 2, { reading1: 49 }),
      saved(null, "2026-10-01T09:00:00", 0),
    ];
    const selected = selectLatestSavedWaterOutlets(rows);
    expect(selected.map((row) => row.assetId)).toEqual([22, 11]);
    expect(selected[1].reading1).toBe(49);
  });

  test("maps every grid column, resolves location names and retains zero readings", () => {
    const rows = buildWaterTemperaturePdfRows(
      [saved(3, "2026-10-28T10:20:00", 1, { reading1: 0, reading3: null })],
      [{ assetId: 3, assetName: "Kitchen Tap", category: "Mechanical" }],
      [{ id: 1, nodeName: "First Floor" }, { id: 2, nodeName: "Kitchen" }]
    );
    expect(rows[0].cells).toEqual([
      "1", "3 - Kitchen Tap - Mechanical", "Tap", "Hot", "Normal", "Daily",
      "First Floor", "Kitchen", "28/10/2026", "0", "54", "-",
    ]);
    expect(rows[0].alertColumns).toEqual([9]);
  });

  test("downloads the current saved report without requiring a backend PDF endpoint", () => {
    const { doc, calls } = mockDocument();
    jsPDF.mockImplementation(() => doc);
    const file = downloadWaterTemperaturePdf({
      records: [saved(3, "2026-10-28T10:20:00", 1)],
      siteName: "Leicester", siteId: 471, checkId: 1911,
      generatedAt: new Date("2026-10-29T12:34:00Z"),
    });
    expect(jsPDF).toHaveBeenCalledWith("landscape", "mm", "a4");
    expect(file).toBe("Water_Temperature_Leicester_Check_1911_2026-10-29.pdf");
    expect(calls.saved).toEqual([file]);
    expect(calls.texts.some((text) => String(text).includes("WATER TEMPERATURE MONITORING"))).toBe(true);
    expect(calls.texts.some((text) => String(text).includes("29/10/2026"))).toBe(true);
  });

  test("repeats table headings and numbers pages for large sets of saved outlets", () => {
    const { doc, calls } = mockDocument();
    jsPDF.mockImplementation(() => doc);
    const records = Array.from({ length: 100 }, (_, i) =>
      saved(1000 + i, "2026-10-28T10:20:00", i + 1)
    );
    downloadWaterTemperaturePdf({ records, siteId: 471, checkId: 1911 });
    expect(calls.pageAdds).toBeGreaterThan(0);
    expect(doc.setPage).toHaveBeenCalledTimes(calls.pages);
    expect(calls.saved).toHaveLength(1);
  });

  test("rejects invalid data and does not create a blank PDF", () => {
    jsPDF.mockClear();
    expect(() => downloadWaterTemperaturePdf({ records: [] })).toThrow("No saved");
    expect(() => selectLatestSavedWaterOutlets({})).toThrow("must be a list");
    expect(jsPDF).not.toHaveBeenCalled();
  });
});
