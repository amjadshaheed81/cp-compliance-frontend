import { SITE_CHECK_HISTORY_TEST_BATCHES } from "./siteCheckTestBatches";

describe("Site Check History regression batches", () => {
  test("keeps newest numbered batch first", () => {
    expect(SITE_CHECK_HISTORY_TEST_BATCHES.map((batch) => batch.number)).toEqual([
      6,
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

  test("uses the exact current Batch 6 device filters", () => {
    const batch6 = SITE_CHECK_HISTORY_TEST_BATCHES[0];
    expect(batch6.testKeys).toEqual([
      "emergency-lighting",
      "gas-boiler",
      "fire-extinguisher",
    ]);
    expect(batch6.devices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          testTypeKey: "emergency-lighting",
          category: "Electrical",
          subCategory: "Emergency Lighting Installation",
        }),
        expect.objectContaining({
          testTypeKey: "gas-boiler",
          category: "Mechanical",
          subCategory: "Central Heating",
          subCategory2: "Boiler",
        }),
        expect.objectContaining({
          testTypeKey: "fire-extinguisher",
          category: "Fire Fighting Equipment",
          subCategory: "Fire Extinguishers",
          subCategory2: "Foam Extinguisher 6 Litre",
        }),
      ])
    );
  });

  test("uses the exact current Batch 5 Shower Head device filter", () => {
    const batch5 = SITE_CHECK_HISTORY_TEST_BATCHES[1];
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
    const batch4 = SITE_CHECK_HISTORY_TEST_BATCHES[2];
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
    const batch3 = SITE_CHECK_HISTORY_TEST_BATCHES[3];
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
