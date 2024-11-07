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

const TotalAction = ({ data }) => {
  // Count total duties identified, duties met, and duties not met
  const dutiesIdentified = data.filter((item) => item.required === true).length;
  const dutiesMet = data.filter((item) => item.status === "Passed").length;
  const dutiesNotMet = data.filter((item) => item.status === "Fail").length;

  // Prepare data for the chart
  const chartData = {
    labels: ["Duties Identified", "Duties Met", "Duties Not Met"],
    datasets: [
      {
        label: "Duties Summary",
        data: [dutiesIdentified, dutiesMet, dutiesNotMet],
        backgroundColor: [
          "rgba(255, 159, 64, 0.8)", // Duties Identified
          "rgba(75, 192, 192, 0.8)", // Duties Met
          "rgba(255, 99, 132, 0.8)", // Duties Not Met
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
        text: "Duties Status Analysis",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label;
            const value = context.raw;
            // Show additional information only for "Duties Met" label
            if (label === "Duties Met") {
              const tooltipText = [`${label}: ${value}`];
              
              // Add each subType and requirement for "Duties Met"
              data
                .filter((item) => item.status === "Passed")
                .forEach((item) => {
                  tooltipText.push(`• ${item.subType || ''} (${item.requirement})`);
                });

              return tooltipText; // Returning an array to display each line separately
            }else if (label === "Duties Not Met") {
              const tooltipText = [`${label}: ${value}`];
              
              // Add each subType and requirement for "Duties Met"
              data
                .filter((item) => item.status === "Fail")
                .forEach((item) => {
                  tooltipText.push(`• ${item.subType || ''} (${item.requirement})`);
                });

              return tooltipText; // Returning an array to display each line separately
            } else {
              return `${label}: ${value}`; // Default label for other categories
            }
          },
        },
      },
    },
  };

  return <Pie data={chartData} options={options} />;
};

export default TotalAction;
