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
  const processMonthlyConsumption = (data, year) => {
    const monthlyConsumption = Array(12).fill(0); // Initialize array to store aggregated monthly consumption

    data?.forEach((meter) => {
      // Filter and sort readings for the current meter
      const filteredReadings = meter?.readingList
        ?.filter((reading) => new Date(reading.readingDate).getFullYear() === year)
        ?.sort((a, b) => new Date(a.readingDate) - new Date(b.readingDate));

      // Calculate consumption for this meter and add to monthly totals
      for (let i = 1; i < filteredReadings.length; i++) {
        const currentReading = filteredReadings[i];
        const previousReading = filteredReadings[i - 1];

        const currentDate = new Date(currentReading.readingDate);
        const previousDate = new Date(previousReading.readingDate);

        // Ensure readings are in the same year and for consecutive months
        if (currentDate.getFullYear() === year) {
          const monthIndex = currentDate.getMonth();
          if (monthIndex > 0 && monthIndex < 12) {
            const consumption = currentReading.readingValue - previousReading.readingValue;
            monthlyConsumption[monthIndex] += consumption; // Aggregate consumption across meters
          }
        }
      }
    });

    return monthlyConsumption;
  };

  // Process data for current year for both sites
  const site1CurrentYearConsumption = processMonthlyConsumption(site1energyData, currentYear);
  const site2CurrentYearConsumption = processMonthlyConsumption(site2energyData, currentYear);

  // Chart data configuration
  const data = {
    labels: [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ],
    datasets: [
      {
        label: `Site 1 (${currentYear})`,
        data: site1CurrentYearConsumption,
        fill: true,
        backgroundColor: "rgba(39, 60, 117, 0.5)", // Dark blue with fill opacity
        borderColor: "rgba(39, 60, 117, 1)", // Dark blue border
      },
      {
        label: `Site 2 (${currentYear})`,
        data: site2CurrentYearConsumption,
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
        text: `Energy Consumption for ${currentYear}`,
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
