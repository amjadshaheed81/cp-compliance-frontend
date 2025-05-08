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
import { formatToNumber } from "../../../../utils/formatToCurrency";

// Registering the components with Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ValuationBySite = ({ data }) => {
  // Prepare data for Chart.js based on provided data
  const chartData = {
    labels: data?.map((entry) => entry?.x), // x-values for the labels
    datasets: [
      {
        label: "Latest Assets Valuation by Building",
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
      // title: {
      //   display: true,
      //   text: "Fixed Assets Purchased",
      // },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `Total Current Valuation: £${formatToNumber(context.raw)}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Total Valuation (£)",
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

export default ValuationBySite;
