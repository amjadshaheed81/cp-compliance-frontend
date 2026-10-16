/**
 * The Monthly Audit originally treats four comma-separated values as two
 * alternative level-3 categories. Keep that legacy rule for other questions.
 *
 * Only the verified 8.1.2 definition is strict at all FOUR levels.
 * Only the verified 9.1.1 definition includes the existing (legacy) category
 * and the current Sanitary categories. Nothing changes the stored asset data.
 *
 * Future question definitions may use `exact:level1,level2,level3,level4`
 * or `path1|path2` for explicit, complete category paths.
 */
const holdOpenRule = "Electrical,Access Controls,Internal Access Controls,Door Hold Open Device";
const wcLegacyRule = "Mechanical,Sanitary,Toilet/Urinal";
const wcCurrentRules = [
  "Mechanical,Sanitary,Toilet / 6 Litre Toilet",
  "Mechanical,Sanitary,Toilet / 9 Litre Toilet",
  "Mechanical,Sanitary,Urinal",
];
const fields = ["category", "subCategory", "subCategory2", "subCategory3"];
const trim = (value) => String(value ?? "").trim();
// Preserve the old optional-chaining behaviour: a missing asset field must
// not match an empty expected value in a legacy question definition.
const same = (value, expected) => value !== null && value !== undefined && trim(value) === expected;

const exactPath = (asset, path) => {
  const parts = path.split(",").map(trim);
  return parts.length >= 1 && parts.length <= 4 && parts.every((part, i) =>
    part && same(asset?.[fields[i]], part));
};

export const monthlyCategoryIsStrict = (question) => {
  const value = trim(question?.assetCategory);
  return value.startsWith("exact:") || value.includes("|") ||
    (question?.order === "8.1.2" && value === holdOpenRule);
};

export const monthlyCategoryHasParentAssets = (question, assets = []) => {
  if (!(question?.order === "8.1.2" && trim(question?.assetCategory) === holdOpenRule)) return false;
  const parts = holdOpenRule.split(",");
  return (assets || []).some((asset) => parts.slice(0, 3).every((part, i) =>
    same(asset?.[fields[i]], part)));
};

export const matchesMonthlyCategory = (question, asset) => {
  const rule = trim(question?.assetCategory);
  if (question?.order === "9.1.1" && rule === wcLegacyRule) {
    return [wcLegacyRule, ...wcCurrentRules].some((path) => exactPath(asset, path));
  }
  if (question?.order === "8.1.2" && rule === holdOpenRule) {
    return exactPath(asset, rule);
  }
  if (rule.startsWith("exact:")) return exactPath(asset, rule.slice(6).trim());
  if (rule.includes("|")) return rule.split("|").some((path) => exactPath(asset, path.trim()));

  // Preserve old behaviour for every other Monthly Audit question.
  const parts = rule.split(",").map(trim);
  if (parts.length === 4) {
    return same(asset?.category, parts[0]) &&
      same(asset?.subCategory, parts[1]) &&
      [parts[2], parts[3]].some((part) => same(asset?.subCategory2, part));
  }
  if (parts.length === 3) {
    return same(asset?.category, parts[0]) &&
      same(asset?.subCategory, parts[1]) && same(asset?.subCategory2, parts[2]);
  }
  if (parts.length === 2) {
    // The original two-part check deliberately compares category without trimming.
    return asset?.category === parts[0] && same(asset?.subCategory, parts[1]);
  }
  if (parts.length === 1 && parts[0]) return same(asset?.category, parts[0]);
  return true;
};
