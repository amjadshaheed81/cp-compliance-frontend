/**
 * Numbered Site Check History regression batches.
 *
 * New batches are added at the TOP of this array so the newest test is always
 * the first button shown in the developer test dialog.
 *
 * Device definitions mirror the exact asset filters used by the real forms.
 * They are test-only asset payloads and are created through the normal
 * PUT /api/site/{siteId}/assets endpoint.
 */
export const SITE_CHECK_HISTORY_TEST_BATCHES = [
  {
    number: 4,
    label: "Refuge Intercom / Sounder Audibility / Ventilation",
    testKeys: ["refuge-intercom", "fire-alarm-sounder", "ventilation"],
    devices: [
      {
        key: "refuge-intercom-device",
        testTypeKey: "refuge-intercom",
        label: "Refuge Intercom Outstation",
        category: "Electrical",
        subCategory: "Fire Alarm",
        subCategory2: "Disabled Refuge Outstation",
        subCategory3: "",
      },
      {
        key: "sounder-device",
        testTypeKey: "fire-alarm-sounder",
        label: "Fire Alarm Sounder",
        category: "Electrical",
        subCategory: "Fire Alarm",
        subCategory2: "Sounder",
        subCategory3: "",
      },
      {
        key: "ventilation-device",
        testTypeKey: "ventilation",
        label: "Heat Recovery Unit",
        category: "Mechanical",
        subCategory: "Ventilation",
        subCategory2: "Heat Recovery Unit",
        subCategory3: "",
      },
    ],
  },
  {
    number: 3,
    label: "Fire Damper / CCTV / Intruder Alarm",
    testKeys: ["fire-damper", "cctv", "intruder-alarm"],
    devices: [
      {
        key: "fire-damper-device",
        testTypeKey: "fire-damper",
        label: "Fire Damper",
        category: "Mechanical",
        subCategory: "Ventilation",
        subCategory2: "Damper",
        subCategory3: "Fire Damper",
        damperSize: 600,
      },
      {
        key: "cctv-device",
        testTypeKey: "cctv",
        label: "CCTV",
        category: "Electrical",
        subCategory: "CCTV",
        subCategory2: "",
        subCategory3: "",
      },
      {
        key: "intruder-alarm-device",
        testTypeKey: "intruder-alarm",
        label: "Intruder Alarm",
        category: "Electrical",
        subCategory: "Intruder Alarm Installation",
        subCategory2: "",
        subCategory3: "",
      },
    ],
  },
  {
    number: 2,
    label: "Microwave / Storage Tank / Water Heater",
    testKeys: ["microwave-oven", "storage-tank", "water-heater"],
    devices: [
      {
        key: "microwave-device",
        testTypeKey: "microwave-oven",
        label: "Microwave Oven",
        category: "Electrical",
        subCategory: "Small Appliances",
        // This spelling is intentional: it is the exact current form filter.
        subCategory2: "Microware",
        subCategory3: "",
      },
      {
        key: "storage-tank-device",
        testTypeKey: "storage-tank",
        label: "Cold Water Storage Tank",
        category: "Mechanical",
        subCategory: "Water Services",
        subCategory2: "Cold Water Storage Tank",
        subCategory3: "",
      },
      {
        key: "water-heater-device",
        testTypeKey: "water-heater",
        label: "Calorifier",
        category: "Mechanical",
        subCategory: "Water Services",
        subCategory2: "Calorifier",
        subCategory3: "",
      },
    ],
  },
  {
    number: 1,
    label: "Extract Fan / External Lighting / WC Alarm",
    testKeys: ["extract-fan", "external-lighting", "wc-alarm"],
    devices: [
      {
        key: "extract-fan-device",
        testTypeKey: "extract-fan",
        label: "Extract Fan",
        category: "Mechanical",
        subCategory: "Ventilation",
        subCategory2: "Extract Fan",
        subCategory3: "",
      },
      // External Lighting does not require an asset in the current form.
      {
        key: "wc-alarm-device",
        testTypeKey: "wc-alarm",
        label: "Disabled WC Alarm",
        category: "Electrical",
        subCategory: "Distress Alarm",
        subCategory2: "Disabled WC Alarm",
        subCategory3: "",
      },
    ],
  },
];

export const getSiteCheckHistoryTestBatch = (batchNumber) =>
  SITE_CHECK_HISTORY_TEST_BATCHES.find(
    (batch) => Number(batch.number) === Number(batchNumber)
  ) || null;
