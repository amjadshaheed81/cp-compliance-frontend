import React, { useState } from "react";
import { Grid, Typography, Box, Button, CircularProgress } from "@mui/material";
import { toast } from "react-toastify";
import {post, put} from "../../../../api";
import moment from "moment"; // Adjust the import path as needed

const RiskScoreCard = ({
                           consequence: initialConsequence,
                           desc = "",
                           likelihood: initialLikelihood,
                           observation: initialObservation,
                           requiredAction: initialSuggestedAction,
                           disabled = false,
                           onRiskAssessmentComplete, // Optional callback when action is raised
                           siteId, // Required for API call
                           assignedTo, // Required for API call
                           createdBy, // Required for API call
                       }) => {
    const [riskData, setRiskData] = useState({
        consequence: initialConsequence || null,
        likelihood: initialLikelihood || null,
        observation: initialObservation || "",
        requiredAction: initialSuggestedAction || "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const totalRiskScore = (riskData.consequence || 0) * (riskData.likelihood || 0);

    // Determine priority based on risk score
    const calculatePriority = (score) => {
        if (score > 17) return 9;
        if (score > 10) return 7;
        if (score > 5) return 5;
        return 3;
    };

    const currentPriority = calculatePriority(totalRiskScore);

    // Calculate due date based on risk score
    const calculateDueDate = (riskScore) => {
        const now = new Date();
        if (riskScore > 17) return new Date(now.setDate(now.getDate() + 5));  // <5 days
        if (riskScore > 10) return new Date(now.setDate(now.getDate() + 30)); // <30 days
        if (riskScore > 5) return new Date(now.setDate(now.getDate() + 90));  // <90 days
        return new Date(now.setDate(now.getDate() + 365));                    // <365 days
    };

    const handleConsequenceChange = (e) => {
        const consequence = parseInt(e.target.value);
        setRiskData({
            ...riskData,
            consequence,
        });
    };

    const handleLikelihoodChange = (e) => {
        const likelihood = parseInt(e.target.value);
        setRiskData({
            ...riskData,
            likelihood,
        });
    };

    const handleObservationChange = (e) => {
        setRiskData({
            ...riskData,
            observation: e.target.value,
        });
    };

    const handleSuggestedActionChange = (e) => {
        setRiskData({
            ...riskData,
            requiredAction: e.target.value,
        });
    };

    const handleRaiseAction = async () => {
        if (!riskData.consequence || !riskData.likelihood) {
            toast.error("Please select both consequence and likelihood");
            return;
        }
        if (!riskData.observation) {
            toast.error("Please enter observation");
            return;
        }
        if (!riskData.suggestedAction) {
            toast.error("Please enter suggested action");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                siteId,
                desc: `${desc} - ${moment(new Date()).format("DD/MM/YYYY")}`,
                observation: riskData.observation,
                requiredAction: riskData.requiredAction,
                consequence: riskData.consequence,
                likelihood: riskData.likelihood,
                totalRiskScore,
                priority: currentPriority,
                type: "Safety Risk",
                status: "Reported",
                assignedTo,
                createdBy,
                dueDate: calculateDueDate(totalRiskScore).toISOString(),
            };

            const response = await put("/api/site/actions", payload);

            toast.success("Risk assessment action raised successfully!");

            if (onRiskAssessmentComplete) {
                onRiskAssessmentComplete(response.data);
            }
        } catch (error) {
            console.error("Error raising risk assessment action:", error);
            toast.error("Failed to raise action. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Grid container spacing={2}>
            <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                    Risk Score Card (<strong>Total Risk Score = {totalRiskScore}</strong>)
                </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
                <label htmlFor="observation" name="observation">
                    Observation
                </label>
                <textarea
                    disabled={disabled}
                    name="observation"
                    className="form-control"
                    id="observation"
                    rows="4"
                    placeholder="Enter observation..."
                    value={riskData.observation}
                    onChange={(e) => handleObservationChange(e)}
                    style={{
                        width: "100%",
                        padding: "10px",
                        margin: "8px 0",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                    }}
                />
            </Grid>

            <Grid item xs={12} md={6}>
                <label htmlFor="requiredAction" >
                    Suggested Action
                </label>
                <textarea
                    disabled={disabled}
                    className="form-control"
                    id="suggestedAction"
                    rows="4"
                    placeholder="Enter suggested action..."
                    value={riskData.requiredAction}
                    onChange={(e) => handleSuggestedActionChange(e)}
                    style={{
                        width: "100%",
                        padding: "10px",
                        margin: "8px 0",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                    }}
                />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
                <label htmlFor="consequence" name="consequence">
                    Consequence
                </label>
                <select
                    required
                    disabled={disabled}
                    className="form-control form-select"
                    name="consequence"
                    value={riskData.consequence || ""}
                    onChange={handleConsequenceChange}
                    style={{
                        width: "100%",
                        padding: "10px",
                        margin: "8px 0",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                    }}
                >
                    <option value="">Select</option>
                    {[1, 2, 3, 4, 5].map((num) => (
                        <option key={`consequence-${num}`} value={num}>
                            {num}
                        </option>
                    ))}
                </select>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
                <label htmlFor="likelihood" name="likelihood">
                    Likelihood
                </label>
                <select
                    required
                    disabled={disabled}
                    className="form-control form-select"
                    name="likelihood"
                    value={riskData.likelihood || ""}
                    onChange={handleLikelihoodChange}
                    style={{
                        width: "100%",
                        padding: "10px",
                        margin: "8px 0",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                    }}
                >
                    <option value="">Select</option>
                    {[1, 2, 3, 4, 5].map((num) => (
                        <option key={`likelihood-${num}`} value={num}>
                            {num}
                        </option>
                    ))}
                </select>
            </Grid>

            <Grid item xs={12} md={6}>
                <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    p={2}
                    style={{
                        height: "100%",
                        minHeight: "150px",
                    }}
                >
                    <img
                        src="/RiskScore.png"
                        alt="Risk Score Matrix"
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                        }}
                    />
                </Box>
            </Grid>

            {/*<Grid item xs={12}>*/}
            {/*    <Box mt={2}>*/}
            {/*        <Typography variant="subtitle1">*/}
            {/*            <strong>Priority: {currentPriority}</strong>*/}
            {/*        </Typography>*/}
            {/*        {currentPriority === 9 && (*/}
            {/*            <Typography variant="body2" color="error">*/}
            {/*                Immediate Action must be taken &lt; 5 days*/}
            {/*            </Typography>*/}
            {/*        )}*/}
            {/*        {(currentPriority === 7 || currentPriority === 8) && (*/}
            {/*            <Typography variant="body2" color="warning">*/}
            {/*                Priority actions to be taken &lt; 30 days*/}
            {/*            </Typography>*/}
            {/*        )}*/}
            {/*        {(currentPriority === 5 || currentPriority === 6) && (*/}
            {/*            <Typography variant="body2" color="info">*/}
            {/*                Action to be taken within a reasonable timescale &lt; 90 days*/}
            {/*            </Typography>*/}
            {/*        )}*/}
            {/*        {currentPriority <= 4 && (*/}
            {/*            <Typography variant="body2" color="textSecondary">*/}
            {/*                Action when removal/upgrade work is undertaken &lt; 365 days*/}
            {/*            </Typography>*/}
            {/*        )}*/}
            {/*    </Box>*/}
            {/*</Grid>*/}

            <Grid item xs={12}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleRaiseAction}
                    disabled={disabled || isSubmitting}
                    startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
                >
                    {isSubmitting ? "Raising Action..." : "Raise Action"}
                </Button>
            </Grid>
        </Grid>
    );
};

export default RiskScoreCard;