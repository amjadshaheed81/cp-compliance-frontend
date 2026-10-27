/**
 * Use the asset-aware backend resolver; never select a PDF with startsWith().
 * Its response must include a verified file ID, current version and folder.
 * A missing/failed resolver must NOT result in a new document upload.
 */
export const resolveSiteCheckPdfTarget = async ({
  fetchJson, siteId, checkId, assetId, fileName, folderId,
}) => {
  const positiveId = (v) => Number.isSafeInteger(Number(v)) && Number(v) > 0;
  if (typeof fetchJson !== 'function' || !positiveId(siteId) || !positiveId(checkId) ||
      !positiveId(assetId) || !positiveId(folderId) || !fileName?.toLowerCase().endsWith('.pdf')) {
    throw new Error('A valid site, Site Check, asset and PDF folder are required. No document was uploaded.');
  }
  const params = new URLSearchParams({
    siteId: String(siteId),
    checkId: String(checkId),
    assetId: String(assetId),
    fileName,
    folderId: String(folderId),
  });
  const target = await fetchJson(`/api/document/site-check/pdf-target?${params.toString()}`);
  if (!target || typeof target.exists !== 'boolean' || !positiveId(target.folderId)) {
    throw new Error('Could not verify the original Site Document. No document was uploaded.');
  }
  if (target.exists) {
    if (!positiveId(target.fileId) || !positiveId(target.fileVersion)) {
      throw new Error('Existing Site Document has an invalid file ID or version. No document was uploaded.');
    }
  } else if (target.fileId != null || Number(target.fileVersion) !== 0) {
    throw new Error('The Site Document resolver returned inconsistent data. No document was uploaded.');
  }
  return target;
};
