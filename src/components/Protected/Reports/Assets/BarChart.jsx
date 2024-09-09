// BarChart.js
import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Registering the components with Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const BarChart = ({ data }) => {
  // Combine all assetPATItems and count occurrences of patDate
  const dateCounts = {};

  data.forEach((asset) => {
    if (asset.assetPATItems) {
      asset.assetPATItems.forEach((item) => {
        const patDate = item.patDate?.split("T")?.[0]; // Extract the date part
        dateCounts[patDate] = (dateCounts[patDate] || 0) + 1;
      });
    }
  });

  // Prepare data for Chart.js
  const labels = Object.keys(dateCounts);
  const counts = Object.values(dateCounts);

  const chartData = {
    labels,
    datasets: [
      {
        label: "PAT Date Count",
        data: counts,
        backgroundColor: "#3c50e0",
        borderColor: "#3c50e0",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: "top",
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        beginAtZero: true,
      },
      y: {
        beginAtZero: true,
        precision: 0,
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

export default BarChart;
