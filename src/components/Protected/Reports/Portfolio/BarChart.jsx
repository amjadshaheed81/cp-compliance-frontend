// BarChart.js
import React from "react";
import { Bar } from "react-chartjs-2";
import "chart.js/auto"; // Import required for Chart.js to work correctly

const BarChart = ({ data }) => {
  // Extract site names and user counts from the data
  const siteNames = data.map((item) => item.siteName);
  const userCounts = data.map((item) => item.totalUsers);

  // Chart.js data configuration
  const chartData = {
    labels: siteNames,
    datasets: [
      {
        label: "Number of Users",
        data: userCounts,
        backgroundColor: "#3c50e0",
        borderColor: "#3c50e0",
        borderWidth: 1,
      },
    ],
  };

  // Chart.js options configuration
  const options = {
    responsive: true,
    scales: {
      yAxes: [
        {
          ticks: {
            beginAtZero: true, // Start y-axis at zero
          },
        },
      ],
    },
  };

  return <Bar data={chartData} options={options} />;
};

export default BarChart;
