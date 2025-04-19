import React from "react";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register necessary components with Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const EnergyMetricsReport = ({ energyData, floorArea, currentYear }) => {
  // Helper function to process data by year
  const processYearlyData = (data, year) => {
    let totalCost = 0;
    let totalElectricityKwh = 0;
    let totalGasKwh = 0;

    data?.forEach((energyItem) => {
      // Process costs
      energyItem.costList?.forEach((costItem) => {
        const toDate = new Date(costItem.toDate);
        if (toDate.getFullYear() === year) {
          totalCost += costItem.cost || 0;
        }
      });

      // Process readings
      energyItem.readingList?.forEach((readingItem) => {
        const readingDate = new Date(readingItem.readingDate);
        if (readingDate.getFullYear() === year) {
          if (energyItem.budgetCategory === "Electricity") {
            totalElectricityKwh += readingItem.readingValue || 0;
          } else if (energyItem.budgetCategory === "Gas") {
            totalGasKwh += readingItem.readingValue || 0;
          }
        }
      });
    });

    // Calculate carbon footprint (kg CO2e)
    const carbonFootprint = totalElectricityKwh * 0.35 + totalGasKwh * 0.19;
    
    return {
      totalCost,
      totalElectricityKwh,
      totalGasKwh,
      carbonFootprint,
      costPerM2: floorArea ? totalCost / floorArea : 0,
      carbonPerM2: floorArea ? carbonFootprint / floorArea : 0,
    };
  };

  // Get data for current year
  const currentYearData = processYearlyData(energyData, currentYear);

  // Prepare data for charts
  const costComparisonData = {
    labels: ["Cost per m²"],
    datasets: [
      {
        label: `Current Year (${currentYear})`,
        data: [currentYearData.costPerM2],
        backgroundColor: "#3B82F6",
      },
    ],
  };

  const carbonFootprintData = {
    labels: ["Carbon Footprint per m² (kg CO2e)"],
    datasets: [
      {
        label: `Current Year (${currentYear})`,
        data: [currentYearData.carbonPerM2],
        backgroundColor: "#10B981",
      },
    ],
  };

  const consumptionData = {
    labels: ["Electricity (kWh)", "Gas (kWh)"],
    datasets: [
      {
        label: `Current Year (${currentYear})`,
        data: [currentYearData.totalElectricityKwh, currentYearData.totalGasKwh],
        backgroundColor: ["#6366F1", "#F59E0B"],
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Annual Energy Metrics",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Energy Cost per m²</h2>
        <Bar data={costComparisonData} options={options} />
        <div className="mt-4 text-sm text-gray-600">
          <p>
            Total Cost: £{currentYearData.totalCost.toLocaleString()} | Cost per m²: £
            {currentYearData.costPerM2.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Carbon Footprint per m²</h2>
        <Bar data={carbonFootprintData} options={options} />
        <div className="mt-4 text-sm text-gray-600">
          <p>
            Total Carbon Footprint: {currentYearData.carbonFootprint.toFixed(2)} kg CO2e | 
            Per m²: {currentYearData.carbonPerM2.toFixed(2)} kg CO2e
          </p>
          <p className="mt-1">
            (Electricity: {currentYearData.totalElectricityKwh.toFixed(2)} kWh × 0.35 + 
            Gas: {currentYearData.totalGasKwh.toFixed(2)} kWh × 0.19)
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Energy Consumption</h2>
        <Bar data={consumptionData} options={options} />
        <div className="mt-4 text-sm text-gray-600">
          <p>
            Total Electricity: {currentYearData.totalElectricityKwh.toFixed(2)} kWh | 
            Total Gas: {currentYearData.totalGasKwh.toFixed(2)} kWh
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnergyMetricsReport;