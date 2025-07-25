import React, { useState, useCallback } from "react";
import { Grid, Typography, Box, Button, CircularProgress, FormControl, InputLabel, Select, MenuItem, TextareaAutosize } from "@mui/material";
import { toast } from "react-toastify";
import { put } from "../../../../api";
import moment from "moment";
import PropTypes from "prop-types";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

const RiskScoreCard = ({
                           consequence: initialConsequence,
                           desc = "",
                           likelihood: initialLikelihood,
                           observation: initialObservation,
                           requiredAction: initialSuggestedAction,
                           disabled = false,
                           onRiskAssessmentComplete,
                           siteId,
                           checkId,
                           taggedAsset,
                           createdBy,
                           actionRaised,
                           images = [],
                       }) => {
    const [riskData, setRiskData] = useState({
        consequence: initialConsequence || null,
        likelihood: initialLikelihood || null,
        observation: initialObservation || "",
        requiredAction: initialSuggestedAction || "",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const calculatePriority = useCallback((score) => {
        if (score > 17) return 9;
        if (score > 10) return 7;
        if (score > 5) return 5;
        return 3;
    }, []);

    const calculateDueDate = useCallback((riskScore) => {
        const now = new Date();
        if (riskScore > 17) return new Date(now.setDate(now.getDate() + 5));
        if (riskScore > 10) return new Date(now.setDate(now.getDate() + 30));
        if (riskScore > 5) return new Date(now.setDate(now.getDate() + 90));
        return new Date(now.setDate(now.getDate() + 365));
    }, []);

    const totalRiskScore =
        riskData.consequence !== null && riskData.likelihood !== null
            ? riskData.consequence * riskData.likelihood
            : 1;
    const currentPriority = calculatePriority(totalRiskScore);

    const handleInputChange = (field) => (e) => {
        const value = field === 'consequence' || field === 'likelihood'
            ? parseInt(e.target.value)
            : e.target.value;

        setRiskData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const validateForm = () => {
        if (riskData.consequence === null || riskData.likelihood === null) {
            toast.error("Please select both Consequence and Likelihood");
            return false;
        }
        if (!riskData.observation.trim()) {
            toast.error("Please enter Observation");
            return false;
        }
        if (!riskData.requiredAction.trim()) {
            toast.error("Please enter Required Action");
            return false;
        }
        return true;
    };

    const handleRaiseAction = async () => {
        if (!validateForm() || actionRaised) return;
        setIsSubmitting(true);

        try {
            const payload = {
                siteId,
                checkId,
                desc: `${desc} - ${moment(new Date()).format("DD/MM/YYYY")}`,
                observation: riskData.observation.trim(),
                requiredAction: riskData.requiredAction.trim(),
                consequence: riskData.consequence,
                likelihood: riskData.likelihood,
                riskScore: totalRiskScore,
                priority: currentPriority,
                type: "Inspection",
                status: "Reported",
                createdBy,
                taggedAsset,
                dueDate: calculateDueDate(totalRiskScore).toISOString(),
                images: (images || []).filter(img => img?.url).map(img => ({
                    checkId: checkId,
                    responseId: img.responseId || null,
                    imageUrl: img.url.split('?')[0], // Remove SAS token for storage
                    fileName: img.fileName || `action_image_${Date.now()}`,
                    documentId: img.documentId || uuidv4(),
                })),
            };

            // Make the API call using axios
            const response = await axios.put("/api/site/actions", payload);

            // Handle different response structures
            let actionId;
            let actionResponse;

            if (response.data && response.data.actionId) {
                // Case 1: Response has data with actionId
                actionId = response.data.actionId;
                actionResponse = response.data;
            } else if (response.actionId) {
                // Case 2: Response is the action object directly
                actionId = response.actionId;
                actionResponse = response;
            } else {
                // Case 3: Unexpected response structure
                console.error("Unexpected response structure:", response);
                throw new Error("Unexpected response structure from server");
            }

            // Create a normalized action object
            const normalizedAction = {
                actionId,
                ...actionResponse,
                // Ensure required fields exist
                observation: actionResponse.observation || riskData.observation,
                requiredAction: actionResponse.requiredAction || riskData.requiredAction,
                riskScore: actionResponse.riskScore || totalRiskScore,
            };

            if (onRiskAssessmentComplete) {
                onRiskAssessmentComplete(normalizedAction);
            }

            return normalizedAction;
        } catch (error) {
            console.error("Error raising risk assessment action:", error);

            let errorMessage = "Failed to raise action. Please try again.";
            if (error.response) {
                // The request was made and the server responded with a status code
                errorMessage = error.response.data?.message ||
                    error.response.statusText ||
                    `Server responded with ${error.response.status}`;
            } else if (error.request) {
                // The request was made but no response was received
                errorMessage = "No response received from server";
            }

            toast.error(errorMessage);
            throw error;
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
                <FormControl fullWidth>
                    <InputLabel htmlFor="observation" shrink={!!riskData.observation} // Force label to shrink when content exists
                                sx={{
                                    position: 'absolute',
                                    top: riskData.observation ? -8 : 8, // Adjust position
                                    left: 10,
                                    backgroundColor: riskData.observation ? 'background.paper' : 'transparent',
                                    px: 1,
                                    transition: 'all 0.2s ease-out'
                                }}>Observation</InputLabel>
                    <TextareaAutosize
                        id="observation"
                        minRows={4}
                        value={riskData.observation}
                        onChange={handleInputChange('observation')}
                        disabled={disabled}
                        style={{
                            width: "100%",
                            padding: "10px",
                            margin: "8px 0",
                            borderRadius: "4px",
                            border: "1px solid #ccc",
                            fontFamily: 'inherit',
                        }}
                    />
                </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                    <InputLabel htmlFor="requiredAction" shrink={!!riskData.requiredAction} // Force label to shrink when content exists
                                sx={{
                                    position: 'absolute',
                                    top: riskData.requiredAction ? -8 : 8, // Adjust position
                                    left: 10,
                                    backgroundColor: riskData.requiredAction ? 'background.paper' : 'transparent',
                                    px: 1,
                                    transition: 'all 0.2s ease-out'
                                }}>Suggested Action</InputLabel>
                    <TextareaAutosize
                        id="requiredAction"
                        minRows={4}
                        value={riskData.requiredAction}
                        onChange={handleInputChange('requiredAction')}
                        disabled={disabled}
                        style={{
                            width: "100%",
                            padding: "10px",
                            margin: "8px 0",
                            borderRadius: "4px",
                            border: "1px solid #ccc",
                            fontFamily: 'inherit',
                        }}
                    />
                </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                    <InputLabel id="consequence-label">Consequence</InputLabel>
                    <Select
                        labelId="consequence-label"
                        id="consequence"
                        value={riskData.consequence || ''}
                        onChange={handleInputChange('consequence')}
                        disabled={disabled}
                        required
                    >
                        <MenuItem value=""><em>Select</em></MenuItem>
                        {[1, 2, 3, 4, 5].map((num) => (
                            <MenuItem key={`consequence-${num}`} value={num}>
                                {num}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                    <InputLabel id="likelihood-label">Likelihood</InputLabel>
                    <Select
                        labelId="likelihood-label"
                        id="likelihood"
                        value={riskData.likelihood || ''}
                        onChange={handleInputChange('likelihood')}
                        disabled={disabled}
                        required
                    >
                        <MenuItem value=""><em>Select</em></MenuItem>
                        {[1, 2, 3, 4, 5].map((num) => (
                            <MenuItem key={`likelihood-${num}`} value={num}>
                                {num}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
                <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    p={2}
                    sx={{
                        height: "100%",
                        minHeight: "150px",
                        border: "1px solid #eee",
                        borderRadius: 1,
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

            <Grid item xs={12}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleRaiseAction}
                    disabled={disabled || isSubmitting || actionRaised}
                    startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
                    sx={{ mt: 2 }}
                >
                    {actionRaised ? "Action Raised" : (isSubmitting ? "Raising Action..." : "Raise Action")}                </Button>
            </Grid>
        </Grid>
    );
};

RiskScoreCard.propTypes = {
    consequence: PropTypes.number,
    desc: PropTypes.string,
    likelihood: PropTypes.number,
    observation: PropTypes.string,
    requiredAction: PropTypes.string,
    disabled: PropTypes.bool,
    images: PropTypes.arrayOf(
        PropTypes.shape({
            url: PropTypes.string,
            fileName: PropTypes.string,
            documentId: PropTypes.string,
            responseId: PropTypes.number,
        })
    ),
    onRiskAssessmentComplete: PropTypes.func,
    siteId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    createdBy: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export default RiskScoreCard;