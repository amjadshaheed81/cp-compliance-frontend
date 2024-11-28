import React from "react";
import ReactECharts from "echarts-for-react";

const PieChartContracts = ({ data }) => {
  const processChartData = () => {
    const categoryBudget = {};

    data?.forEach((item) => {
      if (item?.status === "Active" && item?.budget) {
        const category = item?.category;
        categoryBudget[category] = (categoryBudget[category] || 0) + parseFloat(item.budget);
      }
    });

    return Object.entries(categoryBudget).map(([name, value]) => ({ name, value }));
  };

  const chartData = processChartData();

  const options = {
    title: {
      text: "Active Contract Costs",
      left: "center",
      top: "top",
    },
    tooltip: {
      trigger: "item",
      confine: true,
      formatter: "{a} <br/>{b}: £{c} ({d}%)",
    },
    color: ["#1E3A8A", "#2563EB", "#60A5FA", "#93C5FD", "#0A2540", "#0077B6", "#CAF0F8"],
    series: [
      {
        name: "Total Budget by Category",
        type: "pie",
        itemStyle: {
          shadowOffsetX: 0,
          shadowColor: "rgba(0, 0, 0, 0.5)",
        },
        label: {
          show: true,
          formatter: "{b}: £{c}",
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 20,
            shadowColor: "rgba(0, 0, 0, 0.8)",
          },
        },
        data: chartData,
      },
    ],
  };

  return <ReactECharts option={options} style={{ height: 400, width: "100%" }} />;
};

export default PieChartContracts;
