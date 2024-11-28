import React from "react";
import ReactECharts from "echarts-for-react";
import { formatToNumber } from "../../../../utils/formatToCurrency";

const TotalAssetsPieChart = ({ general, doors, pat, pfp }) => {

  // Prepare options for the ECharts pie chart
  const options = {
    title: {
      text: `${formatToNumber(general + doors + pat + pfp)} Total Assets`,
      left: "center",
    },
    tooltip: {
      trigger: "item",
      formatter: (params) => {
        const { name, value } = params;
        return `${name}: ${value} assets`;
      },
    },
    legend: {
      orient: "vertical",
      left: "left",
    },
    color: ["#1E3A8A", "#2563EB", "#60A5FA", "#93C5FD", "#0A2540", "#0077B6", "#CAF0F8"],
    series: [
      {
        name: "Actions",
        type: "pie",
        radius: "50%",
        data: [
          { value: general, name: "General" },
          { value: doors, name: "Doors" },
          { value: pat, name: "PAT" },
          { value: pfp, name: "PFP" },
        ],
        color: ["#1E3A8A", "#2563EB", "#60A5FA", "#93C5FD"], // Custom colors for the chart
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

  return <ReactECharts option={options} style={{ height: 400, width: "100%" }} />;
};

export default TotalAssetsPieChart;
