import { del, get, post, postMultiPartFormData } from "../../../../../api";

const periodStatuses = new Set(["OPEN", "SUBMITTING", "SUBMITTED", "ARCHIVE_REQUIRED"]);
const responseFields = [
  "responseId", "checkId", "qid", "response", "position", "floor", "room",
  "assets", "faultassets", "consequence", "likelihood", "action", "responseDate",
  "riskType", "totalRiskScore", "status", "closedUserId", "closedDate",
];

const root = (checkId) => {
  if (!Number.isSafeInteger(Number(checkId)) || Number(checkId) <= 0) {
    throw new Error("A valid Site Check is required.");
  }
  return `/api/site-check/${checkId}/monthly-audit`;
};

const tokenQuery = (periodToken) => {
  if (typeof periodToken !== "string" || !periodToken.trim()) {
    throw new Error("Reload this audit before saving. Its current period could not be verified.");
  }
  return `periodToken=${encodeURIComponent(periodToken)}`;
};

export const monthlyAuditError = (error, fallback = "The Monthly Audit could not be saved.") => {
  const body = error?.response?.data;
  return (typeof body === "string" && body.trim()) || body?.message || error?.message || fallback;
};

export const newMonthlyAuditRequestId = () => {
  const browserCrypto = window.crypto;
  if (typeof browserCrypto?.randomUUID === "function") return browserCrypto.randomUUID();
  const bytes = new Uint8Array(16);
  if (typeof browserCrypto?.getRandomValues === "function") {
    browserCrypto.getRandomValues(bytes);
  } else {
    // This is an idempotency identifier, not an authentication credential.
    for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

export const verifyMonthlyContext = (context, checkId) => {
  if (
    !context || Number(context.checkId) !== Number(checkId) ||
    !periodStatuses.has(context.status) || typeof context.periodToken !== "string" ||
    !context.periodToken.trim()
  ) {
    throw new Error("The current Monthly Audit period could not be verified. Reload the form.");
  }
  return context;
};

const contextMutation = async (checkId, path, request) => {
  tokenQuery(request.periodToken);
  const result = await post(`${root(checkId)}${path}`, request);
  return verifyMonthlyContext(result?.data, checkId);
};

export const getMonthlyAuditContext = async (checkId) =>
  verifyMonthlyContext(await get(`${root(checkId)}/context`), checkId);

export const getMonthlyAuditResponses = async (checkId, periodToken) => {
  const result = await get(`${root(checkId)}/responses?${tokenQuery(periodToken)}`);
  if (result?.periodToken !== periodToken || !Array.isArray(result.responses)) {
    throw new Error("The saved answers do not belong to the current audit period. Reload the form.");
  }
  return result.responses;
};

export const getMonthlyAuditActions = async (checkId, periodToken) => {
  const result = await get(`${root(checkId)}/actions?${tokenQuery(periodToken)}`);
  if (!Array.isArray(result?.actions)) {
    throw new Error("Existing Actions could not be loaded. Reload before saving a failure.");
  }
  return result.actions;
};

export const saveMonthlyAuditResponse = async (checkId, request) => {
  tokenQuery(request.periodToken);
  const result = await post(`${root(checkId)}/responses`, request);
  const saved = result?.data;
  if (
    saved?.periodToken !== request.periodToken ||
    Number(saved?.response?.checkId) !== Number(checkId) ||
    Number(saved?.response?.qid) !== Number(request.response.qid) ||
    !Number.isSafeInteger(Number(saved?.revision)) || Number(saved.revision) < 1 ||
    !Array.isArray(saved?.actionLinks)
  ) {
    throw new Error("The saved answer could not be confirmed. Reload before continuing.");
  }
  return saved;
};

export const prepareMonthlyAuditSubmission = (checkId, request) =>
  contextMutation(checkId, "/submission/prepare", request);

export const completeMonthlyAuditSubmission = (checkId, request) =>
  contextMutation(checkId, "/submission/complete", request);

export const uploadMonthlyAuditPdf = async (checkId, periodToken, folderId, blob, fileName) => {
  tokenQuery(periodToken);
  const formData = new FormData();
  formData.append("file", new File([blob], fileName, { type: "application/pdf" }));
  formData.append("periodToken", periodToken);
  formData.append("folderId", folderId);
  const response = await postMultiPartFormData(`${root(checkId)}/pdf`, formData);
  const context = verifyMonthlyContext(response?.data, checkId);
  if (context.periodToken !== periodToken || context.pdfStored !== true) {
    throw new Error("The report upload could not be confirmed. Retry saving the report and History.");
  }
  return context;
};

export const openMonthlyAuditEarly = (checkId, request) =>
  contextMutation(checkId, "/open-early", request);

export const deleteMonthlyAuditImage = (checkId, imageId, periodToken, revision) =>
  del(`${root(checkId)}/responses/images/${imageId}?${tokenQuery(periodToken)}&responseRevision=${revision}`);

export const splitMonthlyAssetIds = (value) =>
  [...new Set(String(value || "").split(",").map((id) => id.trim()).filter(Boolean))];

// This is the existing Monthly Audit applicability rule, shared by the form,
// its completion check and Test Fill. It does not invent questions or assets.
export const monthlyQuestionAssets = (question, assets = []) => {
  const category = (question?.assetCategory?.split(",") || []).map((part) => part.trim());
  const list = Array.isArray(assets) ? assets : [];
  const trim = (value) => String(value || "").trim();
  if (category.length === 4) {
    return list.filter((asset) => trim(asset.category) === category[0] &&
      trim(asset.subCategory) === category[1] &&
      [category[2], category[3]].includes(trim(asset.subCategory2)));
  }
  if (category.length === 3) {
    return list.filter((asset) => trim(asset.category) === category[0] &&
      trim(asset.subCategory) === category[1] && trim(asset.subCategory2) === category[2]);
  }
  if (category.length === 2) {
    // Preserve the source's exact category comparison for this branch.
    return list.filter((asset) => asset.category === category[0] && trim(asset.subCategory) === category[1]);
  }
  if (category.length === 1 && category[0]) {
    return list.filter((asset) => trim(asset.category) === category[0]);
  }
  return list;
};

export const isMonthlyQuestionVisible = (question, headers) =>
  !question?.question?.includes("DELETE") &&
  (headers || []).some((header) => question?.order?.startsWith(`${header.lovDesc}.`));

export const monthlyQuestionComplete = (question, assets) => {
  const applicable = monthlyQuestionAssets(question, assets);
  const okIds = splitMonthlyAssetIds(question?.response?.assets);
  const failedIds = splitMonthlyAssetIds(question?.response?.faultassets);
  const selected = new Set([...okIds, ...failedIds]);
  if (!applicable.length) return true;
  const applicableIds = new Set(applicable.map((asset) => String(asset.assetId)));
  if (failedIds.some((id) => okIds.includes(id)) || [...selected].some((id) => !applicableIds.has(id))) return false;
  if (["3.5.1", "8.1.1"].includes(question?.order)) {
    return applicable.some((asset) => selected.has(String(asset.assetId)));
  }
  return applicable.every((asset) => selected.has(String(asset.assetId)));
};

export const hydrateMonthlyQuestion = (question, saved) => {
  const response = saved?.response ? { ...saved.response, file: null } : {};
  const links = Array.isArray(saved?.actionLinks) ? saved.actionLinks : [];
  const choices = {};
  links.forEach((link) => {
    choices[String(link.assetId)] = { mode: "EXISTING", actionId: link.actionId };
  });
  (saved?.actionChoices || []).forEach((choice) => {
    choices[String(choice.assetId)] = { mode: choice.mode, ...(choice.actionId ? { actionId: choice.actionId } : {}) };
  });
  return {
    ...question,
    response,
    // response.file is the form's transient File[]; retain the database scalar
    // separately so editing an adopted audit does not remove its old reference.
    savedFileReference: saved?.response?.file ?? null,
    status: response.status || "Open",
    completed: response.status === "Closed",
    actionChoices: choices,
    actionLinks: links,
    responseRevision: Number(saved?.revision) || 0,
    dirty: false,
  };
};

export const monthlyActionCandidates = (actions, assetId, siteId) =>
  (actions || []).filter((action) =>
    Number(action.siteId) === Number(siteId) &&
    ["Reported", "Reassessed"].includes(action.status) &&
    (Array.isArray(action.assetIds) ? action.assetIds.map(String) : splitMonthlyAssetIds(action.taggedAsset))
      .includes(String(assetId)));

export const monthlyResponseIssues = (question, actions, siteId) => {
  const failures = splitMonthlyAssetIds(question?.response?.faultassets);
  if (!failures.length) return [];
  const issues = [];
  if (!String(question.response?.position || "").trim() || !String(question.response?.action || "").trim()) {
    issues.push("Enter an observation and suggested action for the failed assets.");
  }
  if (![1, 2, 3, 4, 5].includes(Number(question.response?.consequence)) ||
      ![1, 2, 3, 4, 5].includes(Number(question.response?.likelihood))) {
    issues.push("Select consequence and likelihood for the failed assets.");
  }
  failures.forEach((assetId) => {
    const choice = question.actionChoices?.[assetId];
    if (choice?.mode === "EXISTING" && !choice.actionId) {
      issues.push(`Choose an Action for asset ${assetId}.`);
    } else if (!choice && monthlyActionCandidates(actions, assetId, siteId).length) {
      issues.push(`Select an existing Action or choose a new fault for asset ${assetId}.`);
    }
  });
  return issues;
};

export const monthlyResponseRequest = (question, { checkId, periodToken, files = [], requestId }) => {
  const response = Object.fromEntries(responseFields.map((key) => [key, question.response?.[key] ?? null]));
  response.checkId = Number(checkId);
  response.qid = question.qid;
  response.file = question.savedFileReference ?? null;
  response.files = files;
  const actionChoices = splitMonthlyAssetIds(response.faultassets).map((assetId) => ({
    assetId: Number(assetId),
    ...(question.actionChoices?.[assetId] || { mode: "NEW" }),
  }));
  return {
    periodToken,
    requestId: requestId || newMonthlyAuditRequestId(),
    responseRevision: question.responseRevision || 0,
    response,
    actionChoices,
  };
};

export const fillMonthlyQuestionForTest = (question, siteAssets) => {
  const faultIds = new Set(splitMonthlyAssetIds(question.response?.faultassets));
  // Completing a partially answered failed question can create a repair Action.
  // Test Fill therefore leaves the whole question for an explicit manual save.
  if (faultIds.size) return question;
  const okIds = new Set(splitMonthlyAssetIds(question.response?.assets));
  monthlyQuestionAssets(question, siteAssets).forEach((asset) => {
    const id = String(asset.assetId);
    if (!faultIds.has(id)) okIds.add(id);
  });
  return {
    ...question,
    dirty: true,
    response: { ...question.response, assets: [...okIds].join(",") },
  };
};

export const mayFillMonthlyAuditForTest = (user, context) =>
  String(user?.email || "").trim().toLowerCase() === "amjad.shaheed81@gmail.com" &&
  context?.canTestFill === true && context?.canEdit === true;
