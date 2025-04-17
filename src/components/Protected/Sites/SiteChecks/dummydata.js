// src/components/SiteChecks/data.js
export const dummyInspectionData = {
  client: {
    name: "Unite the Union",
    address: "Unite House, 128 Theobold's Road, London, Holborn WC1X 8TN",
  },
  installation: {
    name: "Unite the Union",
    address: "2 Chantry Court, Forge Street, Crewe",
  },
  bsiData: {
    type: "Emergency Escape Lighting",
    mode: "Maintained",
    facilities: "Office Building",
    duration: "180", // minutes
  },
  inspectionChecks: [
    {
      label: "All luminaires and signs are present",
      checked: true,
      satisfactory: true,
      remarks: "All present and correct",
    },
    {
      label: "Test switches present, suitably sited and keys available",
      checked: true,
      satisfactory: true,
      remarks: "Keys stored in maintenance office",
    },
    {
      label: "Lenses and legends are clean, unpainted & undamaged",
      checked: true,
      satisfactory: false,
      remarks: "2 luminaires in corridor B have painted lenses",
    },
    {
      label:
        "Luminaires functioning correctly & have lasted the duration of the test",
      checked: true,
      satisfactory: false,
      remarks: "Unit in storage room failed after 90 minutes",
    },
    {
      label:
        "All luminaires switched over & charging LED's lit on completion of test",
      checked: true,
      satisfactory: true,
      remarks: "Except unit in storage room",
    },
  ],
  comments:
    "Emergency light in storage room (Unit #EL-2047) needs replacement - battery not holding charge. Luminaires in corridor B (Units #EL-3152 and #EL-3153) have been painted over and need cleaning.",
  inspector: {
    name: "Dan Worsley",
    position: "Engineer",
    signature: "",
    date: "20/04/2023",
  },
};
