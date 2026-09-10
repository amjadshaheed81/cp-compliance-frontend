import {
  SITE_CHECK_TEST_TYPES,
  getSiteCheckTestType,
} from "./siteCheckTestTypes";

describe("Site Check developer test catalogue", () => {
  test("contains exactly the 21 confirmed routed inspection forms", () => {
    expect(SITE_CHECK_TEST_TYPES).toHaveLength(21);
    expect(new Set(SITE_CHECK_TEST_TYPES.map((item) => item.key)).size).toBe(21);
  });

  test("defaults to the real Air Conditioning Service route", () => {
    expect(getSiteCheckTestType("air-conditioning-service")).toMatchObject({
      type: "Inspection",
      subType: "Plant and Equipment Inspection",
      category: "Air Conditioning Service",
    });
  });

  test("keeps F-Gas aligned with normal Start New assignee behaviour", () => {
    expect(getSiteCheckTestType("air-conditioning-f-gas")).toMatchObject({
      category: "Air Conditioning F-Gas Report",
      requiresAssignees: false,
    });
  });
  test("contains the three current History regression routes", () => {
    expect(getSiteCheckTestType("extract-fan")).toMatchObject({
      type: "Inspection",
      subType: "Plant and Equipment Inspection",
      category: "Extract Fan Cleaning",
    });
    expect(getSiteCheckTestType("external-lighting")).toMatchObject({
      type: "Inspection",
      subType: "Electrical",
      category: "External Lighting Testing",
    });
    expect(getSiteCheckTestType("wc-alarm")).toMatchObject({
      type: "Inspection",
      subType: "Electrical",
      category: "WC Alarm Testing",
    });
  });

});
