import React from "react";
import ReactECharts from "echarts-for-react";

const TotalAction = ({ data }) => {
  // Initialize counters
  let completedActions = 0;
  let reportedActions = 0;
  let reassessedActions = 0;

  // Loop through data to calculate totals based on status
  data?.forEach((item) => {
    if (item?.status === "Completed") {
      completedActions += 1;
    } else if (item?.status === "Reported") {
      reportedActions += 1;
    } else if (item?.status === "Reassessed") {
      reassessedActions += 1;
    }
  });

  // Prepare options for the ECharts pie chart
  const options = {
    title: {
      text: `${completedActions + reportedActions + reassessedActions} Total Actions by Status`,
      left: "center",
    },
    tooltip: {
      trigger: "item",
      formatter: (params) => {
        const { name, value } = params;
        return `${name}: ${value} actions`;
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
          { value: completedActions, name: "Completed" },
          { value: reportedActions, name: "Reported" },
          { value: reassessedActions, name: "Reassessed" },
        ],
        color: ["#1E3A8A", "#2563EB", "#60A5FA"], // Custom colors for the chart
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

export default TotalAction;
