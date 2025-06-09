import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import { get } from "../../../../api";
import {
  CircularProgress,
  Paper,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  InputLabel,
  FormControl
} from "@mui/material";
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement,
  Tooltip, 
  Legend 
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

const EnergyPrediction = ({ loggedInUserData, siteSelectedForGlobal, sites }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [assets, setAssets] = useState([]);
  const [energyReadings, setEnergyReadings] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [selectedSite, setSelectedSite] = useState(siteSelectedForGlobal?.siteId || '');
  const [siteArea, setSiteArea] = useState(0);

  useEffect(() => {
    if (selectedSite) {
      getEnergyData(selectedSite);
    }
  }, [selectedSite]);

  const getEnergyData = async (siteId) => {
    setIsLoading(true);
    try {
      // Get site details to get area
      const siteDetails = await get(`/api/site/site/${siteId}`);
      const area = Number(siteDetails?.siteAreaOccupancyData?.totalBuildingArea) || 1;
      setSiteArea(area);

      // Get assets with power consumption data
      const assetsRes = await get(`/api/site/${siteId}/assets`);
      setAssets(assetsRes.assets || []);

      // Get energy readings
      const readingsRes = await get(`/api/energy/site/survey/${siteId}`);
      console.log('API Response:', readingsRes); // Debug log

      if (!Array.isArray(readingsRes)) {
        throw new Error('Invalid readings data format');
      }

      const processedReadings = processReadings(readingsRes, area);
      console.log('Processed Readings:', processedReadings); // Debug log
      
      setEnergyReadings(processedReadings);

      // Generate predictions only if we have valid data
      const futurePredictions = processedReadings.length >= 3 
        ? predictFutureConsumption(processedReadings, area)
        : [];
      setPredictions(futurePredictions);
    } catch (error) {
      console.error('Error in getEnergyData:', error);
      toast.error("Failed to fetch energy data: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const processReadings = (readings, area) => {
  if (!readings || !Array.isArray(readings)) return [];

  const monthlyData = {};

  // Flatten readings from all energy types and filter for kWh units
  const allReadings = readings
    .flatMap(item => item.readingList || [])
    .filter(reading => reading.readingUnit.toLowerCase() === 'kwh' && reading.readingValue > 0);

  allReadings.forEach(reading => {
    try {
      // Parse the reading date
      let date;
      if (typeof reading.readingDate === 'string') {
        date = new Date(reading.readingDate);
        if (isNaN(date.getTime())) {
          // Try parsing different date formats if needed
          const parts = reading.readingDate.split('-');
          if (parts.length === 3) {
            date = new Date(parts[0], parts[1] - 1, parts[2]);
          }
        }
      } else if (reading.readingDate instanceof Date) {
        date = new Date(reading.readingDate);
      }

      if (!date || isNaN(date.getTime())) {
        console.warn('Invalid date:', reading.readingDate);
        return;
      }

      const monthYear = `${date.getFullYear()}-${date.getMonth()}`;

      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = {
          month: date.getMonth(),
          monthName: date.toLocaleString('default', { month: 'short' }),
          year: date.getFullYear(),
          consumption: 0,
          consumptionPerM2: 0,
          date: date
        };
      }

      // Use readingValue instead of actualConsumption
      const actualConsumption = parseFloat(reading.readingValue) || 0;
      monthlyData[monthYear].consumption += actualConsumption;
      monthlyData[monthYear].consumptionPerM2 += actualConsumption / area;
    } catch (error) {
      console.error('Error processing reading:', reading, error);
    }
  });

  return Object.values(monthlyData)
    .sort((a, b) => a.date - b.date)
    .map(({ date, ...rest }) => rest);
};

  const predictFutureConsumption = (historicalData, area, monthsToPredict = 3) => {
    if (!historicalData || historicalData.length < 3) return [];
    
    const x = historicalData.map((_, i) => i);
    const y = historicalData.map(item => item.consumption);
    const yPerM2 = historicalData.map(item => item.consumptionPerM2);
    
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((a, val, i) => a + val * y[i], 0);
    const sumXX = x.reduce((a, b) => a + b * b, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const sumYPerM2 = yPerM2.reduce((a, b) => a + b, 0);
    const sumXYPerM2 = x.reduce((a, val, i) => a + val * yPerM2[i], 0);
    
    const slopePerM2 = (n * sumXYPerM2 - sumX * sumYPerM2) / (n * sumXX - sumX * sumX);
    const interceptPerM2 = (sumYPerM2 - slopePerM2 * sumX) / n;
    
    const lastDate = new Date(
      historicalData[historicalData.length - 1].year, 
      historicalData[historicalData.length - 1].month + 1, 
      1
    );
    
    return Array(monthsToPredict).fill(0).map((_, i) => {
      const predictionDate = new Date(lastDate);
      predictionDate.setMonth(predictionDate.getMonth() + i);
      
      return {
        monthName: predictionDate.toLocaleString('default', { month: 'short' }),
        year: predictionDate.getFullYear(),
        consumption: slope * (n + i) + intercept,
        consumptionPerM2: slopePerM2 * (n + i) + interceptPerM2,
        isPrediction: true
      };
    });
  };

  const prepareChartData = (usePerM2 = false) => {
    const allData = [...energyReadings, ...predictions];
    
    const validData = allData.filter(item => 
      !isNaN(item.consumption) && 
      !isNaN(item.consumptionPerM2) && 
      item.monthName && 
      item.year
    );

    const labels = validData.map(item => `${item.monthName} ${item.year}`);
    const data = validData.map(item => usePerM2 ? item.consumptionPerM2 : item.consumption);
    const unit = usePerM2 ? 'kWh/m²' : 'kWh';
    
    return {
      labels,
      datasets: [
        {
          label: `Energy Consumption (${unit})`,
          data,
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderWidth: 2,
          borderDash: validData.map(item => item.isPrediction ? [5, 5] : []),
          pointBackgroundColor: validData.map(item => 
            item.isPrediction ? 'rgba(54, 162, 235, 0.8)' : 'rgba(54, 162, 235, 1)'
          ),
          tension: 0.1
        }
      ]
    };
  };

  const handleSiteChange = (event) => {
    setSelectedSite(event.target.value);
  };

  return (
    <Fragment>
      <div className="row mt-4">
        <div className="col-md-12">
          <Paper elevation={3} style={{ padding: '20px', marginBottom: '20px' }}>
            <Typography variant="h5" gutterBottom>
              Energy Consumption Analysis
            </Typography>
            
            <Grid container spacing={2} style={{ marginBottom: '20px' }}>
              <Grid item xs={12} sm={6} md={4}>
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
            </Grid>
            
            {isLoading ? (
              <div className="text-center">
                <CircularProgress />
              </div>
            ) : (
              selectedSite ? (
                <Grid container spacing={3}>
                  {/* Energy Consumption Chart */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      Total Energy Consumption with 3-Month Forecast
                    </Typography>
                    <div style={{ height: '400px' }}>
                      <Line 
                        data={prepareChartData(false)} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              beginAtZero: false,
                              title: {
                                display: true,
                                text: 'kWh'
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
                                  const value = context.raw;
                                  if (isNaN(value)) return 'No data';
                                  return `${context.dataset.label}: ${value.toFixed(2)} kWh${
                                    context.dataIndex >= energyReadings.length ? ' (predicted)' : ''
                                  }`;
                                }
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </Grid>

                  {/* Energy Consumption per M2 Chart */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      Energy Consumption per m² with 3-Month Forecast
                    </Typography>
                    <div style={{ height: '400px' }}>
                      <Line 
                        data={prepareChartData(true)} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              beginAtZero: false,
                              title: {
                                display: true,
                                text: 'kWh/m²'
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
                                  const value = context.raw;
                                  if (isNaN(value)) return 'No data';
                                  return `${context.dataset.label}: ${value.toFixed(2)} kWh/m²${
                                    context.dataIndex >= energyReadings.length ? ' (predicted)' : ''
                                  }`;
                                }
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </Grid>

                  {/* Display if no data available */}
                  {energyReadings.length === 0 && (
                    <Grid item xs={12}>
                      <Typography variant="body1" style={{ textAlign: 'center' }}>
                        No energy consumption data available for the selected site
                      </Typography>
                    </Grid>
                  )}

                  {/* Assets with Power Consumption */}
                  {assets.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom>
                        Assets with Power Consumption
                      </Typography>
                      <TableContainer component={Paper}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Asset Name</TableCell>
                              <TableCell>Category</TableCell>
                              <TableCell align="right">Power Output</TableCell>
                              <TableCell>Location</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {assets.filter(a => a.powerOutput).map((asset) => (
                              <TableRow key={asset.assetId}>
                                <TableCell>{asset.assetName}</TableCell>
                                <TableCell>{asset.category}</TableCell>
                                <TableCell align="right">
                                  {asset.powerOutput} {asset.powerOutput < 20 ? 'kW' : 'W'}
                                </TableCell>
                                <TableCell>
                                  {[asset.floor, asset.room].filter(Boolean).join(', ')}
                                </TableCell>
                              </TableRow>
                            ))}
                            {assets.filter(a => a.powerOutput).length === 0 && (
                              <TableRow>
                                <TableCell colSpan={4} align="center">
                                  No assets with power consumption data found
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Grid>
                  )}

                  {/* Future Predictions */}
                  {predictions.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom>
                        Predicted Consumption (Next 3 Months)
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle1">Total Consumption</Typography>
                          <TableContainer component={Paper}>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Month</TableCell>
                                  <TableCell align="right">Predicted Consumption (kWh)</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {predictions.map((pred, index) => (
                                  <TableRow key={`total-${index}`}>
                                    <TableCell>{pred.monthName} {pred.year}</TableCell>
                                    <TableCell align="right">{pred.consumption.toFixed(2)}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle1">Per m² Consumption</Typography>
                          <TableContainer component={Paper}>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Month</TableCell>
                                  <TableCell align="right">Predicted Consumption (kWh/m²)</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {predictions.map((pred, index) => (
                                  <TableRow key={`m2-${index}`}>
                                    <TableCell>{pred.monthName} {pred.year}</TableCell>
                                    <TableCell align="right">{pred.consumptionPerM2.toFixed(2)}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Grid>
                      </Grid>
                    </Grid>
                  )}
                </Grid>
              ) : (
                <Typography variant="body1" style={{ textAlign: 'center' }}>
                  Please select a site to view energy data
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

export default connect(mapStateToProps)(EnergyPrediction);