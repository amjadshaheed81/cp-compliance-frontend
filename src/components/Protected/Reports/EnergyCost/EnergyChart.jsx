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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const EnergyChart = ({ energyData }) => {
  const processMonthlyReading = (data, year) => {
    const monthlyCosts = Array(12).fill(0);

    data?.forEach((item) => {
      const readingDate = new Date(item.readingDate);
      if (readingDate.getFullYear() === year) {
        const monthIndex = readingDate.getMonth();
        monthlyCosts[monthIndex] += item.readingValue;
      }
    });

    return monthlyCosts;
  };

  // Define the years for which we need data
  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;

  // Initialize cumulative rading for each year
  let currentYearCosts = Array(12).fill(0);
  let lastYearCosts = Array(12).fill(0);

  energyData?.forEach((energyItem) => {
    const itemCurrentYearReading = processMonthlyReading(
      energyItem.readingList,
      currentYear
    );
    const itemLastYearReading = processMonthlyReading(
      energyItem.readingList,
      lastYear
    );

    currentYearCosts = currentYearCosts.map(
      (cost, index) => cost + itemCurrentYearReading[index]
    );
    lastYearCosts = lastYearCosts.map(
      (cost, index) => cost + itemLastYearReading[index]
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

export default EnergyChart;
