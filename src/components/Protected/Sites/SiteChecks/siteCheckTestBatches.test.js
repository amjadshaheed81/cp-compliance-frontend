import { SITE_CHECK_HISTORY_TEST_BATCHES } from "./siteCheckTestBatches";

describe("Site Check History regression batches", () => {
  test("keeps newest numbered batch first", () => {
    expect(SITE_CHECK_HISTORY_TEST_BATCHES.map((batch) => batch.number)).toEqual([
      3,
      2,
      1,
    ]);
  });

  test("contains three Site Checks per current batch", () => {
    SITE_CHECK_HISTORY_TEST_BATCHES.forEach((batch) => {
      expect(batch.testKeys).toHaveLength(3);
      expect(new Set(batch.testKeys).size).toBe(3);
    });
  });

  test("uses the exact current Batch 3 device filters", () => {
    const batch3 = SITE_CHECK_HISTORY_TEST_BATCHES[0];
    expect(batch3.devices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          testTypeKey: "fire-damper",
          category: "Mechanical",
          subCategory: "Ventilation",
          subCategory2: "Damper",
        }),
        expect.objectContaining({
          testTypeKey: "cctv",
          category: "Electrical",
          subCategory: "CCTV",
        }),
        expect.objectContaining({
          testTypeKey: "intruder-alarm",
          category: "Electrical",
          subCategory: "Intruder Alarm Installation",
        }),
      ])
    );
  });

  test("preserves the current Microwave taxonomy spelling", () => {
    const microwave = SITE_CHECK_HISTORY_TEST_BATCHES.flatMap(
      (batch) => batch.devices
    ).find((device) => device.testTypeKey === "microwave-oven");

    expect(microwave?.subCategory2).toBe("Microware");
  });
});
