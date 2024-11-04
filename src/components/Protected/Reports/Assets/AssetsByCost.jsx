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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const AssetsByCost = ({ data, viewBy = "building" }) => {
  // Organize data based on the selected view (building, region, or all)
  const costByView = {};
  const dateByView = {};

  data.forEach((asset) => {
    const cost = parseFloat(asset.cost) || 0;
    const purchaseDate = asset.purchaseDate?.split("T")[0]; // Extract date part

    let key;
    if (viewBy === "building") {
      key = asset.siteName || "Unknown Building";
    } else if (viewBy === "region") {
      key = asset.region || "Unknown Region"; // Assuming a region field exists
    } else {
      key = "All Sites";
    }

    if (cost > 0) {
      costByView[key] = (costByView[key] || 0) + cost;
      dateByView[key] = dateByView[key] || purchaseDate; // Use the latest purchase date if needed
    }
  });

  // Prepare data for Chart.js
  const labels = Object.keys(costByView);
  const costs = Object.values(costByView);
  const dates = Object.values(dateByView); // Optional for additional information

  const chartData = {
    labels,
    datasets: [
      {
        label: "Total Asset Cost",
        data: costs,
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
        text: `Fixed Asset Value by ${viewBy.charAt(0).toUpperCase() + viewBy.slice(1)}`,
      },
      tooltip: {
        callbacks: {
          label: (context) => `Cost: $${context.raw.toLocaleString()}`,
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: viewBy === "building" ? "Building" : viewBy === "region" ? "Region" : "All Sites",
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Total Cost ($)",
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

export default AssetsByCost;
