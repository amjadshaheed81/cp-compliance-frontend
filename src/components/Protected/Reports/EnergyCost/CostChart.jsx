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

const CostChart = ({ energyData }) => {
  // Helper function to process monthly cost data by year
  const processMonthlyCosts = (data, year) => {
    const monthlyCosts = Array(12).fill(0); // Initialize monthly costs with 0 for each month of the year

    data?.forEach((item) => {
      const fromDate = new Date(item.fromDate);
      const toDate = new Date(item.toDate);

      // Check if the cost is relevant for the specified year
      if (fromDate.getFullYear() === year || toDate.getFullYear() === year) {
        const monthIndex = fromDate.getMonth();
        monthlyCosts[monthIndex] += item.cost; // Accumulate cost for the month
      }
    });
    return monthlyCosts;
  };

  // Define years for cost comparison
  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;

  // Initialize arrays for accumulated costs
  let currentYearCosts = Array(12).fill(0);
  let lastYearCosts = Array(12).fill(0);

  // Accumulate costs for each energy item for current and last years
  energyData?.forEach((energyItem) => {
    const itemCurrentYearCosts = processMonthlyCosts(
      energyItem.costList,
      currentYear
    );
    const itemLastYearCosts = processMonthlyCosts(
      energyItem.costList,
      lastYear
    );

    // Sum across all energy items for each month
    currentYearCosts = currentYearCosts.map(
      (cost, index) => cost + itemCurrentYearCosts[index]
    );
    lastYearCosts = lastYearCosts.map(
      (cost, index) => cost + itemLastYearCosts[index]
    );
  });

  // Chart data configuration
  const data = {
    labels: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    datasets: [
      {
        label: `Current Year Cost (${currentYear})`,
        data: currentYearCosts,
        fill: false,
        backgroundColor: "rgba(75, 192, 192, 0.5)",
        borderColor: "rgba(75, 192, 192, 0.8)",
      },
      {
        label: `Last Year Cost (${lastYear})`,
        data: lastYearCosts,
        fill: false,
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        borderColor: "rgba(255, 99, 132, 0.8)",
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
        text: `Cost Comparison: ${currentYear} vs ${lastYear}`,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Month",
        },
      },
      y: {
        title: {
          display: true,
          text: "Cost (in USD)",
        },
        beginAtZero: true,
      },
    },
  };

  return <Line data={data} options={options} />;
};

export default CostChart;
