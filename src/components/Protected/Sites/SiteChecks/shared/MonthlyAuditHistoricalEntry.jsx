import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, Box, Button, Checkbox, Collapse, FormControlLabel, MenuItem,
  Select, TextField, Typography,
} from "@mui/material";
import { get, post } from "../../../../../api";
import { monthlyQuestionAssets } from "./monthlyAuditWorkflow";

const declaration = "I confirm this is a retrospective entry based on available historical records.";
const split = (value) => String(value || "").split(",").map((s) => s.trim()).filter(Boolean);
const keyOf = (qid, assetId) => `${qid}:${assetId}`;
const monthLabel = (month) => {
  const [year, part] = String(month || "").split("-").map(Number);
  return new Date(year, part - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
};
const errorText = (error) => error?.response?.data?.message || error?.message || "Request failed. Please try again.";

/** Draft answers are saved to a separate historical record; the live audit is never edited. */
export default function MonthlyAuditHistoricalEntry({ checkId, onSaved }) {
  const root = `/api/site-check/${checkId}/monthly-audit-v2/backfill`;
  const [access, setAccess] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [editing, setEditing] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [siteAssets, setSiteAssets] = useState([]);
  const [results, setResults] = useState({});
  const [notes, setNotes] = useState({});
  const [actions, setActions] = useState({});
  const [consequences, setConsequences] = useState({});
  const [likelihoods, setLikelihoods] = useState({});
  const [inspectionDate, setInspectionDate] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [success, setSuccess] = useState("");

  const refresh = useCallback(async () => {
    const result = await get(`${root}/eligibility`);
    setAccess(result);
    return result;
  }, [root]);

  useEffect(() => {
    let active = true;
    get(`${root}/eligibility`).then((result) => {
      if (active) setAccess(result);
    }).catch(() => {
      if (active) setAccess({ enabled: false });
    });
    return () => { active = false; };
  }, [root]);

  const missingMonths = (access?.months || []).filter((month) => month.status === "MISSING");

  const assign = async () => {
    if (!selectedMonth || !selectedUser || loading) return;
    setError(""); setSuccess(""); setLoading(true);
    try {
      await post(`${root}/assign`, { month: selectedMonth, userId: Number(selectedUser) });
      await refresh();
      setSelectedMonth(""); setSelectedUser("");
      setSuccess("The missing month is now assigned. The selected user can open it from this Site Check.");
    } catch (err) { setError(errorText(err)); }
    finally { setLoading(false); }
  };

  const revoke = async (draftId) => {
    if (loading || !window.confirm("Cancel this unfinished assignment? Previously submitted audits will not be changed.")) return;
    setError(""); setLoading(true);
    try {
      await post(`${root}/draft/${draftId}/revoke`, {});
      await refresh();
      setSuccess("The unfinished assignment has been cancelled.");
    } catch (err) { setError(errorText(err)); }
    finally { setLoading(false); }
  };

  const openDraft = async (draftId) => {
    if (loading) return;
    setLoading(true); setError(""); setSuccess("");
    try {
      const [draft, headers, definitions, assetResponse] = await Promise.all([
        get(`${root}/draft/${draftId}`),
        get("/api/lov/SITE_CHECK_AUDIT_HEADER"),
        get("/api/site-check/assessment/questions/monthly-inspection"),
        get(`/api/site/${access.siteId}/assets?siteCheckSummary=true`),
      ]);
      if (!Array.isArray(assetResponse?.assets)) throw new Error("Site assets could not be loaded.");
      const headerNumbers = (headers || []).filter((item) => item.attribite1 === "monthly-inspection")
        .map((item) => item.lovDesc).filter(Boolean);
      const visible = (definitions || [])
        .filter((q) => q?.qid && q?.order?.length > 4 && !String(q.question || "").includes("DELETE"))
        .filter((q) => headerNumbers.some((prefix) => q.order.startsWith(`${prefix}.`)))
        .sort((a, b) => a.order.localeCompare(b.order, undefined, { numeric: true }));
      const choices = {}, observations = {}, suggested = {}, impact = {}, chance = {};
      for (const answer of draft.answers || []) {
        for (const id of split(answer.assets)) choices[keyOf(answer.qid, id)] = "pass";
        for (const id of split(answer.faultassets)) choices[keyOf(answer.qid, id)] = "fail";
        observations[answer.qid] = answer.observation || "";
        suggested[answer.qid] = answer.suggestedAction || "";
        impact[answer.qid] = answer.consequence || "";
        chance[answer.qid] = answer.likelihood || "";
      }
      setQuestions(visible); setSiteAssets(assetResponse.assets);
      setResults(choices); setNotes(observations); setActions(suggested);
      setConsequences(impact); setLikelihoods(chance);
      // Never invent an April 1 inspection date: require the actual date to be selected.
      setInspectionDate(""); setConfirmed(false);
      setEditing(draft); setExpanded(true);
    } catch (err) { setError(errorText(err)); }
    finally { setLoading(false); }
  };

  const applicable = useMemo(() => questions.map((question) => ({
    question, assets: monthlyQuestionAssets(question, siteAssets),
  })), [questions, siteAssets]);

  /** Partially completed drafts are allowed; final Submit requires all applicable questions. */
  const assemble = (requireComplete) => {
    const answers = [];
    let pending = 0;
    for (const { question, assets } of applicable) {
      if (!assets.length) continue;
      const ok = [], failed = [];
      for (const asset of assets) {
        const choice = results[keyOf(question.qid, asset.assetId)];
        if (choice === "pass") ok.push(asset.assetId);
        else if (choice === "fail") failed.push(asset.assetId);
        else pending += 1;
      }
      const observation = String(notes[question.qid] || "").trim();
      const suggestedAction = String(actions[question.qid] || "").trim();
      if (!ok.length && !failed.length) {
        if (requireComplete) throw new Error(`Question ${question.order} has not been answered.`);
        // Preserve partial observation notes across Save progress and reload.
        if (!observation && !suggestedAction) continue;
      }
      if (requireComplete && ["3.5.1", "8.1.1"].includes(question.order)) {
        // The two special questions require at least one selected asset, not all assets.
        pending -= assets.length - ok.length - failed.length;
      }
      if (failed.length && (!observation || !suggestedAction || !consequences[question.qid] || !likelihoods[question.qid])) {
        throw new Error(`Question ${question.order}: failed assets require notes, suggested action, consequence and likelihood.`);
      }
      answers.push({
        qid: question.qid, assets: ok.join(","), faultassets: failed.join(","),
        observation, suggestedAction,
        consequence: failed.length ? String(consequences[question.qid]) : null,
        likelihood: failed.length ? String(likelihoods[question.qid]) : null,
      });
    }
    if (requireComplete && pending > 0) throw new Error(`Complete all remaining asset selections (${pending} unselected).`);
    if (requireComplete && !answers.length) throw new Error("No applicable questions were answered.");
    return answers;
  };

  const saveDraft = async (finalise = false) => {
    if (!editing || loading) return;
    setError(""); setSuccess(""); setLoading(true);
    try {
      const answers = assemble(finalise);
      const stored = await post(`${root}/draft/${editing.draftId}/answers`, {
        revision: editing.revision, answers,
      });
      const revision = stored?.data?.revision;
      if (!Number.isSafeInteger(revision)) throw new Error("The draft save could not be confirmed.");
      setEditing((current) => ({ ...current, revision }));
      if (finalise) {
        if (!confirmed) throw new Error("Confirm the retrospective declaration before submission.");
        if (!inspectionDate || inspectionDate.slice(0, 7) !== editing.month) {
          throw new Error("Choose an inspection date within the assigned month.");
        }
        const submitted = await post(`${root}/draft/${editing.draftId}/submit`, {
          revision, inspectionDate, declaration,
        });
        if (submitted?.data?.source !== "HISTORICAL_BACKFILL" || !submitted?.data?.historyId) {
          throw new Error("The historical PDF and History record could not be confirmed.");
        }
        setEditing(null); setExpanded(false); setConfirmed(false);
        setSuccess(`Historical Monthly Audit submitted. History record ${submitted.data.historyId} created.`);
        await refresh();
        onSaved?.();
      } else {
        setSuccess("Historical draft saved. You can return later to finish the remaining questions.");
      }
    } catch (err) { setError(errorText(err)); }
    finally { setLoading(false); }
  };

  if (!access?.enabled) return null;
  return (
    <Box className="dont-print" sx={{ m: 2, p: 2, border: "1px solid #b9c7d6", borderRadius: 1 }}>
      <Typography variant="subtitle1" fontWeight={600}>Temporary historical Monthly Audit entry</Typography>
      <Typography variant="body2" sx={{ my: 1 }}>
        Create missing months without changing the live audit. Already recorded months, including Not Completed, cannot be recreated.
      </Typography>
      {access.isAdmin && (
        <>
          <Button variant="outlined" onClick={() => setExpanded((current) => !current)} disabled={loading}>
            {expanded ? "Hide missing months" : "Create Missing Monthly Audit"}
          </Button>
          <Collapse in={expanded}>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2">Months for this Site Check</Typography>
              <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: "repeat(auto-fit,minmax(165px,1fr))", my: 2 }}>
                {(access.months || []).map(({ month, status, draftId, assignedUserId }) => (
                  <Button key={month} variant={selectedMonth === month ? "contained" : "outlined"}
                    disabled={loading || status !== "MISSING"}
                    color={status === "MISSING" ? "primary" : "inherit"}
                    onClick={() => setSelectedMonth(month)}>
                    {monthLabel(month)} — {status === "MISSING" ? "Missing" : status === "ASSIGNED" ? "Assigned" : "Exists"}
                  </Button>
                ))}
              </Box>
              {selectedMonth && (
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
                  <Typography variant="body2">Assign {monthLabel(selectedMonth)} to</Typography>
                  <Select size="small" value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}
                    displayEmpty sx={{ minWidth: 230 }} disabled={loading}>
                    <MenuItem value="">Choose a site user</MenuItem>
                    {(access.users || []).map((user) => <MenuItem key={user.userId} value={String(user.userId)}>{user.name}</MenuItem>)}
                  </Select>
                  <Button variant="contained" disabled={!selectedUser || loading} onClick={assign}>
                    Allow user to complete month
                  </Button>
                </Box>
              )}
              {(access.months || []).filter((m) => m.status === "ASSIGNED").map((m) => (
                <Box key={m.month} sx={{ mt: 1, display: "flex", gap: 2, alignItems: "center" }}>
                  <Typography variant="body2">{monthLabel(m.month)} is assigned to user {m.assignedUserId}.</Typography>
                  <Button size="small" color="warning" onClick={() => revoke(m.draftId)} disabled={loading}>Cancel assignment</Button>
                </Box>
              ))}
              {!missingMonths.length && <Alert severity="info" sx={{ mt: 2 }}>No unassigned missing months are currently available.</Alert>}
            </Box>
          </Collapse>
        </>
      )}
      {(access.assignedDrafts || []).length > 0 && <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2">Your assigned historical months</Typography>
        {(access.assignedDrafts || []).map((draft) => <Button key={draft.draftId} variant="outlined"
          sx={{ mr: 1, mt: 1 }} onClick={() => openDraft(draft.draftId)} disabled={loading}>
          Open {monthLabel(draft.month)}
        </Button>)}
      </Box>}
      {editing && <Box sx={{ mt: 3 }}>
        <Typography variant="h6">Complete {monthLabel(editing.month)} Monthly Audit</Typography>
        <Alert severity="warning" sx={{ mt: 1, mb: 2 }}>
          Retrospective entry using today's asset categories. The PDF records both the chosen inspection date and the actual submission date.
          Historical photographs and formal repair Action links are not supported by this temporary workflow; any faults require separate Action review.
        </Alert>
        <TextField type="date" size="small" label="Historical inspection date" value={inspectionDate}
          onChange={(e) => setInspectionDate(e.target.value)} InputLabelProps={{ shrink: true }}
          inputProps={{ min: `${editing.month}-01`, max: new Date(Number(editing.month.slice(0,4)), Number(editing.month.slice(5,7)), 0).toISOString().slice(0,10) }} />
        {applicable.map(({ question, assets }) => <Box key={question.qid} sx={{ borderTop: "1px solid #d9e1e7", py: 2, mt: 2 }}>
          <Typography variant="subtitle2">{question.order} — {question.question}</Typography>
          {!assets.length && <Typography color="text.secondary" variant="body2">No assets currently match this question's category.</Typography>}
          {assets.map((asset) => <Box key={asset.assetId} sx={{ display: "flex", alignItems: "center", gap: 2, my: 1, flexWrap: "wrap" }}>
            <Typography variant="body2" sx={{ minWidth: 260 }}>{asset.assetId} — {asset.assetName}</Typography>
            <Select size="small" displayEmpty disabled={loading}
              value={results[keyOf(question.qid, asset.assetId)] || ""}
              onChange={(e) => setResults((prev) => ({ ...prev, [keyOf(question.qid, asset.assetId)]: e.target.value }))}
              sx={{ minWidth: 160 }}>
              <MenuItem value="">Not assessed</MenuItem>
              <MenuItem value="pass">Pass</MenuItem>
              <MenuItem value="fail">Fail</MenuItem>
            </Select>
          </Box>)}
          {!!assets.length && <TextField size="small" fullWidth multiline rows={2} sx={{ mt: 1 }}
            label="Observation" value={notes[question.qid] || ""} inputProps={{ maxLength: 4000 }}
            onChange={(e) => setNotes((v) => ({ ...v, [question.qid]: e.target.value }))} />}
          {assets.some((asset) => results[keyOf(question.qid, asset.assetId)] === "fail") && <Box sx={{ mt: 2, display: "flex", gap: 2, flexWrap: "wrap" }}>
            <TextField size="small" multiline rows={2} fullWidth label="Suggested Action" inputProps={{ maxLength: 4000 }}
              value={actions[question.qid] || ""}
              onChange={(e) => setActions((v) => ({ ...v, [question.qid]: e.target.value }))} />
            {[["Consequence", consequences, setConsequences], ["Likelihood", likelihoods, setLikelihoods]].map(([label, state, setter]) => (
              <TextField key={label} size="small" select label={label} value={state[question.qid] || ""}
                sx={{ minWidth: 160 }} onChange={(e) => setter((v) => ({ ...v, [question.qid]: e.target.value }))}>
                {[1,2,3,4,5].map((n) => <MenuItem key={n} value={String(n)}>{n}</MenuItem>)}
              </TextField>
            ))}
          </Box>}
        </Box>)}
        <FormControlLabel control={<Checkbox checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />}
          label={declaration} />
        <Box sx={{ display: "flex", gap: 2, mt: 2, flexWrap: "wrap" }}>
          <Button variant="outlined" disabled={loading} onClick={() => saveDraft(false)}>
            {loading ? "Saving…" : "Save progress"}
          </Button>
          <Button variant="contained" disabled={loading || !confirmed || !inspectionDate}
            onClick={() => saveDraft(true)}>{loading ? "Submitting…" : "Submit missing Monthly Audit"}</Button>
          <Button disabled={loading} onClick={() => setEditing(null)}>Close</Button>
        </Box>
      </Box>}
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
    </Box>
  );
}
