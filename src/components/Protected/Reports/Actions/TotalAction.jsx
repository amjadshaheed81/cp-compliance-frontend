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
  // Initialize counters
  let completedActions = 0;
  let reportedActions = 0;
  let reassessedActions = 0;

  // Loop through data to calculate totals based on status
  data?.forEach((item) => {
    if (item?.status === "Completed") {
      completedActions += 1;
    } else if (item?.status === "Reported") {
      reportedActions += 1;
    } else if (item?.status === "Reassessed") {
      reassessedActions += 1;
    }
  });

  // Prepare data for the chart
  const chartData = {
    labels: ["Completed", "Reported", "Reassessed"],
    datasets: [
      {
        label: "Actions",
        data: [completedActions, reportedActions, reassessedActions],
        backgroundColor: [
          "#1E3A8A",
          "#2563EB",
          "#60A5FA",
        ],
      },
    ],
  };

  // Chart options configuration
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Total Actions by Status",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const status = context.label;
            const count = context.raw;

            return `${status}: ${count} actions`;
          },
        },
      },
    },
  };

  return <Pie data={chartData} options={options} />;
};

export default TotalAction;
