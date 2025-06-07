import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import { get, post, del } from "../../../../api";
import Cost from "./Cost";
import Reading from "./Reading";
import * as XLSX from "xlsx";
import {
  DialogContent,
  DialogTitle,
  Link,
  Dialog,
  CircularProgress,
  Switch,
  Paper,
  Typography,
  Grid,
  Box
} from "@mui/material";
import { 
  Chart as ChartJS, 
  BarElement, 
  CategoryScale, 
  LinearScale, 
  Tooltip, 
  Legend, 
  ArcElement, 
  PointElement, 
  LineElement 
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { getSites } from "../../../../store/thunk/site";

// Register ChartJS components
ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const EnergyPrediction = ({ loggedInUserData, siteSelectedForGlobal, sites }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [openCost, setOpenCost] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [openBulk, setopenBulk] = useState(false);
  const [bulkUploadCost, setbulkUploadCost] = useState([]);
  const [bulkUploadReading, setbulkUploadReading] = useState([]);
  const [actionSurvey, setActionSurvey] = useState();
  const [openReading, setOpenReading] = useState(false);
  const [typeoptions, settypeoptions] = useState([]);
  const [filteredEnergyCost, setFilteredEnergyCost] = useState([]);
  const [energyCost, setEnergyCost] = useState([]);
  const [checked, setChecked] = useState(true);
  const [allSites, setAllSites] = useState([]);
  const [assets, setAssets] = useState([]);
  const [state, setState] = useState({
    selectedArea: "",
    site1: "",
    site2: "",
    siteComparisonYear: new Date().getFullYear(),
    currentYear: new Date().getFullYear(),
    previousYear: new Date().getFullYear() - 1,
    isIndividual: false,
    monthlyData: null,
    predictions: null,
    buildingArea: 0,
    energyDocuments: []
  });

  const years = Array.from(
    { length: 16 },
    (_, i) => new Date().getFullYear() - i
  );

  useEffect(() => {
    gettypeoptions();
    getAllSites();
    getEnergyCost(false, true);
  }, []);

  // Enhanced prediction methods that consider assets
  const movingAverage = (data, windowSize) => {
    return data.map((_, index) => {
      if (index < windowSize - 1) return null;
      const window = data.slice(index - windowSize + 1, index + 1);
      return window.reduce((sum, val) => sum + val, 0) / windowSize;
    }).filter(val => val !== null);
  };

  const linearRegressionPredict = (data, periodsToPredict, assetsFactor = 1) => {
    if (!data || data.length < 2) return Array(periodsToPredict).fill(0);
    
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    
    data.forEach((val, index) => {
      sumX += index;
      sumY += val;
      sumXY += index * val;
      sumXX += index * index;
    });
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Apply assets factor to the slope to adjust prediction based on assets
    const adjustedSlope = slope * assetsFactor;
    
    return Array(periodsToPredict).fill(0).map((_, i) => adjustedSlope * (n + i) + intercept);
  };

  // Calculate assets factor based on the site's assets
  const calculateAssetsFactor = (assets) => {
    if (!assets || assets.length === 0) return 1; // Default factor if no assets
    
    // Calculate weights based on asset types
    let totalWeight = 0;
    let energyIntensiveCount = 0;
    
    assets.forEach(asset => {
      // Assign higher weights to energy-intensive assets
      if (asset.pfpItem || asset.doorItem || asset.patItem) {
        energyIntensiveCount++;
        totalWeight += 2; // Higher weight for critical assets
      } else {
        totalWeight += 1; // Standard weight for other assets
      }
    });
    
    // Normalize the factor between 0.8 and 1.2 based on assets
    const avgWeight = totalWeight / assets.length;
    const factor = 0.8 + (avgWeight * 0.4); // Scale between 0.8 and 1.2
    
    // Additional adjustment based on energy-intensive assets percentage
    const intensiveRatio = energyIntensiveCount / assets.length;
    const finalFactor = factor * (1 + (intensiveRatio * 0.3)); // Add up to 30% more
    
    return Math.min(Math.max(finalFactor, 0.7), 1.5); // Keep within reasonable bounds
  };

  const predictFutureConsumption = (historicalData, monthsToPredict = 3, assets) => {
  if (!historicalData || historicalData.length < 6) return null;
  
  const assetsFactor = calculateAssetsFactor(assets);
  const electricityData = historicalData.map(item => item.Electricity || 0);
  const gasData = historicalData.map(item => item.Gas || 0);
  
  const electricityPred = linearRegressionPredict(electricityData, monthsToPredict, assetsFactor);
  const gasPred = linearRegressionPredict(gasData, monthsToPredict, assetsFactor);
  
  const lastDate = new Date(
    historicalData[historicalData.length - 1].year, 
    historicalData[historicalData.length - 1].month
  );
  
  return Array(monthsToPredict).fill(0).map((_, i) => {
    const predictionDate = new Date(lastDate);
    predictionDate.setMonth(predictionDate.getMonth() + i + 1);
    
    return {
      monthName: predictionDate.toLocaleString('default', { month: 'short' }), // Changed from month to monthName
      year: predictionDate.getFullYear(),
      Electricity: electricityPred[i] || 0,
      Gas: gasPred[i] || 0,
      isPrediction: true
    };
  });
};

  const processMonthlyData = (energyData) => {
    if (!energyData || energyData.length === 0) return null;
    
    const monthlyConsumption = {};
    
    energyData.forEach(energy => {
      const type = energy.budgetCategory;
      
      energy.readingList.forEach(reading => {
        if (reading.actualConsumption !== null) {
          const date = new Date(reading.readingDate);
          const monthYear = `${date.getFullYear()}-${date.getMonth()}`;
          
          if (!monthlyConsumption[monthYear]) {
            monthlyConsumption[monthYear] = {
              month: date.getMonth(),
              monthName: date.toLocaleString('default', { month: 'short' }),
              year: date.getFullYear(),
              [type]: 0
            };
          }
          
          monthlyConsumption[monthYear][type] = 
            (monthlyConsumption[monthYear][type] || 0) + 
            (reading.actualConsumption || 0);
        }
      });
    });
    
    return Object.values(monthlyConsumption).sort((a, b) => {
      return new Date(a.year, a.month) - new Date(b.year, b.month);
    });
  };

  const prepareCombinedChartData = (historicalData, predictions) => {
    if (!historicalData) return null;
    
    const allData = [...historicalData];
    if (predictions) {
      allData.push(...predictions);
    }
    
    const labels = allData.map(item => `${item.monthName} ${item.year}`);
    const electricityData = allData.map(item => item.Electricity || 0);
    const gasData = allData.map(item => item.Gas || 0);
    
    return {
      labels,
      datasets: [
        {
          label: 'Electricity (kWh)',
          data: electricityData,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          borderDash: allData.map(item => item.isPrediction ? [5, 5] : []),
          pointBackgroundColor: allData.map(item => 
            item.isPrediction ? 'rgba(54, 162, 235, 0.8)' : 'rgba(54, 162, 235, 1)'
          ),
          tension: 0.1
        },
        {
          label: 'Gas (kWh)',
          data: gasData,
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 2,
          borderDash: allData.map(item => item.isPrediction ? [5, 5] : []),
          pointBackgroundColor: allData.map(item => 
            item.isPrediction ? 'rgba(255, 99, 132, 0.8)' : 'rgba(255, 99, 132, 1)'
          ),
          tension: 0.1
        }
      ]
    };
  };

  const prepareEnergyTypeDistribution = (monthlyData) => {
    if (!monthlyData) return null;
    
    let totalElectricity = 0;
    let totalGas = 0;
    
    monthlyData.forEach(item => {
      totalElectricity += item.Electricity || 0;
      totalGas += item.Gas || 0;
    });
    
    return {
      labels: ['Electricity', 'Gas'],
      datasets: [
        {
          data: [totalElectricity, totalGas],
          backgroundColor: [
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 99, 132, 0.5)'
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)'
          ],
          borderWidth: 1
        }
      ]
    };
  };

  const getAllSites = async () => {
    const res = await get("/api/site/site/all?sort=asc&sortName=siteName&withDetails=true");
    setAllSites(res);
  };

  const getSiteName = (siteId) => {
    return (
      allSites?.filter((site) => site?.siteId === siteId)?.[0]?.siteName || "--"
    );
  };

  const gettypeoptions = async () => {
    const lovtypes = await get("/api/lov/ENERGY_COST_BUDGET_CATEGORY");
    settypeoptions(lovtypes?.map((l) => l.lovValue));
  };

  const [formData, setFormData] = useState({
    searchField: "",
  });
  const [formData2, setFormData2] = useState({
    searchField: "",
    type: "",
    subType: "",
    category: "",
    status: "",
  });

  const handleInputChange2 = (e) => {
    const { name, value } = e.target;
    setFormData2({
      ...formData2,
      [name]: value,
    });
  };

  useEffect(() => {
    searchEnergyCost();
  }, [formData2]);

  const deleteEnergyCost = async (id) => {
    await del("/api/energy/cost/" + id);
    getEnergyCost();
    setOpenCost();
  };

  const deleteEnergyReading = async (id) => {
    await del("/api/energy/reading/" + id);
    setOpenReading();
    getEnergyCost();
  };

  const searchEnergyCost = () => {
    let filteredEnergyCost2 = energyCost;
    if (formData2?.budgetCategory?.length > 0) {
      filteredEnergyCost2 = filteredEnergyCost2.filter(
        (sc) => sc.budgetCategory === formData2.budgetCategory
      );
    }

    if (formData2?.searchField?.length > 0 && filteredEnergyCost2?.length > 0) {
      filteredEnergyCost2 = filteredEnergyCost2.filter(
        (sc) =>
          sc?.reference
            ?.toLowerCase()
            .includes(String(formData2?.searchField).toLowerCase()) ||
          sc?.budgetCategory
            ?.toLowerCase()
            .includes(String(formData2?.searchField).toLowerCase())
      );
    }
    setFilteredEnergyCost(filteredEnergyCost2);
  };

  useEffect(() => {
    getEnergyCost(state.isIndividual);
  }, [siteSelectedForGlobal, state.isIndividual]);

  const getFloorArea = () => {
    if (state.isIndividual) {
      const siteInd = allSites.filter(site => site?.siteId == siteSelectedForGlobal?.siteId)?.[0] || {};
      return siteInd?.siteAreaOccupancyData?.totalBuildingArea || 100;
    } else {
      return allSites.reduce((total, site) => 
        total + (site.siteAreaOccupancyData?.totalBuildingArea || 0), 0
      );
    }
  };

  const convertGasToKWh = (volumeInM3) => {
    const calorificValue = 39.5;
    const conversionFactor = 3.6;
    return (volumeInM3 * calorificValue) / conversionFactor;
  };

  const calculateActualConsumption = (readingList) => {
    if (!readingList || readingList.length === 0) return [];
    
    const sortedReadings = [...readingList].sort(
      (a, b) => new Date(a.readingDate) - new Date(b.readingDate)
    );
  
    return sortedReadings.map((reading, index) => {
      if (index === 0) {
        return {
          ...reading,
          actualConsumption: null,
          isEstimated: false,
          convertedValue: reading.readingUnit === 'M3' 
            ? convertGasToKWh(reading.readingValue)
            : reading.readingValue
        };
      }
      
      const prevReading = sortedReadings[index - 1].readingValue;
      const currentReading = reading.readingValue;
      const consumption = currentReading - prevReading;
      
      return {
        ...reading,
        actualConsumption: reading.readingUnit === 'M3'
          ? convertGasToKWh(consumption)
          : consumption,
        isEstimated: false,
        convertedValue: reading.readingUnit === 'M3'
          ? convertGasToKWh(reading.readingValue)
          : reading.readingValue
      };
    });
  };

  const getEnergyCost = async (siteId, isGlobalSite = false) => {
    if (!siteId && !isGlobalSite) {
      toast.error("Please select site from site search to proceed....");
      return;
    }
    setIsLoading(true);
    
    try {
      let energyCostData;
      const targetSiteId = siteId || siteSelectedForGlobal?.siteId;
      
      if (targetSiteId) {
        energyCostData = await get(`/api/energy/site/survey/${targetSiteId}`);
        // Get assets for the site
        const assetsRes = await get(`/api/site/${targetSiteId}/assets`);
        const pfpItem = await get(`/api/site/${targetSiteId}/assets?pfpItem=true`);
        const doorItem = await get(`/api/site/${targetSiteId}/assets?doorItem=true`);
        const patItem = await get(`/api/site/${targetSiteId}/assets?patItem=true`);
        
        const combinedAssets = [
          ...assetsRes?.assets || [],
          ...pfpItem?.assets || [],
          ...doorItem?.assets || [],
          ...patItem?.assets || []
        ];
        
        setAssets(combinedAssets);
        
        // Process each energy record to calculate actual consumption
        const processedEnergyCost = energyCostData.map((energy) => {
          const processedReadings = calculateActualConsumption(energy.readingList || []);
          
          // Process cost dates
          const dates = energy.costList?.map((c) => new Date(c.fromDate)) || [];
          const minDate = dates.length > 0 ? new Date(Math.min(...dates)) : null;
          
          const dates2 = energy.costList?.map((c) => new Date(c.toDate)) || [];
          const maxDate = dates2.length > 0 ? new Date(Math.max(...dates2)) : null;

          return {
            ...energy,
            readingList: processedReadings,
            minDate,
            maxDate
          };
        });

        setEnergyCost(processedEnergyCost);
        setFilteredEnergyCost(processedEnergyCost);

        // Calculate monthly consumption data for charts
        const monthlyData = processMonthlyData(processedEnergyCost);
        const predictions = predictFutureConsumption(monthlyData, 3, combinedAssets);
        
        setState(prev => ({
          ...prev,
          monthlyData,
          predictions,
          buildingArea: getFloorArea()
        }));
      }
    } catch (error) {
      toast.error("Failed to fetch energy data: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCost = async (data) => {
    try {
      data.submittedUserId = loggedInUserData?.id;
      data.siteId = siteSelectedForGlobal?.siteId;
      await post("/api/energy/cost", data);
      getEnergyCost(state.isIndividual);
      toast.success("Energy cost added successfully");
    } catch (error) {
      toast.error("Failed to save energy cost: " + error.message);
    }
  };

  const saveReading = async (data) => {
    try {
      if (data) {
        data.submittedUserId = loggedInUserData?.id;
        data.siteId = siteSelectedForGlobal?.siteId;
        await post("/api/energy/reading", data);
        getEnergyCost(state.isIndividual);
        toast.success("Energy reading added successfully");
      }
    } catch (error) {
      toast.error("Failed to save energy reading: " + error.message);
    }
  };

  const handleSite1Change = async (e) => {
    const siteId = e.target.value;
    setState((prevState) => ({
      ...prevState,
      site1: siteId,
    }));
    if (siteId) {
      getEnergyCost(siteId);
    }
  };

  const handleChange = (event) => {
    setState({
      ...state,
      [event.target.name]: event.target.value,
    });
  };

  const handleToggleChange = (event) => {
    setState({
      ...state,
      [event.target.name]: event.target.checked,
    });
  };

  return (
    <Fragment>
      <Cost
        open={openCost}
        setOpen={setOpenCost}
        typeoptions={typeoptions}
        survey={actionSurvey}
        saveData={saveCost}
        deleteEnergyCost={deleteEnergyCost}
        isViewMode={isViewMode}
      />
      
      <Reading
        open={openReading}
        setOpen={setOpenReading}
        typeoptions={typeoptions}
        survey={actionSurvey}
        saveData={saveReading}
        deleteEnergyReading={deleteEnergyReading}
        isViewMode={isViewMode}
      />

      <div>
        <div>
          <div className="d-flex bd-highlight" style={{ flexWrap: "wrap" }}>
            <div className="pt-2 bd-highlight ">
              <div className="row" style={{ height: "auto" }}>
                <div className="col-md-6">
                  <label htmlFor="site1">Site 1:</label>
                  <select
                    name="site1"
                    className="form-control form-select"
                    id="site1"
                    onChange={handleSite1Change}
                    value={state.site1}
                  >
                    <option value="">Select Site 1</option>
                    {sites
                      ?.filter(
                        (itm) => String(itm?.status).toLowerCase() === "open"
                      )
                      ?.map((itm) => (
                        <option key={itm?.siteId} value={itm?.siteId}>
                          {itm?.siteName}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label htmlFor="siteComparisonYear">Comparison Year:</label>
                  <select
                    name="siteComparisonYear"
                    className="form-control form-select"
                    id="siteComparisonYear"
                    onChange={handleChange}
                    value={state.siteComparisonYear}
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
          </div>
          
          {/* Energy Cost Chart */}
          <div className="row" style={{ height: "auto" }}>
            <div className="col-md-12 mt-2 mb-4">
              {isLoading ? (
                <div className="text-center">
                  <CircularProgress />
                </div>
              ) : (
                <></>
              )}
            </div>
          </div>

          {/* Energy Data Visualization */}
          <div className="row mt-4">
            <div className="col-md-12">
              <Paper elevation={3} style={{ padding: '20px', marginBottom: '20px' }}>
                <Typography variant="h5" gutterBottom>
                  Energy Consumption Analysis
                </Typography>
                
                {state.monthlyData ? (
                  <Grid container spacing={3}>
                    {/* Combined Chart with Predictions */}
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom>
                        Energy Consumption with 3-Month Forecast
                      </Typography>
                      <div style={{ height: '400px' }}>
                        <Line 
                          data={prepareCombinedChartData(state.monthlyData, state.predictions)} 
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
                                    const isPred = state.predictions && 
                                      context.dataIndex >= (state.monthlyData?.length || 0);
                                    return `${label}: ${value.toFixed(2)} kWh${isPred ? ' (predicted)' : ''}`;
                                  }
                                }
                              }
                            }
                          }}
                        />
                      </div>
                      {state.predictions && (
                        <Box mt={2}>
                          <Typography variant="subtitle1">Predicted Consumption:</Typography>
                          <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
                            {state.predictions.map((pred, index) => (
                              <li key={index}>
                                <strong>{pred.monthName} {pred.year}:</strong>
                                <ul style={{ listStyleType: 'none', paddingLeft: '20px' }}>
                                  <li>Electricity: {pred.Electricity?.toFixed(2) || 'N/A'} kWh</li>
                                  <li>Gas: {pred.Gas?.toFixed(2) || 'N/A'} kWh</li>
                                </ul>
                              </li>
                            ))}
                          </ul>
                        </Box>
                      )}
                    </Grid>

                    {/* Energy Distribution */}
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" gutterBottom>
                        Energy Distribution by Type
                      </Typography>
                      <div style={{ height: '300px' }}>
                        <Pie 
                          data={prepareEnergyTypeDistribution(state.monthlyData)} 
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              tooltip: {
                                callbacks: {
                                  label: (context) => {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = Math.round((value / total) * 100);
                                    return `${label}: ${value.toFixed(2)} kWh (${percentage}%)`;
                                  }
                                }
                              }
                            }
                          }}
                        />
                      </div>
                    </Grid>

                    {/* Recent Consumption */}
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" gutterBottom>
                        Recent Trends (Last 6 Months)
                      </Typography>
                      <div style={{ height: '300px' }}>
                        <Bar 
                          data={prepareCombinedChartData(
                            state.monthlyData.slice(-6), 
                            state.predictions
                          )} 
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
                            }
                          }}
                        />
                      </div>
                    </Grid>

                    {/* Assets Summary */}
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom>
                        Site Assets Summary (Energy Impact Factors)
                      </Typography>
                      <Paper elevation={2} style={{ padding: '15px' }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={4}>
                            <Typography variant="subtitle1">
                              Total Assets: {assets.length}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Typography variant="subtitle1">
                              PFP Items: {assets.filter(a => a.pfpItem).length}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Typography variant="subtitle1">
                              Door Items: {assets.filter(a => a.doorItem).length}
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="body2" color="textSecondary">
                              Prediction adjustment factor applied: {calculateAssetsFactor(assets).toFixed(2)}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>
                  </Grid>
                ) : (
                  <Typography variant="body1" style={{ textAlign: 'center' }}>
                    {isLoading ? 'Loading energy data...' : 'No energy data available'}
                  </Typography>
                )}
              </Paper>
            </div>
          </div>
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

export default connect(mapStateToProps, { getSites })(EnergyPrediction);