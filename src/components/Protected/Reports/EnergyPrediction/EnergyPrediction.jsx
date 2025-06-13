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
  Box
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
  Legend 
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

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

const EnergyAndAssetComparisonChart = ({ loggedInUserData, siteSelectedForGlobal, sites }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSite, setSelectedSite] = useState(siteSelectedForGlobal?.siteId || '');
  const [allSites, setAllSites] = useState([]);
  const [energyReadings, setEnergyReadings] = useState([]);
  const [assets, setAssets] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (selectedSite) {
      fetchSiteData(selectedSite);
    }
  }, [selectedSite, selectedYear]);

  const fetchSiteData = async (siteId) => {
    setIsLoading(true);
    try {
      // Get site details
      if (allSites?.length === 0) {
        const res = await get("/api/site/site/all?sort=asc&sortName=siteName&withDetails=true");
        setAllSites(res);
      }
      
      // Fetch both energy and asset data in parallel
      await Promise.all([
        getEnergyData(siteId),
        getAssetData(siteId)
      ]);
    } catch (error) {
      console.error('Error in fetchSiteData:', error);
      toast.error("Failed to fetch site data: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getEnergyData = async (siteId) => {
    try {
      const readingsRes = await get(`/api/energy/site/survey/${siteId}`);
      
      if (!Array.isArray(readingsRes)) {
        throw new Error('Invalid readings data format');
      }

      const processedReadings = processElectricityReadings(readingsRes);
      setEnergyReadings(processedReadings);
    } catch (error) {
      console.error('Error in getEnergyData:', error);
      toast.error("Failed to fetch energy data: " + error.message);
    }
  };

  const getAssetData = async (siteId) => {
    try {
      const assetsRes = await get(`/api/site/${siteId}/assets`);
      setAssets(assetsRes.assets || []);
    } catch (error) {
      console.error('Error fetching asset data:', error);
      toast.error("Failed to fetch asset data: " + error.message);
    }
  };

  const processElectricityReadings = (readings) => {
    if (!readings || !Array.isArray(readings)) return [];

    const monthlyData = {};

    // Initialize all 12 months
    for (let month = 0; month < 12; month++) {
      const date = new Date(selectedYear, month, 1);
      const monthYear = `${date.getFullYear()}-${date.getMonth()}`;
      
      monthlyData[monthYear] = {
        month: date.getMonth(),
        monthName: date.toLocaleString('default', { month: 'short' }),
        year: date.getFullYear(),
        consumption: 0, // Absolute kWh
        date: date
      };
    }

    // Filter only electricity readings in kWh
    const electricityReadings = readings
      .filter(item => item.budgetCategory === "Electricity")
      .flatMap(item => item.readingList || [])
      .filter(reading => 
        reading.readingUnit.toLowerCase() === 'kwh' && 
        reading.readingValue > 0
      );

    electricityReadings.forEach(reading => {
      try {
        let date;
        if (typeof reading.readingDate === 'string') {
          date = new Date(reading.readingDate);
          if (isNaN(date.getTime())) {
            const parts = reading.readingDate.split('-');
            if (parts.length === 3) {
              date = new Date(parts[0], parts[1] - 1, parts[2]);
            }
          }
        } else if (reading.readingDate instanceof Date) {
          date = new Date(reading.readingDate);
        }

        if (!date || isNaN(date.getTime()) || date.getFullYear() !== selectedYear) return;

        const monthYear = `${date.getFullYear()}-${date.getMonth()}`;
        if (!monthlyData[monthYear]) return;

        const actualConsumption = parseFloat(reading.readingValue) || 0;
        monthlyData[monthYear].consumption += actualConsumption;
      } catch (error) {
        console.error('Error processing reading:', reading, error);
      }
    });

    return Object.values(monthlyData).sort((a, b) => a.month - b.month);
  };

  const prepareComparisonChartData = () => {
    // Get all months with names
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(selectedYear, i, 1);
      return date.toLocaleString('default', { month: 'short' });
    });

    // Prepare actual consumption data (fill with 0 if no data)
    const actualData = months.map((month, index) => {
      const reading = energyReadings.find(r => r.month === index);
      return reading ? reading.consumption : 0;
    });

    // Filter assets with power output and convert to kW
    const powerAssets = assets
      .filter(asset => asset.powerOutput && asset.powerOutput > 0)
      .map(asset => {
        const power = parseFloat(asset.powerOutput) || 0;
        const powerInKW = asset.powerOutputUnit === 'kW' ? power : power / 1000;
        return {
          ...asset,
          powerInKW
        };
      });

    // Calculate total predicted consumption
    const totalAssetPowerKW = powerAssets.reduce((sum, asset) => sum + asset.powerInKW, 0);
    const monthlyPredictedConsumption = totalAssetPowerKW * 8 * 30;
    
    // Same predicted value for all months
    const predictedData = months.map(() => monthlyPredictedConsumption);

    return {
      labels: months,
      datasets: [
        {
          label: 'Actual Electricity Consumption (kWh)',
          data: actualData,
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        },
        {
          label: 'Predicted Asset Consumption (kWh)',
          data: predictedData,
          backgroundColor: 'rgba(255, 99, 132, 0.7)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
          // Store asset details for tooltip
          assets: powerAssets,
          totalPowerKW: totalAssetPowerKW
        }
      ]
    };
  };

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

  return (
    <Fragment>
      <div className="row mt-4">
        <div className="col-md-12">
          <Paper elevation={3} style={{ padding: '20px', marginBottom: '20px' }}>
            <Typography variant="h4" gutterBottom style={{ marginBottom: '30px' }}>
              Energy Consumption vs Asset Prediction
            </Typography>
            
            <Grid container spacing={2} style={{ marginBottom: '20px' }}>
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
                      ?.filter(site => String(site?.status).toLowerCase() === "open")
                      ?.map(site => (
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
                    {years.map(year => (
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
            ) : (
              selectedSite ? (
                <Paper elevation={2} style={{ padding: '20px', height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    Monthly Energy Consumption vs Asset Prediction
                  </Typography>
                  <div style={{ height: '500px' }}>
                    <Bar 
                      data={prepareComparisonChartData()} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: 'kWh'
                            }
                          },
                          x: {
                            title: {
                              display: true,
                              text: 'Month'
                            }
                          }
                        },
                        plugins: {
                          legend: {
                            position: 'top',
                          },
                          tooltip: {
                            callbacks: {
                              label: (context) => {
                                const datasetLabel = context.dataset.label;
                                const value = context.raw;
                                return `${datasetLabel}: ${value.toFixed(2)} kWh`;
                              },
                              afterLabel: (context) => {
                                // Only show asset details for predicted consumption dataset
                                if (context.datasetIndex === 1) {
                                  const assets = context.dataset.assets;
                                  const totalPower = context.dataset.totalPowerKW;
                                  
                                  // Create asset details list
                                  let assetDetails = [
                                    `Total Power: ${totalPower.toFixed(2)} kW`,
                                    'Asset Breakdown:'
                                  ];
                                  
                                  assets.forEach(asset => {
                                    assetDetails.push(
                                      `- ${asset.assetName}: ${asset.powerInKW.toFixed(2)} kW ` +
                                      `(${asset.powerOutput} W)`
                                    );
                                  });
                                  
                                  assetDetails.push(
                                    `\nCalculation: ${totalPower.toFixed(2)} kW × 8 hours × 30 days = ${context.raw.toFixed(2)} kWh`
                                  );
                                  
                                  return assetDetails.join('\n');
                                }
                                return null;
                              }
                            }
                          }
                        }
                      }}
                    />
                  </div>
                  <Typography variant="body2" style={{ marginTop: '20px', fontStyle: 'italic' }}>
                    Note: Predicted consumption is calculated as (sum of asset power in kW) × 8 hours/day × 30 days
                  </Typography>
                </Paper>
              ) : (
                <Typography variant="body1" style={{ textAlign: 'center' }}>
                  Please select a site to view comparison data
                </Typography>
              )
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