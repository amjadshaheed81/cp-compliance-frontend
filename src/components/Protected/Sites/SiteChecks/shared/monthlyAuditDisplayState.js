import { isMonthlyQuestionVisible, monthlyQuestionComplete } from "./monthlyAuditWorkflow";

// Display-only calculations. The workflow remains responsible for validation,
// saving, dates, Actions and PDF/History; no HTTP requests are made here.
export const monthlyAuditPrintState = (questions = [], assets = [], headers = []) => {
  if (!questions?.length) return { canPrint: false, blockingOrders: [] };
  // Do not use Array.every while collecting failures: it stops on the first
  // incomplete question, hiding the rest of the work from the inspector.
  const incomplete = questions.filter((question) =>
    isMonthlyQuestionVisible(question, headers) && !monthlyQuestionComplete(question, assets));
  return {
    canPrint: incomplete.length === 0,
    blockingOrders: incomplete.map((question) => question.order).filter(Boolean),
  };
};

export const monthlyAuditRiskCounts = (savedResponses = []) => {
  const counts = [0, 0, 0, 0];
  // Preserve the existing WEB thresholds, including scores of exactly 5 and 10.
  // Consume confirmed response envelopes, never unsaved form values.
  (savedResponses || []).forEach(({ response }) => {
    const score = Number(response?.totalRiskScore || 0);
    counts[score > 17 ? 0 : score > 10 ? 1 : score > 5 ? 2 : 3] += 1;
  });
  return counts;
};

export const replaceMonthlySavedResponse = (savedResponses = [], saved) => {
  // A question's successful re-save replaces its old risk contribution; an
  // identical acknowledgement must not add another entry to the totals.
  const index = savedResponses.findIndex((item) =>
    Number(item.response?.checkId) === Number(saved.response.checkId) &&
    Number(item.response?.qid) === Number(saved.response.qid));
  if (index < 0) return [...savedResponses, saved];
  return savedResponses.map((item, i) => i === index ? saved : item);
};
