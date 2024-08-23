export const getCategoryLabelValue = (asset) => {
  let str = "";
  if (asset?.category) {
    str += asset?.category;
  }
  if (asset?.subCategory) {
    str += ` > ${asset?.subCategory}`;
  }
  if (asset?.subCategory2) {
    str += ` > ${asset?.subCategory2}`;
  }
  if (asset?.subCategory3) {
    str += ` > ${asset?.subCategory3}`;
  }
  return str;
};
