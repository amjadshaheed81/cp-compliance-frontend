import React, { useEffect, useState } from "react";
import { Pie } from "react-chartjs-2";
import "chart.js/auto";

const PieChartContracts = ({ data }) => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: "Total Budget by Category",
        data: [],
        backgroundColor: [
          "#3c50e0", "#E64A19", "#388E3C", "#FFC107", "#8E24AA", "#00796B"
        ],
        borderColor: "#ffffff",
        borderWidth: 2,
      },
    ],
  });

  const [categoryDetails, setCategoryDetails] = useState({});

  useEffect(() => {
    processChartData();
  }, [data]);

  const processChartData = () => {
    const categoryBudget = {};
    const contractsByCategory = {};

    data?.forEach((item) => {
      if (item?.status === "Active" && item?.budget) {
        const category = item?.category;

        if (!categoryBudget[category]) {
          categoryBudget[category] = 0;
          contractsByCategory[category] = [];
        }
        categoryBudget[category] += parseFloat(item?.budget || 0);
        contractsByCategory[category].push({
          name: item?.summary,
          budget: parseFloat(item?.budget || 0),
        });
      }
    });

    setChartData({
      labels: Object.keys(categoryBudget),
      datasets: [
        {
          label: "Total Budget by Category",
          data: Object.values(categoryBudget),
          backgroundColor: [
            "#3c50e0", "#E64A19", "#388E3C", "#FFC107", "#8E24AA", "#00796B"
          ],
          borderColor: "#ffffff",
          borderWidth: 2,
        },
      ],
    });
    setCategoryDetails(contractsByCategory);
  };

  const options = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: "Active Contract Costs",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const category = context.label;
            const contracts = categoryDetails[category] || [];
            
            const details = contracts.map(
              (contract) => `• ${contract.name}: £${contract.budget.toFixed(2)}`
            );

            return [`Total: £${context.raw}`, ...details];
          },
        },
      },
    },
  };

  return <Pie data={chartData} options={options} />;
};

export default PieChartContracts;
