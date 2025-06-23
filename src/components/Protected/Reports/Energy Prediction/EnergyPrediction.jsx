import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import { get } from "../../../../api";
import {
  CircularProgress,
  Paper,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from "@mui/material";
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
import { Bar, Pie } from "react-chartjs-2";

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

const EnergyAndAssetComparisonChart = ({
                                           loggedInUserData,
                                           siteSelectedForGlobal,
                                           sites,
                                       }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [selectedSite, setSelectedSite] = useState(
        siteSelectedForGlobal?.siteId || ""
    );
    const [allSites, setAllSites] = useState([]);
    const [energyReadings, setEnergyReadings] = useState([]);
    const [assets, setAssets] = useState([]);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [floorArea, setFloorArea] = useState(null);

    useEffect(() => {
        const fetchAllSites = async () => {
            try {
                const res = await get(
                    "/api/site/site/all?sort=asc&sortName=siteName&withDetails=true"
                );
                setAllSites(res);
            } catch (error) {
                console.error("Error fetching all sites:", error);
            }
        };
        fetchAllSites();
    }, [siteSelectedForGlobal, loggedInUserData, sites]);

    useEffect(() => {
        if (selectedSite) {
            const fetchData = async () => {
                setIsLoading(true);
                try {
                    const site = allSites.find((s) => s.siteId === selectedSite);
                    const area = site?.siteAreaOccupancyData?.totalBuildingArea || null;
                    setFloorArea(area);

                    await Promise.all([
                        getEnergyData(selectedSite, area),
                        getAssetData(selectedSite),
                    ]);
                } catch (error) {
                    console.error("Error in fetchData:", error);
                    toast.error("Failed to fetch data: " + error.message);
                } finally {
                    setIsLoading(false);
                }
            };

            fetchData();
        }
    }, [selectedSite, selectedYear, allSites]);

    const getEnergyData = async (siteId, area) => {
        try {
            const readingsRes = await get(`/api/energy/site/survey/${siteId}`);
            if (!Array.isArray(readingsRes)) {
                throw new Error("Invalid readings data format");
            }
            const processedReadings = processElectricityReadings(
                readingsRes,
                selectedYear,
                area
            );
            setEnergyReadings(processedReadings);
        } catch (error) {
            console.error("Error in getEnergyData:", error);
            toast.error("Failed to fetch energy data: " + error.message);
        }
    };

    const getAssetData = async (siteId) => {
        try {
            const assetsRes = await get(`/api/site/${siteId}/assets`);
            const processedAssets = (assetsRes.assets || []).map(asset => {
                const power = parseFloat(asset.powerOutput) || 0;
                return {
                    ...asset,
                    powerKW: power,
                    powerOutput: power
                };
            });
            setAssets(processedAssets);
        } catch (error) {
            console.error("Error fetching asset data:", error);
            toast.error("Failed to fetch asset data: " + error.message);
        }
    };

  const processElectricityReadings = (
      readings,
      selectedYear = new Date().getFullYear(),
      area
  ) => {
    if (!readings || !Array.isArray(readings)) return [];

    const monthlyData = Array.from({ length: 12 }, (_, month) => {
      const date = new Date(selectedYear, month, 1);
      return {
        month,
        monthName: date.toLocaleString("default", { month: "short" }),
        year: selectedYear,
        consumption: 0,
        consumptionPerM2: 0,
        daysInMonth: new Date(selectedYear, month + 1, 0).getDate(),
        startDate: new Date(selectedYear, month, 1),
        endDate: new Date(selectedYear, month + 1, 0),
      };
    });

    // Process all valid electricity readings
    const electricityReadings = readings
        .filter((item) => item.budgetCategory === "Electricity")
        .flatMap((item) => item.readingList || [])
        .map((reading) => {
          const date = new Date(reading.readingDate);
          const value = parseFloat(reading.readingValue);
          const unit =
              (reading.readingUnit?.toLowerCase() === "units"
                  ? "kwh"
                  : reading.readingUnit?.toLowerCase()) || "";

          return {
            ...reading,
            parsedDate: date,
            parsedValue: !isNaN(value) ? value : null,
            readingUnit: unit,
            isValid:
                date instanceof Date &&
                !isNaN(date) &&
                !isNaN(value) &&
                value >= 0 &&
                unit === "kwh",
          };
        })
        .filter((r) => r.isValid && r.parsedDate.getFullYear() === selectedYear)
        .sort((a, b) => a.parsedDate - b.parsedDate);

    // Find the last reading from previous year if available
    let previousYearReading = null;
    if (electricityReadings.length > 0) {
      const previousYearReadings = readings
          .filter((item) => item.budgetCategory === "Electricity")
          .flatMap((item) => item.readingList || [])
          .map((reading) => {
            const date = new Date(reading.readingDate);
            const value = parseFloat(reading.readingValue);
            return {
              ...reading,
              parsedDate: date,
              parsedValue: !isNaN(value) ? value : null,
              isValid: date instanceof Date && !isNaN(date) && !isNaN(value) && value >= 0,
            };
          })
          .filter((r) => r.isValid && r.parsedDate.getFullYear() === selectedYear - 1)
          .sort((a, b) => b.parsedDate - a.parsedDate);

      if (previousYearReadings.length > 0) {
        previousYearReading = previousYearReadings[0];
      }
    }

    // Process each reading
    for (let i = 0; i < electricityReadings.length; i++) {
      const current = electricityReadings[i];
      const monthIndex = current.parsedDate.getMonth();

      if (i === 0) {
        // First reading of the year - check if we have previous year's reading
        if (previousYearReading) {
          const consumption = current.parsedValue - previousYearReading.parsedValue;
          if (consumption >= 0) {
            monthlyData[monthIndex].consumption += consumption;
          }
        } else {
          // No previous reading - just use the current value
          monthlyData[monthIndex].consumption += current.parsedValue;
        }
      } else {
        const prev = electricityReadings[i - 1];
        if (
            prev.isValid &&
            current.isValid &&
            prev.readingUnit === current.readingUnit &&
            prev.parsedDate < current.parsedDate
        ) {
          const consumption = current.parsedValue - prev.parsedValue;
          if (consumption >= 0) {
            monthlyData[monthIndex].consumption += consumption;
          }
        }
      }
    }

    // Calculate per m² if area is available
    if (area) {
      monthlyData.forEach((month) => {
        month.consumptionPerM2 = month.consumption / area;
      });
    }

    return monthlyData;
  };

    const prepareAbsoluteChartData = () => {
        const months = Array.from({ length: 12 }, (_, i) => {
            const date = new Date(selectedYear, i, 1);
            return date.toLocaleString("default", { month: "short" });
        });

        const powerAssets = assets
            .filter(asset => {
                const power = parseFloat(asset.powerOutput);
                return !isNaN(power) && power > 0;
            })
            .map(asset => ({
                ...asset,
                powerKW: parseFloat(asset.powerOutput),
                powerOutput: parseFloat(asset.powerOutput)
            }));

        const totalAssetPowerKW = powerAssets.reduce(
            (sum, asset) => sum + (asset.powerKW || 0),
            0
        );

        // Calculate predicted consumption (8 hours/day × 30 days)
        const monthlyPredictedConsumption = powerAssets.length > 0
            ? totalAssetPowerKW * 8 * 30
            : 0;

        // Get max actual consumption (with minimum of 1 to avoid division by zero)
        const maxActualConsumption = Math.max(...energyReadings.map(r => r.consumption), 1);

        // Calculate ratio between actual and predicted
        const ratio = monthlyPredictedConsumption > 0
            ? maxActualConsumption / monthlyPredictedConsumption
            : 1;

        // Adjust the prediction based on the ratio
        const adjustedPrediction = monthlyPredictedConsumption * ratio;

        return {
            labels: months,
            datasets: [
                {
                    label: "Actual Consumption (kWh)",
                    data: energyReadings.map(r => r.consumption),
                    backgroundColor: "rgba(54, 162, 235, 0.7)",
                    borderColor: "rgba(54, 162, 235, 1)",
                    borderWidth: 1,
                },
                {
                    label: `Predicted Consumption (kWh)`,
                    data: months.map(() => adjustedPrediction),
                    backgroundColor: "rgba(255, 99, 132, 0.7)",
                    borderColor: "rgba(255, 99, 132, 1)",
                    borderWidth: 1,
                },
            ],
            powerAssets,
            totalAssetPowerKW,
            monthlyPredictedConsumption,
            adjustedPrediction,
            ratio,
            unit: "kWh",
        };
    };
    const preparePerM2ChartData = () => {
        if (!floorArea) return null;

        const months = Array.from({ length: 12 }, (_, i) => {
            const date = new Date(selectedYear, i, 1);
            return date.toLocaleString("default", { month: "short" });
        });

        const powerAssets = assets
            .filter(asset => {
                const power = parseFloat(asset.powerOutput);
                return !isNaN(power) && power > 0;
            })
            .map(asset => ({
                ...asset,
                powerKW: parseFloat(asset.powerOutput),
                powerOutput: parseFloat(asset.powerOutput)
            }));

        const totalAssetPowerKW = powerAssets.reduce(
            (sum, asset) => sum + (asset.powerKW || 0),
            0
        );

        const monthlyPredictedConsumptionPerM2 = powerAssets.length > 0
            ? (totalAssetPowerKW * 8 * 30) / floorArea
            : 0;

        const maxActualConsumption = Math.max(...energyReadings.map(r => r.consumptionPerM2), 1);

        let scaleFactor = 1;
        let scaledPrediction = monthlyPredictedConsumptionPerM2;

        if (maxActualConsumption > 50 && monthlyPredictedConsumptionPerM2 > 0) {
            scaleFactor = (maxActualConsumption * 0.1) / 100;
            scaledPrediction = monthlyPredictedConsumptionPerM2 * scaleFactor;
        }

        const modifiedConsumptionData = energyReadings.map(r =>
            r.consumptionPerM2 === 0 ? 0.01 : r.consumptionPerM2
        );

        return {
            labels: months,
            datasets: [
                {
                    label: "Actual Consumption (kWh/m²)",
                    data: modifiedConsumptionData,
                    backgroundColor: "rgba(75, 192, 192, 0.7)",
                    borderColor: "rgba(75, 192, 192, 1)",
                    borderWidth: 1,
                    minBarLength: 0,
                },
                {
                    label: `Predicted Consumption (kWh/m²${scaleFactor !== 1 ? ` (scaled ×${scaleFactor.toFixed(1)})` : ''})`,
                    data: months.map(() => scaledPrediction),
                    backgroundColor: "rgba(255, 99, 132, 0.7)",
                    borderColor: "rgba(255, 99, 132, 1)",
                    borderWidth: 1,
                    minBarLength: 20,
                },
            ],
            powerAssets,
            totalAssetPowerKW,
            monthlyPredictedConsumptionPerM2,
            scaleFactor,
            unit: "kWh/m²",
        };
    };

    const prepareAssetBreakdownData = () => {
        if (!assets || assets.length === 0) return null;

        const subCategoryData = assets
            .filter((asset) => asset.powerOutput && asset.powerOutput > 0)
            .reduce((acc, asset) => {
                const subCategory = asset.subCategory || "Uncategorized";
                const powerKW = parseFloat(asset.powerOutput) || 0;
                const dailyKWH = powerKW * 8;
                const monthlyKWH = dailyKWH * 30;

                if (!acc[subCategory]) {
                    acc[subCategory] = {
                        subCategory,
                        powerKW: 0,
                        dailyKWH: 0,
                        monthlyKWH: 0,
                        assetCount: 0,
                        assets: [],
                    };
                }

                acc[subCategory].powerKW += powerKW;
                acc[subCategory].dailyKWH += dailyKWH;
                acc[subCategory].monthlyKWH += monthlyKWH;
                acc[subCategory].assetCount += 1;
                acc[subCategory].assets.push(asset);

                return acc;
            }, {});

        const categories = Object.values(subCategoryData);
        const totalMonthlyKWH = categories.reduce(
            (sum, subCategory) => sum + subCategory.monthlyKWH,
            0
        );

        const pieChartData = {
            labels: categories.map((cat) => cat.subCategory),
            datasets: [
                {
                    data: categories.map((cat) => cat.monthlyKWH),
                    backgroundColor: [
                        "#fd88a2",
                        "#36A2EB",
                        "#FFCE56",
                        "#4BC0C0",
                        "#9966FF",
                        "#FF9F40",
                        "#8AC24A",
                        "#607D8B",
                    ],
                    borderColor: "#fff",
                    borderWidth: 1,
                },
            ],
        };

        return {
            pieChartData,
            categories,
            totalMonthlyKWH,
        };
    };

    const assetBreakdownData = prepareAssetBreakdownData();

    const handleSiteChange = (event) => {
        setSelectedSite(event.target.value);
    };

    const handleYearChange = (event) => {
        setSelectedYear(event.target.value);
    };

    const years = Array.from(
        { length: 10 },
        (_, i) => new Date().getFullYear() - i
    );

    const absoluteChartData = prepareAbsoluteChartData();
    const perM2ChartData = preparePerM2ChartData();

    return (
        <Fragment>
            <div className="row mt-4">
                <div className="col-md-12">
                    <Paper elevation={3} style={{ padding: "20px", marginBottom: "20px" }}>
                        <Typography variant="h4" gutterBottom style={{ marginBottom: "30px" }}>
                            Energy Consumption vs Asset Forecast
                        </Typography>

                        <Grid container spacing={2} style={{ marginBottom: "20px" }}>
                            <Grid item xs={12} sm={6} md={3}>
                                <FormControl fullWidth>
                                    <InputLabel id="site-select-label">Select Site</InputLabel>
                                    <Select
                                        labelId="site-select-label"
                                        id="site-select"
                                        value={selectedSite}
                                        label="Select Site"
                                        onChange={handleSiteChange}
                                    >
                                        {sites
                                            ?.filter((site) => String(site?.status).toLowerCase() === "open")
                                            ?.map((site) => (
                                                <MenuItem key={site.siteId} value={site.siteId}>
                                                    {site.siteName}
                                                </MenuItem>
                                            ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <FormControl fullWidth>
                                    <InputLabel id="year-select-label">Select Year</InputLabel>
                                    <Select
                                        labelId="year-select-label"
                                        id="year-select"
                                        value={selectedYear}
                                        label="Select Year"
                                        onChange={handleYearChange}
                                    >
                                        {years.map((year) => (
                                            <MenuItem key={year} value={year}>
                                                {year}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>

                        {isLoading ? (
                            <Box display="flex" justifyContent="center" alignItems="center" height="400px">
                                <CircularProgress />
                            </Box>
                        ) : selectedSite ? (
                            <>
                                <Paper elevation={2} style={{ padding: "20px", marginBottom: "20px" }}>
                                    <Typography variant="h6" gutterBottom>
                                        Monthly Energy Consumption vs Asset Forecast
                                    </Typography>
                                    <div style={{ height: "500px" }}>
                                        <Bar
                                            data={absoluteChartData}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                scales: {
                                                    y: {
                                                        beginAtZero: true,
                                                        title: {
                                                            display: true,
                                                            text: absoluteChartData.unit,
                                                        }
                                                    },
                                                    x: {
                                                        title: {
                                                            display: true,
                                                            text: "Month",
                                                        },
                                                    },
                                                },
                                                plugins: {
                                                    tooltip: {
                                                        callbacks: {
                                                            afterLabel: (context) => {
                                                                if (context.datasetIndex === 1) {
                                                                    const assets = absoluteChartData.powerAssets;
                                                                    const totalPower = absoluteChartData.totalAssetPowerKW;
                                                                    const originalValue = absoluteChartData.monthlyPredictedConsumption;
                                                                    const adjustedValue = absoluteChartData.adjustedPrediction;
                                                                    const ratio = absoluteChartData.ratio;

                                                                    let assetDetails = [];

                                                                    if (assets.length > 0) {
                                                                        assetDetails.push(
                                                                            `Total Power: ${totalPower.toFixed(2)} kW`,
                                                                            "Asset Breakdown:"
                                                                        );

                                                                        assets.forEach((asset) => {
                                                                            assetDetails.push(
                                                                                `- ${asset.assetName}: ${asset.powerKW.toFixed(2)} kW`
                                                                            );
                                                                        });

                                                                        assetDetails.push(
                                                                            `\nRaw Calculation: ${totalPower.toFixed(2)} kW × 8 hours × 30 days = ${originalValue.toFixed(2)} kWh`,
                                                                            `Adjusted for comparison: ${adjustedValue.toFixed(2)} kWh (×${ratio.toFixed(2)})`
                                                                        );
                                                                    } else {
                                                                        assetDetails.push("No power-generating assets found");
                                                                    }

                                                                    if (floorArea && originalValue > 0) {
                                                                        assetDetails.push(
                                                                            `\nPer m²: ${(originalValue / floorArea).toFixed(2)} kWh/m² (${floorArea} m²)`
                                                                        );
                                                                    }

                                                                    return assetDetails.join("\n");
                                                                }
                                                                return null;
                                                            }
                                                        }
                                                    }
                                                }
                                            }}                        />
                                    </div>
                                </Paper>

                                {floorArea && perM2ChartData && (
                                    <Paper elevation={2} style={{ padding: "20px", marginBottom: "20px" }}>
                                        <Typography variant="h6" gutterBottom>
                                            Monthly Energy Consumption (per m²)
                                        </Typography>
                                        <div style={{ height: "500px" }}>
                                            <Bar
                                                data={perM2ChartData}
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    scales: {
                                                        y: {
                                                            beginAtZero: true,
                                                            title: {
                                                                display: true,
                                                                text: perM2ChartData.unit,
                                                            },
                                                            ticks: {
                                                                callback: function(value) {
                                                                    return value === 0.01 ? '0' : value;
                                                                }
                                                            }
                                                        },
                                                        x: {
                                                            title: {
                                                                display: true,
                                                                text: "Month",
                                                            },
                                                        },
                                                    },
                                                    plugins: {
                                                        tooltip: {
                                                            callbacks: {
                                                                afterLabel: (context) => {
                                                                    if (context.datasetIndex === 1) {
                                                                        const assets = perM2ChartData.powerAssets;
                                                                        const totalPower = perM2ChartData.totalAssetPowerKW;
                                                                        const scaleFactor = perM2ChartData.scaleFactor;
                                                                        const originalValue = perM2ChartData.monthlyPredictedConsumptionPerM2;

                                                                        let assetDetails = [];

                                                                        if (assets.length > 0) {
                                                                            assetDetails.push(
                                                                                `Total Power: ${totalPower.toFixed(2)} kW`,
                                                                                "Asset Breakdown:"
                                                                            );

                                                                            assets.forEach((asset) => {
                                                                                assetDetails.push(
                                                                                    `- ${asset.assetName}: ${asset.powerKW.toFixed(2)} kW`
                                                                                );
                                                                            });

                                                                            assetDetails.push(
                                                                                `\nCalculation: ${totalPower.toFixed(2)} kW × 8 hours × 30 days / ${floorArea} m² = ${originalValue.toFixed(2)} kWh/m²`
                                                                            );
                                                                        } else {
                                                                            assetDetails.push("No power-generating assets found");
                                                                        }

                                                                        if (scaleFactor !== 1 && originalValue > 0) {
                                                                            assetDetails.push(`(displayed ×${scaleFactor.toFixed(1)} for visibility)`);
                                                                        }

                                                                        return assetDetails.join("\n");
                                                                    }
                                                                    return null;
                                                                }
                                                            }
                                                        }
                                                    },
                                                    barThickness: 'flex',
                                                    minBarLength: 20,
                                                }}
                                            />
                                        </div>
                                        <Typography variant="body2" style={{ marginTop: "10px" }}>
                                            Floor Area: {floorArea} m²
                                        </Typography>
                                    </Paper>
                                )}

                                {assetBreakdownData && (
                                    <Paper elevation={2} style={{ padding: "20px", marginBottom: "20px" }}>
                                        <Typography variant="h6" gutterBottom>
                                            Asset Energy Contribution Breakdown
                                        </Typography>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} md={6}>
                                                <div style={{ height: "400px" }}>
                                                    <Pie
                                                        data={assetBreakdownData.pieChartData}
                                                        options={{
                                                            responsive: true,
                                                            maintainAspectRatio: false,
                                                            plugins: {
                                                                legend: {
                                                                    position: "right",
                                                                },
                                                                tooltip: {
                                                                    callbacks: {
                                                                        label: (context) => {
                                                                            const label = context.label || "";
                                                                            const value = context.raw || 0;
                                                                            const percentage = (
                                                                                (value / assetBreakdownData.totalMonthlyKWH) * 100
                                                                            ).toFixed(1);
                                                                            return `${label}: ${value.toFixed(2)} kWh (${percentage}%)`;
                                                                        },
                                                                    },
                                                                },
                                                            },
                                                        }}
                                                    />
                                                </div>
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <Typography variant="subtitle1" gutterBottom>
                                                    Sub Category Details (Monthly Consumption)
                                                </Typography>
                                                <Box
                                                    style={{
                                                        maxHeight: "350px",
                                                        overflowY: "auto",
                                                        padding: "10px",
                                                        border: "1px solid #eee",
                                                        borderRadius: "4px",
                                                    }}
                                                >
                                                    <table style={{ width: "100%" }}>
                                                        <thead>
                                                        <tr>
                                                            <th>Sub Category</th>
                                                            <th>Assets</th>
                                                            <th>Power (kW)</th>
                                                            <th>Daily (kWh)</th>
                                                            <th>Monthly (kWh)</th>
                                                            <th>%</th>
                                                        </tr>
                                                        </thead>
                                                        <tbody>
                                                        {assetBreakdownData.categories.map(
                                                            (subCategory, index) => (
                                                                <tr key={index}>
                                                                    <td>{subCategory.subCategory}</td>
                                                                    <td>{subCategory.assetCount}</td>
                                                                    <td>{subCategory.powerKW.toFixed(3)}</td>
                                                                    <td>{subCategory.dailyKWH.toFixed(2)}</td>
                                                                    <td>{subCategory.monthlyKWH.toFixed(2)}</td>
                                                                    <td>
                                                                        {(
                                                                            (subCategory.monthlyKWH /
                                                                                assetBreakdownData.totalMonthlyKWH) *
                                                                            100
                                                                        ).toFixed(2)}
                                                                        %
                                                                    </td>
                                                                </tr>
                                                            )
                                                        )}
                                                        <tr style={{ fontWeight: "bold" }}>
                                                            <td>Total</td>
                                                            <td>
                                                                {assetBreakdownData.categories.reduce(
                                                                    (sum, cat) => sum + cat.assetCount,
                                                                    0
                                                                )}
                                                            </td>
                                                            <td>
                                                                {assetBreakdownData.categories
                                                                    .reduce((sum, cat) => sum + cat.powerKW, 0)
                                                                    .toFixed(3)}
                                                            </td>
                                                            <td>
                                                                {assetBreakdownData.categories
                                                                    .reduce((sum, cat) => sum + cat.dailyKWH, 0)
                                                                    .toFixed(2)}
                                                            </td>
                                                            <td>
                                                                {assetBreakdownData.totalMonthlyKWH.toFixed(2)}
                                                            </td>
                                                            <td>100%</td>
                                                        </tr>
                                                        </tbody>
                                                    </table>
                                                </Box>
                                                {floorArea && (
                                                    <Typography variant="body2" style={{ marginTop: "10px" }}>
                                                        Total per m²:{" "}
                                                        {(
                                                            assetBreakdownData.totalMonthlyKWH / floorArea
                                                        ).toFixed(2)}{" "}
                                                        kWh/m²
                                                    </Typography>
                                                )}
                                            </Grid>
                                        </Grid>
                                    </Paper>
                                )}
                                <Typography
                                    variant="body2"
                                    style={{ marginTop: "10px", fontStyle: "italic" }}
                                >
                                    Note: Predicted consumption is calculated as (sum of asset
                                    power in kW) × 8 hours/day × 30 days
                                </Typography>
                            </>
                        ) : (
                            <Typography variant="body1" style={{ textAlign: "center" }}>
                                Please select a site to view comparison data
                            </Typography>
                        )}
                    </Paper>
                </div>
            </div>
        </Fragment>
    );
};

const mapStateToProps = (state) => ({
  sites: state.site.sites,
  loggedInUserData: state.site.loggedInUserData,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
});

export default connect(mapStateToProps)(EnergyAndAssetComparisonChart);