import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const EnergyChart = ({ energyData, currentYear, previousYear }) => {
  const [chartData, setChartData] = useState(null);

  const processMonthlyReading = (data, year) => {
    const monthlyCosts = Array(12).fill(0);

    data?.forEach((item) => {
      const readingDate = new Date(item.readingDate);
      if (readingDate.getFullYear() === year) {
        const monthIndex = readingDate.getMonth();
        monthlyCosts[monthIndex] += item.consumption;
        //monthlyCosts[monthIndex] += item.readingValue;
      }
    });

    return monthlyCosts;
  };

  useEffect(() => {
    if (!energyData) return;

    const lastYear = previousYear;
    let currentYearCosts = Array(12).fill(0);
    let lastYearCosts = Array(12).fill(0);

    energyData.forEach((energyItem) => {
      energyItem.readingList.sort((a, b) => new Date(a.readingDate) - new Date(b.readingDate));
     
      energyItem.readingList.forEach((r,i)=>{
        r.consumption = i > 0 ? r.readingValue - energyItem.readingList[i-1].readingValue : r.readingValue;
      
      })
      console.log(' energyItem.readingList',  energyItem.readingList)
      const itemCurrentYearReading = processMonthlyReading(
        energyItem.readingList,
        currentYear
      );
      const itemLastYearReading = processMonthlyReading(
        energyItem.readingList,
        lastYear
      );

      currentYearCosts = currentYearCosts.map(
        (cost, index) => cost + itemCurrentYearReading[index]
      );
      lastYearCosts = lastYearCosts.map(
        (cost, index) => cost + itemLastYearReading[index]
      );
    });

    const data = {
      labels: [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ],
      datasets: [
        {
          label: `Current Year Energy Reading (${currentYear})`,
          data: currentYearCosts,
          fill: false,
          backgroundColor: "#1E3A8A",
          borderColor: "#1E3A8A",
        },
        {
          label: `Last Year Energy Reading (${lastYear})`,
          data: lastYearCosts,
          fill: false,
          backgroundColor: "#2563EB",
          borderColor: "#2563EB",
        },
      ],
    };

    setChartData(data);
  }, [energyData, currentYear, previousYear]); // Added dependencies

  if (!chartData) {
    return <div>Loading chart data...</div>; // Add loading state
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: `Energy Comparison: ${currentYear} vs ${previousYear}`,
      },
    },
    scales: {
      x: {
        title: {
          display: false,
        },
      },
      y: {
        title: {
          display: false,
        },
        beginAtZero: true,
      },
    },
  };

  return <Line data={chartData} options={options} />;
};

export default EnergyChart;