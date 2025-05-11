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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const EnergyMetricsReport = ({ energyData, floorArea, currentYear }) => {
  // Conversion factor for gas (M³ to kWh)
  const convertGasToKWh = (volumeInM3) => {
    const calorificValue = 11.1868; // MJ/m³ (adjust based on your gas supply)
    // const conversionFactor = 3.6; // MJ to kWh conversion
    return volumeInM3 * calorificValue;
  };

  // Process data for the selected year
  const processYearlyData = (data, year) => {
    let metrics = {
      totalCost: 0,
      totalElectricityKwh: 0,
      totalGasKwh: 0,
      carbonFootprint: 0,
      monthlyData: Array(12)
        .fill()
        .map(() => ({
          electricity: 0,
          gas: 0,
          cost: 0,
        })),
    };

    data?.forEach((energyItem) => {
      // Process costs by month
      energyItem.costList?.forEach((costItem) => {
        const costDate = new Date(costItem.toDate);
        if (costDate.getFullYear() === year) {
          const month = costDate.getMonth();
          metrics.monthlyData[month].cost += costItem.cost || 0;
          metrics.totalCost += costItem.cost || 0;
        }
      });

      // Process readings - using actual consumption
      const sortedReadings = [...(energyItem.readingList || [])].sort(
        (a, b) => new Date(a.readingDate) - new Date(b.readingDate)
      );

      for (let i = 1; i < sortedReadings.length; i++) {
        const current = sortedReadings[i];
        const previous = sortedReadings[i - 1];
        const readingDate = new Date(current.readingDate);

        if (readingDate.getFullYear() === year) {
          const month = readingDate.getMonth();
          //console.log("current", current);
          //console.log("previous", previous);
          let consumption = 0;
          // if (current.readingValue < previous.readingValue) {
          //   consumption = current.readingValue + previous.readingValue;
          // } else {
          //   consumption = current.readingValue - previous.readingValue;
          // }

          let consumptionKwh = consumption;

          if (energyItem.budgetCategory === "Electricity") {
            consumptionKwh = current.readingValue;
            metrics.totalElectricityKwh += consumptionKwh;
            metrics.monthlyData[month].electricity += consumptionKwh;
          } else if (energyItem.budgetCategory === "Gas") {
            consumptionKwh = current.readingValue - previous.readingValue;
            //console.log('consumptionKwh', consumptionKwh)

            consumptionKwh =
              current.readingUnit && current.readingUnit.toUpperCase() === "M3"
                ? convertGasToKWh(consumptionKwh)
                : consumptionKwh;
            metrics.totalGasKwh += consumptionKwh;
            metrics.monthlyData[month].gas += consumptionKwh;
          }
        }
      }
    });

    // Calculate carbon footprint (kg CO2e)
    metrics.carbonFootprint =
      metrics.totalElectricityKwh * 0.35 + metrics.totalGasKwh * 0.19;

    // Calculate per m² values
    if (floorArea && floorArea > 0) {
      metrics.costPerM2 = metrics.totalCost / floorArea;
      metrics.electricityPerM2 = metrics.totalElectricityKwh / floorArea;
      metrics.gasPerM2 = metrics.totalGasKwh / floorArea;
      metrics.carbonPerM2 = metrics.carbonFootprint / floorArea;

      // Calculate monthly per m² values
      metrics.monthlyData = metrics.monthlyData.map((month) => ({
        ...month,
        costPerM2: month.cost / floorArea,
        electricityPerM2: month.electricity / floorArea,
        gasPerM2: month.gas / floorArea,
      }));
    } else {
      metrics.costPerM2 = 0;
      metrics.electricityPerM2 = 0;
      metrics.gasPerM2 = 0;
      metrics.carbonPerM2 = 0;
    }

    return metrics;
  };

  const currentYearData = processYearlyData(energyData, currentYear);

  // Chart data configurations
  const chartConfigs = {
    costPerM2: {
      labels: ["Cost per m²"],
      datasets: [
        {
          label: `£/m² (${currentYear})`,
          data: [currentYearData.costPerM2],
          backgroundColor: "#3B82F6",
        },
      ],
    },
    carbonPerM2: {
      labels: ["Carbon per m²"],
      datasets: [
        {
          label: `kg CO2e/m² (${currentYear})`,
          data: [currentYearData.carbonPerM2],
          backgroundColor: "#10B981",
        },
      ],
    },
    consumptionPerM2: {
      labels: ["Electricity (kWh/m²)", "Gas (kWh/m²)"],
      datasets: [
        {
          label: `Consumption/m² (${currentYear})`,
          data: [currentYearData.electricityPerM2, currentYearData.gasPerM2],
          backgroundColor: ["#6366F1", "#F59E0B"],
        },
      ],
    },
    monthlyTrends: {
      labels: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      datasets: [
        {
          label: "Electricity (kWh/m²)",
          data: currentYearData.monthlyData.map((m) => m.electricityPerM2),
          backgroundColor: "#6366F1",
          borderColor: "#6366F1",
          type: "line",
          tension: 0.1,
        },
        {
          label: "Gas (kWh/m²)",
          data: currentYearData.monthlyData.map((m) => m.gasPerM2),
          backgroundColor: "#F59E0B",
          borderColor: "#F59E0B",
          type: "line",
          tension: 0.1,
        },
        {
          label: "Cost (£/m²)",
          data: currentYearData.monthlyData.map((m) => m.costPerM2),
          backgroundColor: "#3B82F6",
        },
      ],
    },
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Energy Metrics per m²" },
      tooltip: {
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || "";
            if (label) label += ": ";
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(2);
              if (context.datasetIndex === 0 && context.dataIndex === 0) {
                label += " £/m²";
              } else if (
                context.datasetIndex === 1 &&
                context.dataIndex === 0
              ) {
                label += " kg CO2e/m²";
              } else {
                label += context.dataset.label.includes("Electricity")
                  ? " kWh/m²"
                  : context.dataset.label.includes("Gas")
                  ? " kWh/m²"
                  : " £/m²";
              }
            }
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Value per m²",
        },
      },
    },
  };

  return (
    <div className="container">
      <div className="row">
        <div className="col-md-6">
          <div className="bg-white p-4 rounded-lg shadow mb-4">
            <h2 className="text-lg font-semibold mb-4">Annual Cost per m²</h2>
            <Bar data={chartConfigs.costPerM2} options={chartOptions} />
            <div className="mt-4 text-sm text-gray-600">
              <p>
                Total Cost: £
                {currentYearData.totalCost.toLocaleString("en-GB", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p>Cost per m²: £{currentYearData.costPerM2.toFixed(2)}</p>
              {floorArea && (
                <p className="text-xs mt-1">
                  Based on {floorArea.toLocaleString()} m² floor area
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="bg-white p-4 rounded-lg shadow mb-4">
            <h2 className="text-lg font-semibold mb-4">
              Carbon Footprint per m²
            </h2>
            <Bar data={chartConfigs.carbonPerM2} options={chartOptions} />
            <div className="mt-4 text-sm text-gray-600">
              <p>
                Total Carbon: {currentYearData.carbonFootprint.toFixed(2)} kg
                CO2e
              </p>
              <p>
                Carbon per m²: {currentYearData.carbonPerM2.toFixed(2)} kg CO2e
              </p>
              <p className="text-xs mt-1">
                (Electricity: 0.35 kg/kWh, Gas: 0.19 kg/kWh)
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <div className="bg-white p-4 rounded-lg shadow mb-4">
            <h2 className="text-lg font-semibold mb-4">
              Energy Consumption per m²
            </h2>
            <Bar data={chartConfigs.consumptionPerM2} options={chartOptions} />
            <div className="mt-4 text-sm text-gray-600">
              <p>
                Total Electricity:{" "}
                {currentYearData.totalElectricityKwh.toLocaleString("en-GB")}{" "}
                kWh
              </p>
              <p>
                Total Gas: {currentYearData.totalGasKwh.toLocaleString("en-GB")}{" "}
                kWh
              </p>
              {energyData.some((item) => item.readingUnit === "M3") && (
                <p className="text-xs text-gray-500 mt-1">
                  Gas converted from m³ to kWh (39.5 MJ/m³ calorific value)
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-6" style={{ display: "none" }}>
          <div className="bg-white p-4 rounded-lg shadow mb-4">
            <h2 className="text-lg font-semibold mb-4">
              Monthly Trends per m²
            </h2>
            <Bar
              data={chartConfigs.monthlyTrends}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  title: { display: true, text: "Monthly Trends per m²" },
                },
              }}
            />
            <div className="mt-4 text-sm text-gray-600">
              <p>Monthly energy and cost metrics normalized per m²</p>
              {!floorArea && (
                <p className="text-red-500 text-xs mt-1">
                  Warning: Floor area not provided - per m² calculations
                  unavailable
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnergyMetricsReport;