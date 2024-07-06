// components/Login/LoginForm.js
import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import moment from "moment";
import { Chip } from "@mui/material";

const AddAssets = ({
  siteAssets,
  setSelectedAssets,
  assetData,
  setAssetData,
}) => {
  const [tableData, setTableData] = useState(assetData);
  useEffect(() => {
    setTableData(assetData);
  }, [assetData]);
  const removeByIndex = (list, index) => [
    ...list.slice(0, index),
    ...list.slice(index + 1),
  ];
  const GettableRow = ({ itm, index, setAssetData, assetData }) => {
    const [row, setRowdata] = useState(itm);
    const deleteContractById = (index) => {
      const res = removeByIndex(assetData, index);
      console.log("res", res);
      setAssetData(res);
    };
    let color = "secondary";
    if (itm.status === "received") {
      color = "success";
    }
    return (
      <tr>
        {itm ? (
          <td>
            <select
              className="form-control form-select"
              name="contractors"
              id="contractors"
              onChange={(e) => {
                const selectedValue = e.target.value;
                console.log(selectedValue);
                const getContractorList = siteAssets?.filter(
                  (asset) => asset?.assetId == selectedValue
                );
                const contractRows = [...assetData];
                contractRows[index] = {
                  ...row,
                  contractorUserId: selectedValue,
                  company: getContractorList?.[0]?.company || "",
                };
                setAssetData(contractRows);
                setRowdata({
                  ...row,
                  contractorUserId: selectedValue,
                  company: getContractorList?.[0]?.company || "",
                });
              }}
            >
              <option value={""} disabled selected>Select Asset</option>
              {siteAssets?.map((itm) => (
                <option value={itm?.assetId}>{itm?.assetName}</option>
              ))}
            </select>
          </td>
        ) : (
          <td></td>
        )}
        {itm?.company ? <td>{itm?.company}</td> : <td></td>}
        {itm?.quote ? <td>£ {itm?.quote}</td> : <td></td>}
        {itm?.quoteDate ? (
          <td>{moment(itm?.quoteDate).format("DD-MM-YYYY")}</td>
        ) : (
          <td></td>
        )}
        {itm?.actions ? (
          <td>
            <button
              className="btn btn-sm btn-light text-danger"
              onClick={() => deleteContractById(index)}
            >
              <i className="fas fa-trash"></i>
            </button>
          </td>
        ) : (
          <td>
            <button
              className="btn btn-sm btn-light text-danger"
              onClick={() => deleteContractById(index)}
            >
              <i className="fas fa-trash"></i>
            </button>
          </td>
        )}
      </tr>
    );
  };
  return (
    <Fragment>
      <div>
        <table className="table table-bordered f-11">
          <thead className="table-dark">
            <tr>
              <th scope="col">Asset Name</th>
              <th scope="col">Asset Reference</th>
              <th scope="col">Location</th>
              <th scope="col">Category</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tableData?.map((dataItm, index) => (
              <GettableRow
                itm={dataItm}
                index={index}
                setAssetData={setAssetData}
                assetData={assetData}
              />
            ))}
          </tbody>
        </table>
      </div>
    </Fragment>
  );
};

export default connect(null, {})(AddAssets);
