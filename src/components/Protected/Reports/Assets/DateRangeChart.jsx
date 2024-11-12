// DateRangeChart.js
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

// Registering the components with Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const DateRangeChart = ({ data }) => {
  // Prepare data for Chart.js based on provided data
  const chartData = {
    labels: data?.map((entry) => entry?.x), // x-values for the labels
    datasets: [
      {
        label: "Total Cost of Purchases (£)",
        data: data?.map((entry) => entry?.y), // y-values for the dataset
        backgroundColor: "#3c50e0",
        borderColor: "#3c50e0",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: "top",
      },
      title: {
        display: true,
        text: "Fixed Assets Purchased in Selected Range",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `Total Cost: £${context.raw}`;
          },
        },
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
        beginAtZero: true,
        title: {
          display: true,
          text: "Total Cost (£)",
        },
        ticks: {
          precision: 0, // Ensure no decimals are shown
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

export default DateRangeChart;
