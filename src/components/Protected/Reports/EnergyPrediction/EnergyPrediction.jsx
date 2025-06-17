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

  // Fetch site data when selectedSite changes
  useEffect(() => {
    if (selectedSite) {
      fetchSiteData(selectedSite);
    }
  }, [selectedSite]);

  // Fetch energy and asset data when selectedSite or selectedYear changes
  useEffect(() => {
    if (selectedSite) {
      fetchEnergyData(selectedSite);
      fetchAssetData(selectedSite);
    }
  }, [selectedSite, selectedYear]);

  const fetchSiteData = async (siteId) => {
    setIsLoading(true);
    try {
      // Get site details if not already fetched
      if (allSites.length === 0) {
        const res = await get("/api/site/site/all?sort=asc&sortName=siteName&withDetails=true");
        setAllSites(res);
      }
    } catch (error) {
      console.error('Error in fetchSiteData:', error);
      toast.error("Failed to fetch site data: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEnergyData = async (siteId) => {
    setIsLoading(true);
    try {
      await getEnergyData(siteId);
    } catch (error) {
      console.error('Error in fetchEnergyData:', error);
      toast.error("Failed to fetch energy data: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAssetData = async (siteId) => {
    setIsLoading(true);
    try {
      await getAssetData(siteId);
    } catch (error) {
      console.error('Error in fetchAssetData:', error);
      toast.error("Failed to fetch asset data: " + error.message);
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

      const processedReadings = processElectricityReadings(readingsRes, selectedYear);
      setEnergyReadings(processedReadings);
    } catch (error) {
      console.error('Error in getEnergyData:', error);
      toast.error("Failed to fetch energy data: " + error.message);
    }
  };

  const getAssetData = async (siteId) => {
    try {
      // Note: If your API supports historical asset data, modify this to include the year
      // Example: `/api/site/${siteId}/assets?year=${selectedYear}`
      const assetsRes = await get(`/api/site/${siteId}/assets`);
      setAssets(assetsRes.assets || []);
    } catch (error) {
      console.error('Error fetching asset data:', error);
      toast.error("Failed to fetch asset data: " + error.message);
    }
  };

  const processElectricityReadings = (readings, selectedYear = new Date().getFullYear()) => {
    if (!readings || !Array.isArray(readings)) return [];

    // Initialize month containers
    const monthlyData = Array.from({ length: 12 }, (_, month) => {
      const date = new Date(selectedYear, month, 1);
      return {
        month,
        monthName: date.toLocaleString('default', { month: 'short' }),
        year: selectedYear,
        consumption: 0,
        daysInMonth: new Date(selectedYear, month + 1, 0).getDate(),
        startDate: new Date(selectedYear, month, 1),
        endDate: new Date(selectedYear, month + 1, 0)
      };
    });

    // Process electricity readings
    const electricityReadings = readings
      .filter(item => item.budgetCategory === "Electricity")
      .flatMap(item => item.readingList || [])
      .map(reading => {
        const date = new Date(reading.readingDate);
        const value = parseFloat(reading.readingValue);
        const unit = (reading.readingUnit?.toLowerCase() === 'units' ? 'kwh' : reading.readingUnit?.toLowerCase()) || '';

        return {
          ...reading,
          parsedDate: date,
          parsedValue: !isNaN(value) ? value : null,
          readingUnit: unit,
          isValid: date instanceof Date && !isNaN(date) &&
            !isNaN(value) && value >= 0 &&
            (unit === 'kwh')
        };
      })
      .filter(r => r.isValid && r.parsedDate.getFullYear() === selectedYear)
      .sort((a, b) => a.parsedDate - b.parsedDate);

    // Calculate consumption
    for (let i = 0; i < electricityReadings.length; i++) {
      const current = electricityReadings[i];
      const monthIndex = current.parsedDate.getMonth();

      if (i === 0) {
        monthlyData[monthIndex].consumption += current.parsedValue;
      } else {
        const prev = electricityReadings[i - 1];

        if (
          prev.isValid && current.isValid &&
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

    return monthlyData;
  };

  const prepareComparisonChartData = () => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(selectedYear, i, 1);
      return date.toLocaleString('default', { month: 'short' });
    });

    // Actual consumption data
    const actualData = months.map((month, index) => {
      const reading = energyReadings.find(r => r.month === index);
      return reading ? reading.consumption : 0;
    });

    // Process assets for prediction
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

    const totalAssetPowerKW = powerAssets.reduce((sum, asset) => sum + asset.powerInKW, 0);
    const monthlyPredictedConsumption = totalAssetPowerKW * 8 * 30;
    
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
          data: months.map(() => monthlyPredictedConsumption),
          backgroundColor: 'rgba(255, 99, 132, 0.7)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
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
                                if (context.datasetIndex === 1) {
                                  const assets = context.dataset.assets;
                                  const totalPower = context.dataset.totalPowerKW;
                                  
                                  let assetDetails = [
                                    `Total Power: ${totalPower.toFixed(2)} kW`,
                                    'Asset Breakdown:'
                                  ];
                                  
                                  assets.forEach(asset => {
                                    assetDetails.push(
                                      `- ${asset.assetName}: ${asset.powerInKW.toFixed(2)} kW ` +
                                      `(${asset.powerOutput} ${asset.powerOutputUnit})`
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