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
import { Line, Bar } from 'react-chartjs-2';

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

const EnergyAndAssetConsumption = ({ loggedInUserData, siteSelectedForGlobal, sites }) => {
  // Common state
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSite, setSelectedSite] = useState(siteSelectedForGlobal?.siteId || '');
  const [siteArea, setSiteArea] = useState(1);
  const [allSites, setAllSites] = useState([]);
  
  // Energy consumption state
  const [energyReadings, setEnergyReadings] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Asset consumption state
  const [assets, setAssets] = useState([]);

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
      
      const siteDetails = allSites.find(site => site?.siteId === siteId) || {};
      const area = Number(siteDetails?.siteAreaOccupancyData?.totalBuildingArea) || 1;
      setSiteArea(area);

      // Fetch both energy and asset data in parallel
      await Promise.all([
        getEnergyData(siteId, area),
        getAssetData(siteId)
      ]);
    } catch (error) {
      console.error('Error in fetchSiteData:', error);
      toast.error("Failed to fetch site data: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getEnergyData = async (siteId, area) => {
    try {
      const readingsRes = await get(`/api/energy/site/survey/${siteId}`);
      
      if (!Array.isArray(readingsRes)) {
        throw new Error('Invalid readings data format');
      }

      const processedReadings = processElectricityReadings(readingsRes, area);
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

  const processElectricityReadings = (readings, area) => {
    if (!readings || !Array.isArray(readings)) return [];

    const monthlyData = {};

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

        // Skip if not in selected year
        if (date.getFullYear() !== selectedYear) return;

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

        // Use readingValue for consumption
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

  const prepareConsumptionChartData = () => {
    const validData = energyReadings.filter(item => 
      !isNaN(item.consumptionPerM2) && 
      item.monthName && 
      item.year
    );

    const labels = validData.map(item => `${item.monthName}`);
    const data = validData.map(item => item.consumptionPerM2);
    
    return {
      labels,
      datasets: [
        {
          label: `Electricity Consumption per m² (kWh/m²) - ${selectedYear}`,
          data,
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderWidth: 2,
          tension: 0.1
        }
      ]
    };
  };

  const prepareAssetChartData = () => {
    // Filter assets with powerOutput and convert to kW
    const powerAssets = assets
      .filter(asset => asset.powerOutput && asset.powerOutput > 0)
      .map(asset => {
        const power = parseFloat(asset.powerOutput) || 0;
        const unit = 'W'; // Assuming values < 20 are in kW
        const powerInKW = unit === 'kW' ? power : power / 1000;
        const powerPerM2 = powerInKW / siteArea;
        
        return {
          ...asset,
          powerInKW,
          powerPerM2
        };
      })
      .sort((a, b) => b.powerInKW - a.powerInKW); // Sort by highest consumption first

    const labels = powerAssets.map(asset => asset.assetName);
    const data = powerAssets.map(asset => asset.powerPerM2);

    return {
      labels,
      datasets: [
        {
          label: 'Power Consumption per m² (kW/m²)',
          data,
          backgroundColor: 'rgba(75, 192, 192, 0.7)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
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
              Energy and Asset Consumption Analysis
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
                <Grid container spacing={4}>
                  {/* Electricity Consumption Chart */}
                  <Grid item xs={12} md={6}>
                    <Paper elevation={2} style={{ padding: '20px', height: '100%' }}>
                      <Typography variant="h6" gutterBottom>
                        Monthly Electricity Consumption per m²
                      </Typography>
                      <div style={{ height: '400px' }}>
                        {energyReadings.length > 0 ? (
                          <Line 
                            data={prepareConsumptionChartData()} 
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
                                      const value = context.raw;
                                      if (isNaN(value)) return 'No data';
                                      return `${context.dataset.label}: ${value.toFixed(2)} kWh/m²`;
                                    }
                                  }
                                }
                              }
                            }}
                          />
                        ) : (
                          <Typography variant="body1" style={{ textAlign: 'center', marginTop: '150px' }}>
                            No electricity consumption data available for the selected site and year
                          </Typography>
                        )}
                      </div>
                    </Paper>
                  </Grid>

                  {/* Asset Power Consumption Chart */}
                  <Grid item xs={12} md={6}>
                    <Paper elevation={2} style={{ padding: '20px', height: '100%' }}>
                      <Typography variant="h6" gutterBottom>
                        Asset Power Consumption per m²
                      </Typography>
                      <div style={{ height: '400px' }}>
                        {assets.filter(a => a.powerOutput).length > 0 ? (
                          <Bar 
                            data={prepareAssetChartData()} 
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              scales: {
                                y: {
                                  beginAtZero: true,
                                  title: {
                                    display: true,
                                    text: 'kW/m²'
                                  }
                                },
                                x: {
                                  title: {
                                    display: true,
                                    text: 'Assets'
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
                                      const asset = assets.find(a => a.assetName === context.label);
                                      const totalPower = asset?.powerInKW?.toFixed(2) || 'N/A';
                                      return [
                                        `Area: ${siteArea} m²`,
                                        `Power/m²: ${context.raw.toFixed(4)} kW/m²`
                                      ];
                                    }
                                  }
                                }
                              }
                            }}
                          />
                        ) : (
                          <Typography variant="body1" style={{ textAlign: 'center', marginTop: '150px' }}>
                            No assets with power consumption data available
                          </Typography>
                        )}
                      </div>
                    </Paper>
                  </Grid>
                </Grid>
              ) : (
                <Typography variant="body1" style={{ textAlign: 'center' }}>
                  Please select a site to view consumption data
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

export default connect(mapStateToProps)(EnergyAndAssetConsumption);