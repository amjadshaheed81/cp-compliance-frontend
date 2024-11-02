import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";

const BarChart = ({ data }) => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: "Total Budget of Active Contracts",
        data: [],
        backgroundColor: "#3c50e0",
        borderColor: "#3c50e0",
        borderWidth: 1,
      },
    ],
  });

  useEffect(() => {
    processChartData();
  }, [data]);

  const processChartData = () => {
    const monthlyBudget = {};

    data.forEach((item) => {
      if (item.status === "Active" && item.budget) {
        const startDate = new Date(item.startDate);
        const monthYear = `${startDate.toLocaleString("default", { month: "long" })} ${startDate.getFullYear()}`;

        if (!monthlyBudget[monthYear]) {
          monthlyBudget[monthYear] = 0;
        }
        monthlyBudget[monthYear] += parseFloat(item.budget);
      }
    });

    const labels = Object.keys(monthlyBudget);
    const dataValues = Object.values(monthlyBudget);

    setChartData({
      labels: labels,
      datasets: [
        {
          label: "Total Budget of Active Contracts",
          data: dataValues,
          backgroundColor: "#3c50e0",
          borderColor: "#3c50e0",
          borderWidth: 1,
        },
      ],
    });
  };

  const options = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

export default BarChart;
