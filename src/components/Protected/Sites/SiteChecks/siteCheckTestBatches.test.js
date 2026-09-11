import { SITE_CHECK_HISTORY_TEST_BATCHES } from "./siteCheckTestBatches";

describe("Site Check History regression batches", () => {
  test("keeps newest numbered batch first", () => {
    expect(SITE_CHECK_HISTORY_TEST_BATCHES.map((batch) => batch.number)).toEqual([
      5,
      4,
      3,
      2,
      1,
    ]);
  });

  test("contains unique Site Checks in every batch", () => {
    SITE_CHECK_HISTORY_TEST_BATCHES.forEach((batch) => {
      expect(batch.testKeys.length).toBeGreaterThan(0);
      expect(new Set(batch.testKeys).size).toBe(batch.testKeys.length);
    });
  });

  test("uses the exact current Batch 5 Shower Head device filter", () => {
    const batch5 = SITE_CHECK_HISTORY_TEST_BATCHES[0];
    expect(batch5.testKeys).toEqual(["water-chlorination", "shower-head"]);
    expect(batch5.devices).toEqual([
      expect.objectContaining({
        testTypeKey: "shower-head",
        category: "Mechanical",
        subCategory: "Water Services",
        subCategory2: "Outlet",
        subCategory3: "Shower",
      }),
    ]);
  });

  test("uses the exact current Batch 4 device filters", () => {
    const batch4 = SITE_CHECK_HISTORY_TEST_BATCHES[1];
    expect(batch4.devices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          testTypeKey: "refuge-intercom",
          category: "Electrical",
          subCategory: "Fire Alarm",
          subCategory2: "Disabled Refuge Outstation",
        }),
        expect.objectContaining({
          testTypeKey: "fire-alarm-sounder",
          category: "Electrical",
          subCategory: "Fire Alarm",
          subCategory2: "Sounder",
        }),
        expect.objectContaining({
          testTypeKey: "ventilation",
          category: "Mechanical",
          subCategory: "Ventilation",
          subCategory2: "Heat Recovery Unit",
        }),
      ])
    );
  });

  test("uses the exact current Batch 3 device filters", () => {
    const batch3 = SITE_CHECK_HISTORY_TEST_BATCHES[2];
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
