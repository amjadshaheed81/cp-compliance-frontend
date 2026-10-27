import { resolveSiteCheckPdfTarget } from './resolveSiteCheckPdfTarget';

const input = {
  siteId: 471,
  checkId: 1664,
  assetId: 46376,
  fileName: 'AirConditioningReport_Split Condenser.pdf',
  folderId: 141965,
};

test('uses the original Leicester Split Condenser document ID', async () => {
  const fetchJson = jest.fn(async () => ({exists: true, fileId: 31892, fileVersion: 7, folderId: 141965}));
  const result = await resolveSiteCheckPdfTarget({...input, fetchJson});
  expect(result.fileId).toBe(31892);
  expect(result.fileVersion + 1).toBe(8);
  const url = new URL(fetchJson.mock.calls[0][0], 'https://cafm.example.test');
  expect(url.searchParams.get('assetId')).toBe('46376');
  expect(url.searchParams.get('siteId')).toBe('471');
  expect(url.searchParams.get('fileName')).toBe(input.fileName);
});

test('uses the original VRF Unit 1 document ID despite a decimal in the name', async () => {
  const result = await resolveSiteCheckPdfTarget({
    ...input, checkId: 1659, assetId: 46382,
    fileName: 'AirConditioningReport_VRF Unit (25.2 kW) 1.pdf',
    fetchJson: async () => ({ exists: true, fileId: 31895, fileVersion: 7, folderId: 141965 }),
  });
  expect(result.fileId).toBe(31895);
});

test('allows a new document only with an explicit valid resolver result', async () => {
  const target = await resolveSiteCheckPdfTarget({
    ...input, fetchJson: async () => ({ exists: false, fileId: null, fileVersion: 0, folderId: 141965 }),
  });
  expect(target.exists).toBe(false);
  await expect(resolveSiteCheckPdfTarget({
    ...input, fetchJson: async () => ({ exists: false, fileId: 37478, fileVersion: 0, folderId: 141965 }),
  })).rejects.toThrow('inconsistent');
});

test('never falls back to new upload when resolver fails or responds incorrectly', async () => {
  await expect(resolveSiteCheckPdfTarget({
    ...input, fetchJson: async () => { throw new Error('Network failure'); },
  })).rejects.toThrow('Network failure');
  await expect(resolveSiteCheckPdfTarget({
    ...input, fetchJson: async () => ({}),
  })).rejects.toThrow('Could not verify');
  await expect(resolveSiteCheckPdfTarget({
    ...input, fetchJson: async () => ({ exists: true, fileId: 37478, fileVersion: null, folderId: 141965 }),
  })).rejects.toThrow('invalid file ID');
});

test('rejects missing asset and folder IDs', async () => {
  const fetchJson = jest.fn();
  await expect(resolveSiteCheckPdfTarget({...input, assetId: null, fetchJson})).rejects.toThrow('valid site');
  await expect(resolveSiteCheckPdfTarget({...input, folderId: 0, fetchJson})).rejects.toThrow('valid site');
  expect(fetchJson).not.toHaveBeenCalled();
});
