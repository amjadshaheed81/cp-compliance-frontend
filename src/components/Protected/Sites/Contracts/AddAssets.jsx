import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import moment from "moment";
import {
  Chip,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Select,
  MenuItem,
} from "@mui/material";

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

  const handleAssetChange = (index, selectedValue) => {
    const updatedAssets = siteAssets?.filter(
      (asset) => asset?.assetId == selectedValue
    );
    const updatedRow = {
      ...tableData[index],
      assetId: selectedValue,
      ...updatedAssets?.[0]
    };

    setTableData((prev) => {
      const newData = [...prev];
      newData[index] = updatedRow;
      return newData;
    });

    setAssetData((prev) => {
      const newData = [...prev];
      newData[index] = updatedRow;
      return newData;
    });
  };

  const deleteContractById = (index) => {
    const updatedData = removeByIndex(tableData, index);
    setTableData(updatedData);
    setAssetData(updatedData);
  };

  const GetTableRow = ({ itm, index }) => {
    let color = "secondary";
    if (itm.status === "received") {
      color = "success";
    }

    return (
      <TableRow key={index}>
        <TableCell>
          <Select
            value={itm.assetId || ""}
            onChange={(e) => handleAssetChange(index, e.target.value)}
            displayEmpty
          >
            <MenuItem value="" disabled>
              Select Asset
            </MenuItem>
            {siteAssets?.map((asset) => (
              <MenuItem key={asset.assetId} value={asset.assetId}>
                {asset.assetName}
              </MenuItem>
            ))}
          </Select>
        </TableCell>
        <TableCell>{itm.assetName || ""}</TableCell>
        <TableCell>
          {itm.position ? `${itm.position}` : ""}
          {itm.floor ? ` > ${itm.floor}` : ""}
          {itm.room ? ` > ${itm.room}` : ""}
        </TableCell>
        <TableCell>
          {itm.category ? `${itm.category}` : ""}
          {itm.subCategory ? ` > ${itm.subCategory}` : ""}
          {itm.subCategor2 ? ` > ${itm.subCategor2}` : ""}
        </TableCell>
        <TableCell>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => deleteContractById(index)}
          >
            <i className="fas fa-trash"></i>
          </Button>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <>
      <Box>
        <TableContainer>
          <Table className="table table-bordered f-11">
            <TableHead className="table-dark">
              <TableRow>
                <TableCell>Asset Name</TableCell>
                <TableCell>Asset Reference</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tableData?.map((dataItm, index) => (
                <GetTableRow
                  itm={dataItm}
                  index={index}
                  key={dataItm.assetId || index}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </>
  );
};

export default connect(null, {})(AddAssets);
