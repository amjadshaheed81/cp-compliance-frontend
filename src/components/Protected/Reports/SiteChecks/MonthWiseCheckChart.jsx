import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import moment from 'moment';

// Register necessary components with Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const MonthWiseCheckChart = ({ data }) => {
  // Initialize a data structure to hold counts for each type by month
  const monthlyCounts = {};

  data.forEach(item => {
    const type = item.type;
    const monthYear = moment(item.startDate).format('YYYY-MM'); // Format: YYYY-MM

    // Initialize the structure if it doesn't exist
    if (!monthlyCounts[monthYear]) {
      monthlyCounts[monthYear] = { Audit: 0, Survey: 0, Assessment: 0, Inspection: 0 };
    }

    // Increment the count for the respective type
    if (monthlyCounts[monthYear][type] !== undefined) {
      monthlyCounts[monthYear][type] += 1;
    }
  });

  // Prepare data for the chart
  const labels = Object.keys(monthlyCounts).sort(); // Sort by month
  const auditCounts = labels.map(month => monthlyCounts[month].Audit);
  const surveyCounts = labels.map(month => monthlyCounts[month].Survey);
  const assessmentCounts = labels.map(month => monthlyCounts[month].Assessment);
  const inspectionCounts = labels.map(month => monthlyCounts[month].Inspection);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Audit',
        data: auditCounts,
        backgroundColor: 'rgba(255, 99, 132, 0.8)', // Red color for "Audit"
      },
      {
        label: 'Survey',
        data: surveyCounts,
        backgroundColor: 'rgba(54, 162, 235, 0.8)', // Blue color for "Survey"
      },
      {
        label: 'Assessment',
        data: assessmentCounts,
        backgroundColor: 'rgba(255, 206, 86, 0.8)', // Yellow color for "Assessment"
      },
      {
        label: 'Inspection',
        data: inspectionCounts,
        backgroundColor: 'rgba(75, 192, 192, 0.8)', // Green color for "Inspection"
      },
    ],
  };

  // Chart options configuration
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
        text: 'Monthly Check Counts by Type',
      },
    },
    scales: {
      x: {
        title: {
          display: false,
          text: 'Month',
        },
        stacked: true, // Enable stacking
      },
      y: {
        title: {
          display: false,
          text: 'Count',
        },
        beginAtZero: true,
        stacked: true, // Enable stacking
        ticks: {
          callback: function (value) {
            return Math.floor(value); // Remove decimals
          },
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

export default MonthWiseCheckChart;
