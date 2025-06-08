import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import { get } from "../../../../api";
import {
  CircularProgress,
  Paper,
  Typography,
  Grid,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
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

// Register ChartJS components
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

  useEffect(() => {
    if (selectedSite) {
      getEnergyData(selectedSite);
    }
  }, [selectedSite]);

  const getEnergyData = async (siteId) => {
    setIsLoading(true);
    try {
      // Get assets with power consumption data
      const assetsRes = await get(`/api/site/${siteId}/assets`);
      setAssets(assetsRes.assets || []);

      // Get energy readings
      const readingsRes = await get(`/api/energy/site/survey/${siteId}`);
      const processedReadings = processReadings(readingsRes);
      setEnergyReadings(processedReadings);

      // Generate predictions
      const futurePredictions = predictFutureConsumption(processedReadings);
      setPredictions(futurePredictions);
    } catch (error) {
      toast.error("Failed to fetch energy data: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const processReadings = (readings) => {
    if (!readings || !readings.length) return [];
    
    // Group by month and sum consumption
    const monthlyData = {};
    
    readings.forEach(reading => {
      const date = new Date(reading.readingDate);
      const monthYear = `${date.getFullYear()}-${date.getMonth()}`;
      
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = {
          month: date.getMonth(),
          monthName: date.toLocaleString('default', { month: 'short' }),
          year: date.getFullYear(),
          consumption: 0
        };
      }
      
      monthlyData[monthYear].consumption += reading.actualConsumption || 0;
    });
    
    return Object.values(monthlyData).sort((a, b) => {
      return new Date(a.year, a.month) - new Date(b.year, b.month);
    });
  };

  const predictFutureConsumption = (historicalData, monthsToPredict = 3) => {
    if (!historicalData || historicalData.length < 3) return [];
    
    // Simple linear regression prediction
    const x = historicalData.map((_, i) => i);
    const y = historicalData.map(item => item.consumption);
    
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((a, val, i) => a + val * y[i], 0);
    const sumXX = x.reduce((a, b) => a + b * b, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Generate predictions
    const lastDate = new Date(
      historicalData[historicalData.length - 1].year, 
      historicalData[historicalData.length - 1].month
    );
    
    return Array(monthsToPredict).fill(0).map((_, i) => {
      const predictionDate = new Date(lastDate);
      predictionDate.setMonth(predictionDate.getMonth() + i + 1);
      
      return {
        monthName: predictionDate.toLocaleString('default', { month: 'short' }),
        year: predictionDate.getFullYear(),
        consumption: slope * (n + i) + intercept,
        isPrediction: true
      };
    });
  };

  const prepareChartData = () => {
    const allData = [...energyReadings, ...predictions];
    const labels = allData.map(item => `${item.monthName} ${item.year}`);
    const data = allData.map(item => item.consumption);
    
    return {
      labels,
      datasets: [
        {
          label: 'Energy Consumption (kWh)',
          data,
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderWidth: 2,
          borderDash: allData.map(item => item.isPrediction ? [5, 5] : []),
          pointBackgroundColor: allData.map(item => 
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
            
            {/* Site Selection Dropdown */}
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
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Energy Consumption with 3-Month Forecast
                    </Typography>
                    <div style={{ height: '400px' }}>
                      <Line 
                        data={prepareChartData()} 
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
                                  const label = context.dataset.label || '';
                                  const value = context.raw || 0;
                                  const isPred = predictions.length > 0 && 
                                    context.dataIndex >= energyReadings.length;
                                  return `${label}: ${value.toFixed(2)} kWh${isPred ? ' (predicted)' : ''}`;
                                }
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </Grid>

                  {/* Assets with Power Consumption */}
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

                  {/* Future Predictions */}
                  {predictions.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom>
                        Predicted Consumption (Next 3 Months)
                      </Typography>
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
                              <TableRow key={index}>
                                <TableCell>{pred.monthName} {pred.year}</TableCell>
                                <TableCell align="right">{pred.consumption.toFixed(2)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
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