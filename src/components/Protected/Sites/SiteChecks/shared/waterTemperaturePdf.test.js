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

describe("on-demand Water Temperature PDF with grid-matching layout", () => {
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

  test("matches nine grid columns, groups three dated readings and preserves zero", () => {
    const rows = buildWaterTemperaturePdfRows(
      [saved(3, "2026-10-09T10:20:00", 1, { temperature: "Mixer", reading1: 0, reading2: 40.4, reading3: null })],
      [{ assetId: 3, assetName: "Kitchen Tap", category: "Mechanical" }],
      [{ id: 1, nodeName: "First Floor" }, { id: 2, nodeName: "Kitchen" }]
    );
    expect(rows[0].cells).toEqual([
      "1", "3 - Kitchen Tap - Mechanical", "Tap", "Mixer", "Normal", "Daily",
      "First Floor", "Kitchen",
    ]);
    expect(rows[0].readings).toEqual([
      "1st : 0 (09-10-2026)",
      "2nd : 40.4 (09-10-2026)",
      "3rd :  (09-10-2026)",
    ]);
    expect(rows[0].alertReadings).toEqual([false, false, false]);
  });

  test("keeps per-reading Hot/Cold warnings and uses N/A without a date", () => {
    const [row] = buildWaterTemperaturePdfRows([
      saved(4, null, 1, { reading1: 0, reading2: 54, reading3: 49 }),
    ]);
    expect(row.readings).toEqual(["1st : 0 N/A", "2nd : 54 N/A", "3rd : 49 N/A"]);
    expect(row.alertReadings).toEqual([true, false, true]);
  });

  test("draws matching headings and one combined readings column", () => {
    const { doc, calls } = mockDocument();
    jsPDF.mockImplementation(() => doc);
    const file = downloadWaterTemperaturePdf({
      records: [saved(3, "2026-10-09T10:20:00", 1, { reading1: 40.4 })],
      siteName: "Newcastle", siteId: 296, checkId: 37,
      generatedAt: new Date("2026-10-29T12:34:00Z"),
    });
    expect(jsPDF).toHaveBeenCalledWith("landscape", "mm", "a4");
    expect(file).toBe("Water_Temperature_Newcastle_Check_37_2026-10-29.pdf");
    expect(calls.saved).toEqual([file]);
    expect(calls.texts).toEqual(expect.arrayContaining([
      "ORDER", "ASSET", "TEMPERATURE", "READINGS", "1st : 40.4 (09-10-2026)",
    ]));
    expect(calls.texts).not.toContain("Test date");
    expect(calls.texts).not.toContain("30s (C)");
    expect(calls.texts).not.toContain("60s (C)");
    expect(calls.texts).not.toContain("120s (C)");
  });

  test("repeats grid-style headings and page numbers for many outlets", () => {
    const { doc, calls } = mockDocument();
    jsPDF.mockImplementation(() => doc);
    const records = Array.from({ length: 100 }, (_, i) =>
      saved(1000 + i, "2026-10-09T10:20:00", i + 1)
    );
    downloadWaterTemperaturePdf({ records, siteId: 471, checkId: 1911 });
    expect(calls.pageAdds).toBeGreaterThan(0);
    expect(doc.setPage).toHaveBeenCalledTimes(calls.pages);
    expect(calls.texts.filter((line) => line === "READINGS")).toHaveLength(calls.pages);
    expect(calls.saved).toHaveLength(1);
  });

  test("rejects invalid data without producing a blank PDF", () => {
    jsPDF.mockClear();
    expect(() => downloadWaterTemperaturePdf({ records: [] })).toThrow("No saved");
    expect(() => selectLatestSavedWaterOutlets({})).toThrow("must be a list");
    expect(jsPDF).not.toHaveBeenCalled();
  });
});
