import React from "react";
import { Pagination as MuiPagination } from "@mui/material";
import { styled } from "@mui/system";
import { Box } from "@mui/system";
import "./Pagination.css";

const SquarePagination = styled(MuiPagination)({
  "& .MuiPaginationItem-root": {
    borderRadius: 0, // Removes the default rounded corners
    minWidth: "40px", // Sets a square shape
    height: "40px",
  },
});

const Pagination = ({ totalPages, currentPage, onPageChange }) => {
  const handleChange = (event, value) => {
    onPageChange(value);
  };

  return (
    <Box display={
      totalPages === 0 ? "none" : "flex"
    } justifyContent="center" mt={2}>
      <div className="pagination-container">
        {currentPage} - {totalPages} of {totalPages}
      </div>
      <SquarePagination
        count={totalPages}
        page={currentPage}
        showFirstButton={true}
        showLastButton={true}
        onChange={handleChange}
        color="primary"
      />
    </Box>
  );
};

export default Pagination;
