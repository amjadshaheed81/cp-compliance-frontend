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

const DateRangeChart = ({ data }) => {
  // Group asset names and counts by purchase date
  const dateCounts = {};

  data.forEach((asset) => {
    const purchaseDate = asset.purchaseDate?.split("T")[0]; // Extract the date part
    if (purchaseDate) {
      if (!dateCounts[purchaseDate]) {
        dateCounts[purchaseDate] = { count: 0, names: [] };
      }
      dateCounts[purchaseDate].count += 1;
      dateCounts[purchaseDate].names.push(asset.assetName); // Assuming asset has a 'name' property
    }
  });

  // Prepare data for Chart.js
  const labels = Object.keys(dateCounts);
  const counts = Object.values(dateCounts).map((entry) => entry.count);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Assets Purchased",
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
        display: true,
        text: "Fixed Assets Purchased in Date Range",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const date = context.label;
            const { count, names } = dateCounts[date];
            return [
              `Total Purchases: ${count}`,
              ...names.map(name => `• ${name}`), // Each name on a new line
            ];
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Purchase Date",
        },
      },
      y: {
        beginAtZero: true,
        precision: 0,
        title: {
          display: true,
          text: "Number of Purchases",
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

export default DateRangeChart;
