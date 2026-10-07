import React from "react";
import { Box, FormControl, InputLabel, MenuItem, Select, Typography } from "@mui/material";
import { monthlyActionCandidates, splitMonthlyAssetIds } from "./monthlyAuditWorkflow";

const displayDate = (date) => {
  const match = String(date || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : "Date not recorded";
};

const actionText = (action) =>
  `Action ${action.actionId} · ${displayDate(action.createdAt || action.originalActionDate)} · ${action.status || "Status not recorded"}`;

const MonthlyAuditActionChoices = ({ question, candidates, siteId, assets, disabled, onChange }) => {
  const failures = splitMonthlyAssetIds(question?.response?.faultassets);
  if (!failures.length) return null;

  return (
    <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 2 }}>
      <Typography variant="subtitle1" gutterBottom>Actions for failed assets</Typography>
      {failures.map((assetId) => {
        const asset = (assets || []).find((item) => String(item.assetId) === assetId);
        const options = monthlyActionCandidates(candidates, assetId, siteId);
        const choice = question.actionChoices?.[assetId];
        const savedLink = (question.actionLinks || []).find((link) =>
          String(link.assetId) === assetId && String(link.actionId) === String(choice?.actionId));
        // An Action can be completed after this audit saved its selection. Keep
        // the recorded choice visible; never silently replace it with a new Action.
        if (savedLink && !options.some((action) => String(action.actionId) === String(savedLink.actionId))) {
          options.push(savedLink);
        }
        const selected = choice?.mode === "EXISTING"
          ? options.find((action) => String(action.actionId) === String(choice.actionId))
          : null;
        const inputId = `monthly-action-${question.qid}-${assetId}`;

        return (
          <Box key={assetId} sx={{ mt: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              {assetId}{asset?.assetName ? ` — ${asset.assetName}` : ""}
            </Typography>
            {options.length > 0 ? (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Existing Actions for this asset — select one if this is the same fault.
                </Typography>
                <FormControl size="small" fullWidth disabled={disabled}>
                  <InputLabel id={`${inputId}-label`}>Action for this failure</InputLabel>
                  <Select
                    labelId={`${inputId}-label`}
                    id={inputId}
                    label="Action for this failure"
                    value={choice?.mode === "NEW" ? "NEW" : choice?.actionId ? String(choice.actionId) : ""}
                    onChange={(event) => onChange(assetId, event.target.value === "NEW"
                      ? { mode: "NEW" }
                      : { mode: "EXISTING", actionId: Number(event.target.value) })}
                    required
                  >
                    {options.map((action) => (
                      <MenuItem key={action.actionId} value={String(action.actionId)} sx={{ whiteSpace: "normal" }}>
                        <Box>
                          <Typography variant="body2">{actionText(action)}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {action.observation || "No observation recorded"}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                    <MenuItem value="NEW">New fault — create new Action</MenuItem>
                  </Select>
                </FormControl>
                {selected && (
                  <Box sx={{ p: 1.5, mt: 1, bgcolor: "action.hover", borderRadius: 1 }}>
                    <Typography variant="body2">{actionText(selected)}</Typography>
                    <Typography variant="body2">{selected.observation || "No observation recorded"}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Required action: {selected.requiredAction || "Not recorded"}
                    </Typography>
                  </Box>
                )}
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No outstanding Action was found for this asset. Saving this failure will create a new Action.
              </Typography>
            )}
          </Box>
        );
      })}
    </Box>
  );
};
export default MonthlyAuditActionChoices;
