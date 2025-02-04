import React from "react";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

// Register necessary components with Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  ArcElement,
  Tooltip,
  Legend
);

const TotalAction = ({ data, managerList }) => {
  // Initialize counters
  let outstandingActions = 0;
  let actionsCompleted = 0;
  let actionsRaised = 0;

  // Loop through data to calculate totals
  data?.forEach((item) => {
    const startDate = new Date(item.startDate);
    const dueDate = new Date(item.dueDate);

    // Calculate outstanding actions
    if (item.status === "Open") {
      outstandingActions += 1;
    }

    // Calculate actions completed (no time restriction)
    if (item.status === "Done") {
      actionsCompleted += 1;
    }

    // Calculate actions raised (no time restriction)
    if (startDate) {
      actionsRaised += 1;
    }
  });

  // Prepare data for the chart
  const chartData = {
    labels: [
      "Outstanding Actions",
      "Completed Actions",
      "Raised Actions",
    ],
    datasets: [
      {
        label: "Actions",
        data: [
          outstandingActions,
          actionsCompleted,
          actionsRaised,
        ],
        backgroundColor: [
          "rgba(255, 99, 132, 0.8)",
          "rgba(75, 192, 192, 0.8)",
          "rgba(54, 162, 235, 0.8)",
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
        text: "Total Actions Analysis",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const actionCount = context.raw;

            // Create an array to store all action details
            const actionDetails = data?.map(item => (
              `• ${item.type} (${item.subType}): ` +
              `Red ${item.riskScoreRed || 0}, Amber ${item.riskScoreAmber || 0}, ` +
              `Yellow ${item.riskScoreYellow || 0}, Green ${item.riskScoreGreen || 0}`
            ));

            return [`Total Actions: ${actionCount}`, ...actionDetails];
          },
        },
      },
    },
  };

  return <Pie data={chartData} options={options} />;
};

export default TotalAction;
