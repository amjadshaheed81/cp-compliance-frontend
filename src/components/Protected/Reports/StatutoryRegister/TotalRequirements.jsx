import React from "react";
import ReactECharts from "echarts-for-react";

const TotalRequirements = ({ requirement, data }) => {
  // Filter statutory registers based on "required: true" and the specific requirement
  const statutoryRegisters = data
    .flatMap((site) =>
      site.statutoryRegisters.map((register) => ({
        ...register,
        siteName: site.siteName,
      }))
    )
    .filter(
      (register) => register.required && register.requirement === requirement
    );

  const dutiesMet = statutoryRegisters.filter(
    (item) => item.status === "Passed"
  ).length;
  const dutiesNotMet = statutoryRegisters.filter(
    (item) => item.status === "Fail"
  ).length;

  // Prepare options for the ECharts pie chart
  const options = {
    title: {
      text: `${
        dutiesMet + dutiesNotMet
      } Duties Status Analysis for Requirement: ${requirement}`,
      left: "center",
    },
    tooltip: {
      trigger: "item",
      formatter: (params) => {
        const { name, value } = params;
        const tooltipText = [`${name}: ${value}`];

        // Filter sites based on status for tooltip
        const filteredSites = statutoryRegisters.filter(
          (item) =>
            (name === "Duties Met" && item.status === "Passed") ||
            (name === "Duties Not Met" && item.status === "Fail")
        );

        // Add each site name to the tooltip
        filteredSites.forEach((item) => {
          tooltipText.push(
            `• ${item.siteName} (${item.subType || item.requirement})`
          );
        });

        return tooltipText.join("<br/>"); // Join for line-by-line display in tooltip
      },
    },
    legend: {
      orient: "vertical",
      left: "left",
    },
    color: [
      "#1E3A8A",
      "#2563EB",
      "#60A5FA",
      "#93C5FD",
      "#0A2540",
      "#0077B6",
      "#CAF0F8",
    ],
    series: [
      {
        name: "Duties Summary",
        type: "pie",
        radius: "50%",
        data: [
          { value: dutiesMet, name: `${dutiesMet} Duties Met` },
          { value: dutiesNotMet, name: `${dutiesNotMet} Duties Not Met` },
        ],
        color: ["#1E3A8A", "#2563EB"], // Custom colors for the chart
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
      },
    ],
  };

  return (
    <ReactECharts option={options} style={{ height: 400, width: "100%" }} />
  );
};

export default TotalRequirements;
