import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register necessary components with Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const SitesCostChart = ({ site1energyData, site2energyData, currentYear, budgetCategoryForompare }) => {
  console.log("site1energyData", site1energyData);
  // Helper function to process monthly cost data by year, with optional budget category filtering
  const processMonthlyCosts = (data, year, budgetCategory) => {
    const monthlyCosts = Array(12).fill(0); // Initialize monthly costs with 0 for each month of the year

    data?.forEach((energyItem) => {
      // Check if budget category is required and matches
      if (!budgetCategory || energyItem.budgetCategory === budgetCategory) {
        energyItem?.costList?.forEach((item) => {
          const toDate = new Date(item.toDate);

          // Check if the cost is relevant for the specified year
          if (toDate.getFullYear() === year) {
            const monthIndex = toDate.getMonth();
            monthlyCosts[monthIndex] += item.cost; // Accumulate cost for the month
          }
        });
      }
    });

    return monthlyCosts;
  };

  // Process costs for the specified year for each site, with optional budget category filtering
  const site1Costs = processMonthlyCosts(site1energyData, currentYear, budgetCategoryForompare);
  const site2Costs = processMonthlyCosts(site2energyData, currentYear, budgetCategoryForompare);

  // Chart data configuration with darker colors and fill
  const data = {
    labels: [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ],
    datasets: [
      {
        label: `Site 1 Cost (${currentYear})`,
        data: site1Costs,
        fill: true,
        backgroundColor: "rgba(39, 60, 117, 0.5)", // Dark blue with fill opacity
        borderColor: "rgba(39, 60, 117, 1)", // Dark blue border
      },
      {
        label: `Site 2 Cost (${currentYear})`,
        data: site2Costs,
        fill: true,
        backgroundColor: "rgba(44, 62, 80, 0.5)", // Dark gray with fill opacity
        borderColor: "rgba(44, 62, 80, 1)", // Dark gray border
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: `Cost Comparison for ${currentYear}`,
      },
    },
    scales: {
      x: {
        title: {
          display: false,
        },
      },
      y: {
        title: {
          display: false,
        },
        beginAtZero: true,
      },
    },
  };

  return <Line data={data} options={options} />;
};

export default SitesCostChart;
