import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register necessary components with Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const UserActionChart = ({ data, managerList }) => {
  // Extract unique user IDs for lead and assistant users and group statuses by user
  const userStatusCount = {};
  console.log("data", data);
  data.forEach(item => {
    const leadUserId = item.leadUserID;
    const assistantUserId = item.assistantUserID;
    const status = item.status;

    // Handle each user ID for status counting
    [leadUserId, assistantUserId].forEach(userId => {
      if (!userStatusCount[userId]) {
        userStatusCount[userId] = { open: 0, done: 0 };
      }
      userStatusCount[userId][status.toLowerCase()] += 1;
    });
  });

  // Prepare data for the chart
  const userIds = Object.keys(userStatusCount);
  const labels = userIds.map(userId => {
    const manager = managerList.find(manager => manager.id === parseInt(userId)); // Get manager by ID
    return manager ? manager.name : userId; // Use manager name or user ID if not found
  });

  const openCounts = userIds.map(userId => userStatusCount[userId].open);
  const doneCounts = userIds.map(userId => userStatusCount[userId].done);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Open',
        data: openCounts,
        backgroundColor: 'rgba(255, 99, 132, 0.8)', // Red color for "Open"
      },
      {
        label: 'Done',
        data: doneCounts,
        backgroundColor: 'rgba(75, 192, 192, 0.8)', // Green color for "Done"
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
        text: 'User Status Counts (Open and Done)',
      },
    },
    scales: {
      x: {
        stacked: true,
        title: {
          display: false,
          text: 'Users',
        },
      },
      y: {
        stacked: true,
        title: {
          display: false,
          text: 'Task Count',
        },
        beginAtZero: true,
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

export default UserActionChart;
