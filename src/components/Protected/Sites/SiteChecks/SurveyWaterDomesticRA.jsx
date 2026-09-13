import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { get, post, put } from "../../../../api";
import {
  Grid, TextField, Typography, Box, Accordion, Chip, AccordionSummary, AccordionDetails, Card, CardContent, Autocomplete,
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { getSiteAssets, getSiteLayout } from "../../../../store/thunk/site";

const SurveyWaterDomesticRA = ({ checkId, siteAssets, getSiteAssets, siteSelectedForGlobal, getSiteLayout }) => {
  const navigate = useNavigate();

  const [risks, setrisks] = useState([0, 0, 0, 0])
  const [totalrisks, settotalrisks] = useState(0)
  const [answeredRiskFactors, setAnsweredRiskFactors] = useState(0);
  const [totalRiskFactors, setTotalRiskFactors] = useState(0);
  const [scoreoptions, setscoreoptions] = useState(null);


  useEffect(() => {
    
    getRiskFactor();
    if (siteSelectedForGlobal?.siteId) {
      getSiteAssets(siteSelectedForGlobal?.siteId);
      getSiteAssets(siteSelectedForGlobal?.siteId);
      getSiteLayout(siteSelectedForGlobal?.siteId)
    }
  }, []);

  // const defaultQuestions = [
  //   {
  //     q: "Make up water source to system",
  //     s: 1
  //   },
  //   {
  //     q: "Pre-treatment (softening etc.)",
  //     s: 1
  //   },
  //   {
  //     q: "Storage tank orientation",
  //     s: 1
  //   },
  //   {
  //     q: "Tank fitting orientation",
  //     s: 0
  //   },
  //   {
  //     q: "Tank internal condition",
  //     s: 0
  //   },
  //   {
  //     q: "Tank lid and screens",
  //     s: 1
  //   },
  //   {
  //     q: "Tank insulation and temperature gain",
  //     s: 0
  //   },
  //   {
  //     q: "Access to tank(s) for disinfection and cleaning",
  //     s: 1
  //   },
  //   {
  //     q: "Disinfection and cleaning of tank",
  //     s: 1
  //   },
  //   {
  //     q: "Calorifier or water heaters",
  //     s:1
  //   },
  // ]

  // const temp = async () => {
  //   for (let d of defaultQuestions) {
  //     const data = {
  //       riskFactor: d.q,
  //       weight: d.s
  //     }
  //     await post("/api/site-check/ra-survey-risk-factors", data)
  //   }


  // }

  const getRiskFactor = async () => {
    const scoreoptionsall = await get("/api/lov/SITE_CHECK_DOMESTIC_RA_SCORES");
    setscoreoptions(scoreoptionsall);
    const riskFactorFromDB = await get("/api/site-check/ra-survey-risk-factors")
    const riskFactorResponse = await get("/api/site-check/domestic-ra-survey/" + checkId)
    riskFactorFromDB.forEach(q => {
      const resIdx = riskFactorResponse.findIndex(r => r.riskFactorId === q.riskFactorID);
      if (resIdx >= 0) {
        q.status = "Closed";
        q.response = riskFactorResponse[resIdx]
        q.completed = true
      } else {
        q.status = "Open";
        q.response = {
          riskFactorId: q.riskFactorID
        }
        q.completed = false
      }
    })
    const risksN = [0, 0, 0, 0]
    let weightedScore = 0
    riskFactorResponse.forEach(r => {
      const responseWeightedScore = Number(r?.weightedScore ?? 0);
      const safeWeightedScore = Number.isFinite(responseWeightedScore) ? responseWeightedScore : 0;
      weightedScore += safeWeightedScore;
      if (safeWeightedScore > 17) {
        risksN[0] = risksN[0] + 1;
      } else if (safeWeightedScore > 10) {
        risksN[1] = risksN[1] + 1;
      } else if (safeWeightedScore > 5) {
        risksN[2] = risksN[2] + 1;
      } else {
        risksN[3] = risksN[3] + 1;
      }

    })

    const answeredCount = riskFactorResponse.filter((response) => {
      const score = response?.score;
      return score !== null && score !== undefined && String(score).trim() !== "";
    }).length;

    setrisks(risksN)
    setAnsweredRiskFactors(answeredCount);
    setTotalRiskFactors(riskFactorFromDB.length);
    settotalrisks(weightedScore)
    setRiskFactor(riskFactorFromDB);
    const body = {
      riskScoreRed: risksN[0],
      riskScoreAmber: risksN[1],
      riskScoreYellow: risksN[2],
      riskScoreGreen: risksN[3],
    }
    await put("/api/site-check/" + checkId, body);
  }

  const [riskFactor, setRiskFactor] = useState([]);
  const [openIndex, setOpenIndex] = useState(0);

  const handleInputChange = (e, idx) => {
    const { name, value } = e.target;
    const uquest = [...riskFactor]
    const udata = {
      ...riskFactor[idx].response,
      [name]: value,
    }
    uquest[idx].response = udata
    setRiskFactor(uquest);
  };

  const saveRiskFactor = async (event, index) => {
    event.preventDefault();
    const form = event.target;
    if (!form.checkValidity()) {
      form.reportValidity();
    }
    const dataToSave = riskFactor[index].response;
    if (dataToSave.responseDate) {
      dataToSave.responseDate = new Date(dataToSave.responseDate);
    }
    dataToSave.checkId = checkId;
    dataToSave.status = "Closed";
    dataToSave.weightedScore = Number(dataToSave.score ?? 0) * Number(riskFactor[index].weight ?? 0)
    dataToSave.totalRiskScore = Number(dataToSave.consequence ?? 0) * Number(dataToSave.likelihood ?? 0)
    await post("/api/site-check/domestic-ra-survey", dataToSave);
    await getRiskFactor();
    toast.success("Survey response saved")
  }


  const getChipColor = (score) => {
    let style = {
      marginLeft: '5px',
      border: '1px solid #0b903f',
      color: '#0b903f',
      backgroundColor: '#e2f0e6'
    }
    if (score > 17) {
      style.color = '#EF0505'
      style.backgroundColor = '#F6E4E4'
      style.border = '1px solid #EF0505 '
    } else if (score > 10) {
      style.color = '#ff6700'
      style.border = '1px solid #ff6700'
      style.backgroundColor = '#ffd7b5'
    } else if (score > 5) {
      style.color = '#B39200'
      style.border = '1px solid #B39200'
      style.backgroundColor = '#FDF8E1'
    }
    return style
  }


  const isRiskSummaryComplete =
    totalRiskFactors > 0 && answeredRiskFactors === totalRiskFactors;

  const overallRiskBand = !isRiskSummaryComplete
    ? null
    : totalrisks > 250
      ? "high"
      : totalrisks >= 150
        ? "medium"
        : "low";

  const riskBandMeta = {
    high: {
      label: "High Risk",
      range: ">250",
      color: "#b42318",
      dark: "#7a271a",
      soft: "#fef3f2",
      border: "#fda29b",
    },
    medium: {
      label: "Medium Risk",
      range: "150 - 250",
      color: "#b54708",
      dark: "#7a2e0e",
      soft: "#fffaeb",
      border: "#fec84b",
    },
    low: {
      label: "Low Risk",
      range: "<150",
      color: "#027a48",
      dark: "#05603a",
      soft: "#ecfdf3",
      border: "#6ce9a6",
    },
    incomplete: {
      label: "Survey Incomplete",
      range: "Complete all factors",
      color: "#175cd3",
      dark: "#1849a9",
      soft: "#eff8ff",
      border: "#84caff",
    },
  };

  const currentSummaryMeta = riskBandMeta[overallRiskBand || "incomplete"];
  const completionPercent = totalRiskFactors > 0
    ? Math.round((answeredRiskFactors / totalRiskFactors) * 100)
    : 0;

  const getFactorRiskMeta = (response) => {
    const score = response?.score;
    const hasScore = score !== null && score !== undefined && String(score).trim() !== "";
    if (!hasScore) {
      return {
        label: "Not scored",
        color: "#667085",
        soft: "#f9fafb",
        border: "#d0d5dd",
      };
    }

    const weightedScore = Number(response?.weightedScore ?? 0);
    const safeWeightedScore = Number.isFinite(weightedScore) ? weightedScore : 0;
    if (safeWeightedScore > 17) {
      return { label: "High factor", color: "#b42318", soft: "#fef3f2", border: "#fda29b" };
    }
    if (safeWeightedScore > 10) {
      return { label: "Elevated", color: "#c4320a", soft: "#fff6ed", border: "#fdba74" };
    }
    if (safeWeightedScore > 5) {
      return { label: "Moderate", color: "#b54708", soft: "#fffaeb", border: "#fec84b" };
    }
    return { label: "Low factor", color: "#027a48", soft: "#ecfdf3", border: "#6ce9a6" };
  };

  const riskBandStyle = (band) => {
    const meta = riskBandMeta[band];
    const active = isRiskSummaryComplete && overallRiskBand === band;
    return {
      flex: "1 1 118px",
      minWidth: "112px",
      borderRadius: "14px",
      border: `1px solid ${meta.border}`,
      background: active
        ? `linear-gradient(135deg, ${meta.color} 0%, ${meta.dark} 100%)`
        : meta.soft,
      color: active ? "#ffffff" : meta.dark,
      padding: "14px 16px",
      boxShadow: active ? `0 10px 22px ${meta.border}80` : "none",
      transform: active ? "translateY(-2px)" : "none",
      opacity: isRiskSummaryComplete ? (active ? 1 : 0.74) : 0.68,
      transition: "all 0.18s ease-in-out",
    };
  };

  return (

    <Box p={3}>
      <Card
        sx={{
          borderRadius: 3,
          overflow: "hidden",
          border: `1px solid ${currentSummaryMeta.border}`,
          boxShadow: "0 10px 28px rgba(16, 24, 40, 0.08)",
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Box
            sx={{
              mb: 3,
              p: { xs: 2, md: 2.5 },
              borderRadius: 3,
              background: `linear-gradient(135deg, ${currentSummaryMeta.soft} 0%, #ffffff 72%)`,
              borderLeft: `6px solid ${currentSummaryMeta.color}`,
            }}
          >
            <Grid container alignItems="stretch" spacing={2.5}>
              <Grid item xs={12} lg={5}>
                <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
                  <Box>
                    <Typography
                      variant="overline"
                      sx={{ color: currentSummaryMeta.color, fontWeight: 800, letterSpacing: 1.1 }}
                    >
                      Risk Factor Summary
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: "#101828", mt: -0.4 }}>
                      {currentSummaryMeta.label}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      minWidth: 94,
                      textAlign: "center",
                      px: 1.5,
                      py: 1,
                      borderRadius: 2.5,
                      backgroundColor: "#ffffff",
                      border: `1px solid ${currentSummaryMeta.border}`,
                    }}
                  >
                    <Typography variant="caption" sx={{ color: "#667085", fontWeight: 700 }}>
                      SCORE
                    </Typography>
                    <Typography variant="h4" sx={{ lineHeight: 1.05, fontWeight: 900, color: currentSummaryMeta.color }}>
                      {totalrisks}
                    </Typography>
                  </Box>
                </Box>

                <Box mt={2}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.75}>
                    <Typography variant="body2" sx={{ color: "#475467", fontWeight: 600 }}>
                      Assessment progress
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#344054", fontWeight: 800 }}>
                      {answeredRiskFactors} / {totalRiskFactors} ({completionPercent}%)
                    </Typography>
                  </Box>
                  <Box sx={{ height: 10, borderRadius: 10, overflow: "hidden", backgroundColor: "#eaecf0" }}>
                    <Box
                      sx={{
                        width: `${completionPercent}%`,
                        height: "100%",
                        borderRadius: 10,
                        background: `linear-gradient(90deg, ${currentSummaryMeta.color}, ${currentSummaryMeta.dark})`,
                        transition: "width 0.25s ease",
                      }}
                    />
                  </Box>
                </Box>

                <Box
                  mt={2}
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1,
                    color: currentSummaryMeta.dark,
                  }}
                >
                  <InfoOutlinedIcon sx={{ fontSize: 19, mt: "1px" }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {isRiskSummaryComplete
                      ? `Assessment complete. Overall weighted score ${totalrisks} is ${String(overallRiskBand).toUpperCase()} risk.`
                      : "Complete all 35 risk factors before a final Low, Medium or High overall risk rating is assigned."}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} lg={7}>
                <Box
                  sx={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.25,
                    flexWrap: { xs: "wrap", sm: "nowrap" },
                  }}
                >
                  {["high", "medium", "low"].map((band) => {
                    const meta = riskBandMeta[band];
                    return (
                      <Box key={band} sx={riskBandStyle(band)}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900, textTransform: "uppercase", letterSpacing: 0.4 }}>
                          {meta.label}
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 900, mt: 0.5 }}>
                          {meta.range}
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.88 }}>
                          Overall weighted score
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Grid>
            </Grid>
          </Box>

          {riskFactor?.map((q, idx) => {
            const factorMeta = getFactorRiskMeta(riskFactor[idx]?.response);
            const factorWeightedScore = riskFactor[idx]?.response?.weightedScore ?? 0;

            return (<Accordion
              defaultExpanded={idx === openIndex}
              sx={{
                mb: 1.25,
                borderRadius: "10px !important",
                border: `1px solid ${factorMeta.border}`,
                borderLeft: `5px solid ${factorMeta.color}`,
                boxShadow: "0 2px 8px rgba(16, 24, 40, 0.05)",
                overflow: "hidden",
                "&:before": { display: "none" },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMore sx={{ color: factorMeta.color }} />}
                sx={{
                  backgroundColor: factorMeta.soft,
                  "& .MuiAccordionSummary-content": {
                    alignItems: "center",
                    gap: 1.25,
                    flexWrap: "wrap",
                  },
                }}
              >
                <Typography sx={{ fontWeight: 700, color: "#101828", flex: "1 1 280px" }}>
                  {q.riskFactor}
                </Typography>
                <Chip
                  size="small"
                  label={factorMeta.label}
                  sx={{
                    fontWeight: 800,
                    color: factorMeta.color,
                    backgroundColor: "#ffffff",
                    border: `1px solid ${factorMeta.border}`,
                  }}
                />
                <Chip
                  size="small"
                  label={`Weighted Score: ${factorWeightedScore}`}
                  sx={{
                    fontWeight: 800,
                    color: factorMeta.color,
                    backgroundColor: factorMeta.soft,
                    border: `1px solid ${factorMeta.border}`,
                  }}
                />
                  {/* <Chip
                    style={getChipColor(riskFactor[idx]?.response?.totalRiskScore)}
                    label={"Risk Score : " + (riskFactor[idx]?.response?.totalRiskScore ?? 0)}
                  /> */}
                
              </AccordionSummary>
              <form onSubmit={(e) => {
                setOpenIndex(idx + 1);
                saveRiskFactor(e, idx);
              }}>
              <AccordionDetails>
                <Grid container spacing={2}>
                  {/* <Grid item xs={6}>
                    <label htmlFor="responseDate" name="responseDate">
                      Date
                    </label>
                      <input
                        required
                      type="date"
                      name="responseDate"
                      disabled={riskFactor[idx]?.completed}
                      className="form-control"
                      onChange={(e) => handleInputChange(e, idx)}
                      value={String(riskFactor[idx]?.response?.responseDate)?.substring(0, 10)}
                    />

                  </Grid> */}
                  <Grid item xs={12} sm={6}>
                    <label htmlFor="score" name="score">
                      Score
                    </label>
                      <select
                        required
                      //disabled={riskFactor[idx]?.completed}
                      className="form-control form-select"
                      name="score"
                      onChange={(e) => handleInputChange(e, idx)}
                      value={riskFactor[idx]?.response?.score}
                    >
                      <option value="">Select </option>
                      {scoreoptions.sort((a, b) => Number(a.lovValue) - Number(b.lovValue)).filter(o => o.attribite1 === String(q?.riskFactorID)).map(o =>(
                        <option value={o.lovValue}> {o.lovValue} -  {o.lovDesc} </option>
                      ))}
                    </select>
                  </Grid>
                  <Grid item xs={6}>
                    <Autocomplete
                      //disabled={riskFactor[idx]?.completed}
                      multiple
                      onChange={(event, item) => {
                        const uquest = [...riskFactor]

                        uquest[idx].response = {
                          ...uquest[idx].response,
                          assets: item.map(i => i.key).join(",")
                        }
                        setRiskFactor(uquest);
                      }}
                      value={siteAssets?.filter(s => riskFactor[idx]?.response?.assets?.split(",")?.includes(s.assetId.toString())).map((option) => { return { key: option.assetId, label: option.assetName + " - " + option.category } })}

                      options={siteAssets?.map((option) => { return { key: option.assetId, label: option.assetName + " - " + option.category } })}
                      getOptionLabel={(option) => option.label}

                      
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          //required
                          variant="outlined"
                          label="Search Asset"
                        //placeholder="Assets"
                        />
                      )}
                    />
                  </Grid>


                  <Grid item xs={12}>
                    <label htmlFor="observation" name="observation">
                      Observation
                    </label>
                      <textarea
                        //required
                      //disabled={riskFactor[idx]?.completed}
                      name="observation"
                      className="form-control"
                      id="observation"
                      rows="4"
                      placeholder="Enter notes..."
                      value={riskFactor[idx]?.response?.observation}
                      onChange={(e) => handleInputChange(e, idx)}
                      style={{ width: '100%', padding: '10px', margin: '8px 0', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div>
                        <label htmlFor="score1" name="score1">
                          Score
                        </label>
                        <input
                          name="score1"
                          id="score1"
                          style={{ width: '100px' }}
                          type="text"
autoComplete="off"
          readOnly
          onFocus={(e) => e.target.removeAttribute("readonly")}
                          className="form-control"
                          disabled
                          value={riskFactor[idx]?.response?.score ?? 0}
                        />
                      </div>
                      <h1 style={{ lineHeight: '2' }}>X</h1>
                      <div>
                        <label htmlFor="score1" name="score1">
                          Weight
                        </label>
                        <input
                          type="text"
autoComplete="off"
          readOnly
          onFocus={(e) => e.target.removeAttribute("readonly")}
                          style={{ width: '100px' }}
                          className="form-control"
                          disabled
                          value={riskFactor[idx]?.weight}
                        />
                      </div>
                      <h1 style={{ lineHeight: '2' }}>=</h1>
                      <div>
                        <label htmlFor="score1" name="score1">
                          Weighted Score
                        </label>
                        <input
                          style={{ width: '130px' }}
                          type="text"
autoComplete="off"
          readOnly
          onFocus={(e) => e.target.removeAttribute("readonly")}
                          className="form-control"
                          disabled
                          value={riskFactor[idx]?.weight * Number(riskFactor[idx]?.response?.score ?? 0)}
                        />
                      </div>
                    </div>

                  </Grid>
                  




                  {/* <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Risk Score Card (<strong>Total Risk Score = {(riskFactor[idx]?.response?.consequence ?? 0) * (riskFactor[idx]?.response?.likelihood ?? 0)}</strong>)
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Grid item xs={12} sm={12}>
                          <label htmlFor="consequence" name="consequence">
                            Consequence
                          </label>
                          <select
                            disabled={riskFactor[idx]?.completed}
                            className="form-control form-select"
                            name="consequence"
                            value={riskFactor[idx]?.response?.consequence}
                            onChange={(e) => handleInputChange(e, idx)}
                          >
                            <option value="">Select </option>
                            {[1, 2, 3, 4, 5].map((num) => (
                              <option value={num}>{num} </option>
                            ))}
                          </select>

                        </Grid>
                        <Grid item xs={12} sm={12}>

                          <label htmlFor="likelihood" name="likelihood">
                            Likelihood
                          </label>
                          <select
                            disabled={riskFactor[idx]?.completed}
                            className="form-control form-select"
                            name="likelihood"
                            value={riskFactor[idx]?.response?.likelihood}
                            onChange={(e) => handleInputChange(e, idx)}
                          >
                            <option value="">Select </option>
                            {[1, 2, 3, 4, 5].map((num) => (
                              <option value={num}>{num} </option>
                            ))}
                          </select>
                        </Grid>
                      </Grid>
                      <Grid item xs={12} sm={8}>
                        <Box
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          p={2}
                          mb={2}
                          style={{
                            height: '290px',
                            marginTop: '-70px'
                          }}
                        >
                          <img
                            src="/RiskScore.png"
                            alt="Risk Score Matrix"
                            style={{ width: '100%', height: '100%' }}
                          />
                        </Box>
                      </Grid>
                    </Grid> 
                  </Grid>*/}
                  {/* <Grid item xs={12}>
                    <label htmlFor="action" name="action">
                      Suggested Action
                    </label>
                      <textarea
                        required
                      disabled={riskFactor[idx]?.completed}
                      name="action"
                      className="form-control"
                      id="action"
                      rows="4"
                      placeholder="Enter notes..."
                      value={riskFactor[idx]?.response?.action}
                      onChange={(e) => handleInputChange(e, idx)}
                      style={{ width: '100%', padding: '10px', margin: '8px 0', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                  </Grid> */}
                  
                    <Grid item xs={12}>

                      <button
                        style={{ width: "150px", marginBottom: '20px', margin: '10px', float: 'right' }}
                        className="btn btn-primary text-white pr-2"
                        type="submit"
                      >
                        Save & Continue
                      </button>
                      <button
                        style={{ width: "150px", marginBottom: '20px', margin: '10px', float: 'right' }}
                          className="btn btn-primary btn-light"
                          type="button"
                        >
                          
                        Cancel
                      </button>


                    </Grid>
                </Grid>
                </AccordionDetails>
              </form>
            </Accordion>)
          }
          )}
        </CardContent>
      </Card>
    </Box>

  );
};

const mapStateToProps = (state) => ({
  siteAssets: state.site.siteAssets,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
  siteLayout: state.site.siteLayout,
});
export default connect(mapStateToProps, { getSiteAssets, getSiteLayout })(
  SurveyWaterDomesticRA
);

