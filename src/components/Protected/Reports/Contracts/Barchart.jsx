import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";

const BarChart = ({ data }) => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: "Total Budget of Active Contracts",
        data: [],
        backgroundColor: "#3c50e0",
        borderColor: "#3c50e0",
        borderWidth: 1,
      },
    ],
  });

  const [monthlyContracts, setMonthlyContracts] = useState({});

  useEffect(() => {
    processChartData();
  }, [data]);

  const processChartData = () => {
    const monthlyBudget = {};
    const contractsByMonth = {};

    data.forEach((item) => {
      if (item.status === "Active" && item.budget) {
        const startDate = new Date(item.startDate);
        const monthYear = `${startDate.toLocaleString("default", { month: "long" })} ${startDate.getFullYear()}`;

        if (!monthlyBudget[monthYear]) {
          monthlyBudget[monthYear] = 0;
          contractsByMonth[monthYear] = [];
        }
        monthlyBudget[monthYear] += parseFloat(item.budget);
        contractsByMonth[monthYear].push({
          name: item.summary,
          budget: parseFloat(item.budget),
        });
      }
    });

    const labels = Object.keys(monthlyBudget);
    const dataValues = Object.values(monthlyBudget);

    setChartData({
      labels: labels,
      datasets: [
        {
          label: "Total Budget of Active Contracts",
          data: dataValues,
          backgroundColor: "#3c50e0",
          borderColor: "#3c50e0",
          borderWidth: 1,
        },
      ],
    });
    setMonthlyContracts(contractsByMonth);
  };

  const options = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function (context) {
            const month = context.label;
            const contracts = monthlyContracts[month] || [];
          
            // Format each contract entry
            const details = contracts.map(contract => `• ${contract.name}: £${contract.budget.toFixed(2)}`);
          
            // Return an array where each item is a new line in the tooltip
            return [`Total: £${context.raw}`, ...details];
          },
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

export default BarChart;
