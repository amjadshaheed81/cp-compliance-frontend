import moment from "moment";

export const getPatTestedStartDate = (asset) => {
  let str = "--";
  if (asset?.assetPATItems?.length > 0) {
    str = moment(
      asset?.assetPATItems[asset?.assetPATItems?.length - 1]?.patDate
    ).format("DD-MM-YYYY");
  }
  return str;
};
export const getPatTestedEndDate = (asset) => {
  let str = "--";
  if (asset?.assetPATItems?.length > 0) {
    str = moment(
      asset?.assetPATItems[asset?.assetPATItems?.length - 1]?.patNextDate
    ).format("DD-MM-YYYY");
  }
  return str;
};
