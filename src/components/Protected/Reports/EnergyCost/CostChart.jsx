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

const CostChart = ({ energyData, currentYear, previousYear }) => {
  // Helper function to process monthly cost data by year
  const processMonthlyCosts = (data, year) => {
    const monthlyCosts = Array(12).fill(0); // Initialize monthly costs with 0 for each month of the year

    data?.forEach((item) => {
      const toDate = new Date(item.toDate);

      // Check if the cost is relevant for the specified year
      if (toDate.getFullYear() === year) {
        const monthIndex = toDate.getMonth();
        monthlyCosts[monthIndex] += item.cost; // Accumulate cost for the month
      }
    });
    return monthlyCosts;
  };

  // Define years for cost comparison
  const lastYear = previousYear;

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
    currentYearCosts = currentYearCosts?.map(
      (cost, index) => cost + itemCurrentYearCosts[index]
    );
    lastYearCosts = lastYearCosts?.map(
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
        backgroundColor: "#1E3A8A",
        borderColor: "#1E3A8A",
      },
      {
        label: `Last Year Cost (${lastYear})`,
        data: lastYearCosts,
        fill: false,
        backgroundColor: "#2563EB",
        borderColor: "#2563EB",
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
        text: `Cost Comparison (Net of VAT): ${currentYear} vs ${lastYear}`,
      },
    },
    scales: {
      x: {
        title: {
          display: false,
          // text: "Month",
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

export default CostChart;
