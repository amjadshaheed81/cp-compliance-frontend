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

// Register necessary components with Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const TotalAction = ({ data, managerList }) => {
  const currentDate = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(currentDate.getFullYear() - 1);

  // Initialize counters
  let outstandingActions = 0;
  let actionsCompletedPast12Months = 0;
  let actionsRaisedPast12Months = 0;

  // Loop through data to calculate totals
  data.forEach((item) => {
    const startDate = new Date(item.startDate);
    const dueDate = new Date(item.dueDate);

    // Calculate outstanding actions
    if (item.status === "Open") {
      outstandingActions += 1;
    }

    // Calculate actions completed in the past 12 months
    if (
      item.status === "Done" &&
      dueDate >= oneYearAgo &&
      dueDate <= currentDate
    ) {
      actionsCompletedPast12Months += 1;
    }

    // Calculate actions raised in the past 12 months
    if (startDate >= oneYearAgo && startDate <= currentDate) {
      actionsRaisedPast12Months += 1;
    }
  });

  // Prepare data for the chart
  const chartData = {
    labels: [
      "Outstanding Actions",
      "Completed in Past 12 Months",
      "Raised in Past 12 Months",
    ],
    datasets: [
      {
        label: "Actions",
        data: [
          outstandingActions,
          actionsCompletedPast12Months,
          actionsRaisedPast12Months,
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
            // Get the current category's data count
            const categoryIndex = context.dataIndex;
            const actionCount = context.raw;

            // Create an array to store all action details
            const actionDetails = data.map(item => (
              `• ${item.type} (${item.subType}): ` +
              `Red ${item.riskScoreRed || 0}, Amber ${item.riskScoreAmber || 0}, ` +
              `Yellow ${item.riskScoreYellow || 0}, Green ${item.riskScoreGreen || 0}`
            ));

            // Prepend the total count to the action details
            return [`Total Actions: ${actionCount}`, ...actionDetails];
          },
        },
      },
    },
    scales: {
      x: {
        stacked: false,
        title: {
          display: false,
          text: "Categories",
        },
      },
      y: {
        stacked: false,
        title: {
          display: false,
          text: "Action Count",
        },
        beginAtZero: true,
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

export default TotalAction;
