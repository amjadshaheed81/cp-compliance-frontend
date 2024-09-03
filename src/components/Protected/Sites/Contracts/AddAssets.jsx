import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Autocomplete,
} from "@mui/material";

const AddAssets = ({
  siteAssets,
  assetData,
  setAssetData,
}) => {
  const [tableData, setTableData] = useState(assetData || []);

  useEffect(() => {
    setTableData(assetData);
  }, [assetData]);

  const removeByIndex = (list, index) => [
    ...list.slice(0, index),
    ...list.slice(index + 1),
  ];

  const handleAssetChange = (index, selectedValue) => {
    const updatedAssets = siteAssets?.filter(
      (asset) => asset?.assetId === selectedValue?.assetId
    );
    const updatedRow = {
      ...tableData[index],
      assetId: selectedValue?.assetId,
      ...updatedAssets?.[0],
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
          <Autocomplete
            value={siteAssets.find(asset => asset.assetId === itm.assetId) || null}
            onChange={(event, newValue) => handleAssetChange(index, newValue)}
            options={siteAssets}
            getOptionLabel={(option) => option.assetName || ""}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Asset"
                variant="outlined"
              />
            )}
          />
        </TableCell>
        <TableCell>{itm.assetId || ""}</TableCell>
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
            variant="outlined"
            color="error"
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
                <TableCell>Asset ID</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tableData?.length === 0 && (
                <TableCell colSpan={5}>No Assets are added. Please click on Add more button to add assets in this contract.</TableCell>
              )}
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
