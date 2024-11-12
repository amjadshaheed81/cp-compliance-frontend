import React from "react";
import ReactECharts from "echarts-for-react";

const TotalSites = ({ open, close, sold }) => {
  // Prepare options for the ECharts pie chart
  const options = {
    title: {
      text: `${open + close + sold} Total Sites`,
      left: "center",
    },
    tooltip: {
      trigger: "item",
      formatter: (params) => {
        const { name, value } = params;
        return `${name}: ${value} sites`;
      },
    },
    legend: {
      orient: "vertical",
      left: "left",
    },
    color: ["#1E3A8A", "#2563EB", "#60A5FA"],
    series: [
      {
        name: "Sites",
        type: "pie",
        radius: "50%",
        data: [
          { value: open, name: "Open" },
          { value: close, name: "Close" },
          { value: sold, name: "Sold" },
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

  return (
    <ReactECharts option={options} style={{ height: 400, width: "100%" }} />
  );
};

export default TotalSites;
