// DateRangeChart.js
import React from "react";
import { Bar } from "react-chartjs-2";
import moment from "moment";
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

const DateRangeChart = ({ data, startDateRange, endDateRange }) => {
  // Define the current year as the default range if no date range is provided
  const defaultStart = moment().startOf("year");
  const defaultEnd = moment().endOf("year");

  const start = startDateRange ? moment(startDateRange) : defaultStart;
  const end = endDateRange ? moment(endDateRange) : defaultEnd;

  // Group asset data by month within the specified range
  const monthCounts = {};

  data?.forEach((asset) => {
    const purchaseDate = asset.purchaseDate?.split("T")[0];
    if (purchaseDate) {
      const purchaseMoment = moment(purchaseDate);
      if (purchaseMoment.isBetween(start, end, null, "[]")) {
        const monthLabel = purchaseMoment.format("YYYY-MM"); // Month format as "YYYY-MM"
        
        if (!monthCounts[monthLabel]) {
          monthCounts[monthLabel] = { count: 0, totalCost: 0, names: [] };
        }
        monthCounts[monthLabel].count += 1;
        monthCounts[monthLabel].totalCost += asset.cost || 0;
        monthCounts[monthLabel].names.push(`${asset.assetName} (£${asset.cost || 0})`);
      }
    }
  });

  // Sort the labels by month
  const sortedLabels = Object.keys(monthCounts).sort((a, b) => moment(a).diff(moment(b)));

  // Prepare data for Chart.js
  const counts = sortedLabels.map((label) => monthCounts[label].count);
  const costs = sortedLabels.map((label) => monthCounts[label].totalCost);

  const chartData = {
    labels: sortedLabels,
    datasets: [
      {
        label: "Number of Assets Purchased",
        data: counts,
        backgroundColor: "#3c50e0",
        borderColor: "#3c50e0",
        borderWidth: 1,
      },
      {
        label: "Total Cost of Purchases (£)",
        data: costs,
        backgroundColor: "#50e03c",
        borderColor: "#50e03c",
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
        text: `Fixed Assets Purchased${startDateRange || endDateRange ? " in Selected Range" : " This Year"}`,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const month = context.label;
            const { count, totalCost, names } = monthCounts[month];
            return [
              `Total Purchases: ${count}`,
              `Total Cost: £${totalCost}`,
              ...names.map(name => `• ${name}`),
            ];
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
          text: "Quantity / Cost",
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

export default DateRangeChart;
