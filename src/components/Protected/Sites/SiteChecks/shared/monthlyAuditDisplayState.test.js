import { monthlyAuditPrintState, monthlyAuditRiskCounts, replaceMonthlySavedResponse } from './monthlyAuditDisplayState';

jest.mock('../../../../../api', () => ({
  del: jest.fn(), get: jest.fn(), post: jest.fn(), postMultiPartFormData: jest.fn(),
}));

const assets = [{ assetId: 12, category: 'Lighting' }];
const headers = [{ lovDesc: '1.1' }];
const questions = [1, 2, 3].map((n) => ({
  qid: n, order: `1.1.${n}`, question: `Question ${n}`, assetCategory: 'Lighting', response: {},
}));
const first = { periodToken: 'p1', revision: 1, response: { checkId: 408, qid: 1, totalRiskScore: 0 } };
const second = { periodToken: 'p1', revision: 1, response: { checkId: 408, qid: 2, totalRiskScore: 10 } };

test('all incomplete visible questions are listed, not just the first', () => {
  expect(monthlyAuditPrintState(questions, assets, headers)).toEqual({
    canPrint: false, blockingOrders: ['1.1.1', '1.1.2', '1.1.3'],
  });
});

test('completed, deleted and hidden questions are not reported as blockers', () => {
  const mixed = [
    { ...questions[0], response: { assets: '12' } },
    { ...questions[1], question: 'DELETE this old question' },
    { ...questions[2], order: '9.9.1' },
  ];
  expect(monthlyAuditPrintState(mixed, assets, headers)).toEqual({ canPrint: true, blockingOrders: [] });
});

test('empty loading state cannot be printed', () => {
  expect(monthlyAuditPrintState([], assets, headers)).toEqual({ canPrint: false, blockingOrders: [] });
});

test('stale selected IDs still block a zero-match question', () => {
  const stale = [{ ...questions[0], assetCategory: 'Water', response: { assets: '12' } }];
  expect(monthlyAuditPrintState(stale, assets, headers)).toEqual({ canPrint: false, blockingOrders: ['1.1.1'] });
});

test.each([
  [0, [0, 0, 0, 1]], [5, [0, 0, 0, 1]], [6, [0, 0, 1, 0]],
  [10, [0, 0, 1, 0]], [11, [0, 1, 0, 0]], [17, [0, 1, 0, 0]], [18, [1, 0, 0, 0]],
])('preserves the existing web risk classification for score %i', (score, expected) => {
  expect(monthlyAuditRiskCounts([{ response: { totalRiskScore: score } }])).toEqual(expected);
});

test('a confirmed new answer increments the appropriate risk count', () => {
  expect(monthlyAuditRiskCounts(replaceMonthlySavedResponse([], first))).toEqual([0, 0, 0, 1]);
});

test('re-saving a question replaces its old contribution without mutating other answers', () => {
  const previous = Object.freeze([first, second]);
  const updated = { ...first, revision: 2, response: { ...first.response, totalRiskScore: 20 } };
  const result = replaceMonthlySavedResponse(previous, updated);
  expect(result).toEqual([updated, second]);
  expect(previous).toEqual([first, second]);
  expect(monthlyAuditRiskCounts(result)).toEqual([1, 0, 1, 0]);
  expect(monthlyAuditRiskCounts(replaceMonthlySavedResponse(result, updated))).toEqual([1, 0, 1, 0]);
});
