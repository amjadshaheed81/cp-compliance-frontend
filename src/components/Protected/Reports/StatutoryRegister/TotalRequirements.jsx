import React from "react";
import ReactECharts from "echarts-for-react";

const TotalRequirements = ({ requirement, data }) => {
  // Filter statutory registers based on "required: true" and the specific requirement
  const statutoryRegisters = data
    .flatMap((site) => site.statutoryRegisters.map((register) => ({
      ...register,
      siteName: site.siteName
    })))
    .filter((register) => register.required && register.requirement === requirement);

  const dutiesMet = statutoryRegisters.filter((item) => item.status === "Passed").length;
  const dutiesNotMet = statutoryRegisters.filter((item) => item.status === "Fail").length;

  const totalDuties = dutiesMet + dutiesNotMet;

  const options = {
    title: {
      text: totalDuties > 0 ? `${totalDuties} Duties Status Analysis for Requirement: ${requirement}` : `No duties for Requirement: ${requirement}`,
      left: "center",
    },
    tooltip: {
      trigger: "item",
      confine: true, // Ensures tooltip does not overflow the visible screen
      formatter: (params) => {
        const { name, value } = params;
        const tooltipText = [`<strong>${name}: ${value}</strong>`];
  
        // Filter sites based on status for tooltip
        const filteredSites = statutoryRegisters.filter((item) =>
          (name === "Duties Met" && item.status === "Passed") ||
          (name === "Duties Not Met" && item.status === "Fail")
        );
  
        // Add each site name to the tooltip
        filteredSites.forEach((item) => {
          tooltipText.push(`<span>• ${item.siteName} (${item.subType || item.requirement})</span>`);
        });
  
        // Wrap tooltip text in a grid layout for multiple columns
        return `
          <div style="
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
            gap: 0px;
            max-width: 100%;
            font-size: 10px;
            padding: 0px;

          ">
            ${tooltipText.join("")}
          </div>`;
      },
    },
    legend: {
      orient: "vertical",
      left: "left",
      data: ["Duties Met", "Duties Not Met"],
    },
    color: ["#1E3A8A", "#2563EB"],
    series: [
      {
        name: "Duties Summary",
        type: "pie",
        radius: "50%",
        data: [
          dutiesMet > 0 ? { value: dutiesMet, name: "Duties Met" } : null,
          dutiesNotMet > 0 ? { value: dutiesNotMet, name: "Duties Not Met" } : null,
        ].filter(Boolean),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
      },
    ],
    graphic: [
      {
        type: "text",
        left: "center",
        top: "center",
        style: {
          text: `Total: ${totalDuties}`,
          fill: "#000000",
          font: "20px Arial",
        },
      },
    ],
  };

  return <ReactECharts option={options} style={{ height: 400, width: "100%" }} />;
};

export default TotalRequirements;
