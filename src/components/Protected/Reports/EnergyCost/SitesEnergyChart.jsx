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

const SitesEnergyChart = ({ site1energyData, site2energyData, currentYear }) => {
  const processMonthlyReading = (data, year) => {
    const monthlyCosts = Array(12).fill(0);

    data?.forEach((item) => {
      item?.readingList?.forEach((item) => {
        const readingDate = new Date(item.readingDate);
        if (readingDate.getFullYear() === year) {
          const monthIndex = readingDate.getMonth();
          monthlyCosts[monthIndex] += item.readingValue;
        }
      });
    });

    return monthlyCosts;
  };

  // Process data for current year for both sites
  const site1CurrentYearCosts = processMonthlyReading(site1energyData, currentYear);
  const site2CurrentYearCosts = processMonthlyReading(site2energyData, currentYear);

  // Chart data configuration
  const data = {
    labels: [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ],
    datasets: [
      {
        label: `Site 1 (${currentYear})`,
        data: site1CurrentYearCosts,
        fill: true,
        backgroundColor: "rgba(39, 60, 117, 0.5)", // Dark blue with fill opacity
        borderColor: "rgba(39, 60, 117, 1)", // Dark blue border
      },
      {
        label: `Site 2 (${currentYear})`,
        data: site2CurrentYearCosts,
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
        text: `Energy Data for ${currentYear}`,
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

export default SitesEnergyChart;
