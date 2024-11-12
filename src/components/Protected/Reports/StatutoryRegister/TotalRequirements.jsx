import React from "react";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register necessary components with Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const TotalRequirements = ({ requirement, data }) => {
  // Filter statutory registers based on "required: true" and the specific requirement
  const statutoryRegisters = data
    .flatMap((site) => site.statutoryRegisters.map(register => ({
      ...register,
      siteName: site.siteName
    })))
    .filter((register) => register.required && register.requirement === requirement);

  const dutiesMet = statutoryRegisters.filter((item) => item.status === "Passed").length;
  const dutiesNotMet = statutoryRegisters.filter((item) => item.status === "Fail").length;

  // Prepare data for the chart
  const chartData = {
    labels: ["Duties Met", "Duties Not Met"],
    datasets: [
      {
        label: "Duties Summary",
        data: [dutiesMet, dutiesNotMet],
        backgroundColor: [
          "#1E3A8A", // Dark Blue for Duties Met
          "#2563EB", // Dark Red for Duties Not Met
        ],
        borderColor: [
          "#1E3A8A", // Dark Blue for Duties Met
          "#2563EB", // Dark Red for Duties Not Met
        ],
      },
    ],
  };

  // Chart options configuration with custom tooltip
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: `${dutiesMet + dutiesNotMet} Duties Status Analysis for Requirement: ${requirement}`,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label;
            const value = context.raw;
            const tooltipText = [`${label}: ${value}`];
            
            // Filter sites based on status for tooltip
            const filteredSites = statutoryRegisters
              .filter((item) => 
                (label === "Duties Met" && item.status === "Passed") ||
                (label === "Duties Not Met" && item.status === "Fail")
              );

            // Add each site name to the tooltip
            filteredSites.forEach((item) => {
              tooltipText.push(`• ${item.siteName} (${item.subType || item.requirement})`);
            });

            return tooltipText; // Return as an array for line-by-line display
          },
        },
      },
    },
  };

  return <Pie data={chartData} options={options} />;
};

export default TotalRequirements;
