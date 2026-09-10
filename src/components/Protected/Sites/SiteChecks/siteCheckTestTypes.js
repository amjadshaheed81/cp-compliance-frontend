const FIRE_ALARM_MAIN_CATEGORIES = [
  "Fire Alarm - Weekly Call Point testing to meet BS5839",
  "Fire Alarm - monthly testing to meet BS5839",
  "Fire Alarm - 6 monthly testing to meet BS5839",
  "Fire Alarm - 12 monthly testing to meet BS5839",
];

const EMERGENCY_LIGHTING_CATEGORIES = [
  "Emergency Lighting - weekly testing to meet BS5266",
  "Emergency Lighting - monthly testing to meet BS5266",
  "Emergency Lighting - 6 monthly testing to meet BS5266",
  "Emergency Lighting (systems more than 3 years old) 12 monthly Full discharge testing",
];

/**
 * Developer test catalogue.
 *
 * Keep this list aligned with the confirmed Inspection routing conditions in
 * UpdateSiteCheck.jsx. It intentionally represents routed form types rather
 * than every inspection-looking JSX file in the source tree.
 *
 * categoryOptions is used only where one routed form legitimately handles
 * several current categories. The default category is chosen to match the
 * default 6-Monthly test recurrence where a 6-monthly category exists.
 */
export const SITE_CHECK_TEST_TYPES = [
  {
    key: "emergency-lighting",
    label: "Emergency Lighting",
    type: "Inspection",
    subType: "Emergency Lighting to meet BS5266",
    category: "Emergency Lighting - 6 monthly testing to meet BS5266",
    categoryOptions: EMERGENCY_LIGHTING_CATEGORIES,
  },
  {
    key: "external-lighting",
    label: "External Lighting Testing",
    type: "Inspection",
    subType: "Electrical",
    category: "External Lighting Testing",
  },
  {
    key: "microwave-oven",
    label: "Microwave Oven Testing",
    type: "Inspection",
    subType: "Electrical",
    category: "Microwave Oven Testing",
  },
  {
    key: "wc-alarm",
    label: "WC Alarm Testing",
    type: "Inspection",
    subType: "Electrical",
    category: "WC Alarm Testing",
  },
  {
    key: "fire-alarm-sounder",
    label: "Fire Alarm Sounder Audibility",
    type: "Inspection",
    subType: "Fire Alarm to meet BS5839",
    category: "Fire Alarm Sounder Audibilty",
  },
  {
    key: "refuge-intercom",
    label: "Refuge Intercom Testing & Inspection",
    type: "Inspection",
    subType: "Fire Alarm to meet BS5839",
    category: "Refuge Intercom Testing & Inspection",
  },
  {
    key: "fire-alarm",
    label: "Fire Alarm Inspection",
    type: "Inspection",
    subType: "Fire Alarm to meet BS5839",
    category: "Fire Alarm - 6 monthly testing to meet BS5839",
    categoryOptions: FIRE_ALARM_MAIN_CATEGORIES,
  },
  {
    key: "cctv",
    label: "CCTV Servicing & Inspection",
    type: "Inspection",
    subType: "Intruder Alarm",
    category: "CCTV Servicing & Inspection",
  },
  {
    key: "intruder-alarm",
    label: "Intruder Alarm Servicing & Inspection",
    type: "Inspection",
    subType: "Intruder Alarm",
    category: "Intruder Alarm Servicing & Inspection",
  },
  {
    key: "gas-boiler",
    label: "Boiler Service / Maintenance Checklist",
    type: "Inspection",
    subType: "Gas",
    category: "Boiler Service / Maintenance Checklist",
  },
  {
    key: "storage-tank",
    label: "Water - Visual Inspection of Storage Tank",
    type: "Inspection",
    subType: "Legionella",
    category: "Water - Visual Inspection of Storage Tank",
  },
  {
    key: "water-heater",
    label: "Water Heater Inspection & Service",
    type: "Inspection",
    subType: "Legionella",
    category: "Water Heater Inspection & Service",
  },
  {
    key: "water-chlorination",
    label: "Water - Storage System Chlorination",
    type: "Inspection",
    subType: "Legionella",
    category: "Water - Storage System Chlorination",
  },
  {
    key: "extract-fan",
    label: "Extract Fan Cleaning",
    type: "Inspection",
    subType: "Plant and Equipment Inspection",
    category: "Extract Fan Cleaning",
  },
  {
    key: "fire-damper",
    label: "Passive Fire - Fire Damper Inspection",
    type: "Inspection",
    subType: "Passive Fire",
    category: "Passive Fire - Fire Damper Inspection",
  },
  {
    key: "fire-extinguisher",
    label: "Fire Extinguisher Inspection & Service",
    type: "Inspection",
    subType: "Fire Fighting Equipment",
    category: "Fire Extinguisher Inspection & Service",
  },
  {
    key: "air-conditioning-service",
    label: "Air Conditioning Service",
    type: "Inspection",
    subType: "Plant and Equipment Inspection",
    category: "Air Conditioning Service",
  },
  {
    key: "air-conditioning-f-gas",
    label: "Air Conditioning F-Gas Report",
    type: "Inspection",
    subType: "Plant and Equipment Inspection",
    category: "Air Conditioning F-Gas Report",
    // Normal Start New currently hides Lead/Assistant for this category.
    requiresAssignees: false,
  },
  {
    key: "ventilation",
    label: "Ventilation System(s) Servicing",
    type: "Inspection",
    subType: "Plant and Equipment Inspection",
    category: "Ventilation System(s) Servicing",
  },
  {
    key: "gas-safety",
    label: "Gas Safety Annual Inspection",
    type: "Inspection",
    subType: "Gas",
    category: "Gas Safety Annual Inspection",
  },
  {
    key: "shower-head",
    label: "Periodic Shower Head Cleaning",
    type: "Inspection",
    subType: "Legionella",
    category: "Periodic Shower Head Cleaning",
  },
];

export const getSiteCheckTestType = (key) =>
  SITE_CHECK_TEST_TYPES.find((item) => item.key === key) || null;
