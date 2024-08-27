import React from "react";
import { Pagination as MuiPagination } from "@mui/material";
import { styled, useTheme } from "@mui/system";
import { Box, useMediaQuery } from "@mui/material";
import "./Pagination.css";

const SquarePagination = styled(MuiPagination)(({ theme }) => ({
  "& .MuiPaginationItem-root": {
    borderRadius: 0, // Removes the default rounded corners
    minWidth: "40px", // Sets a square shape
    height: "40px",
    [theme.breakpoints.down("sm")]: {
      minWidth: "30px", // Smaller squares on small screens
      height: "30px",
    },
  },
}));

const Pagination = ({ totalPages, currentPage, onPageChange }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleChange = (event, value) => {
    onPageChange(value);
  };

  return (
    <Box
      display={totalPages === 0 ? "none" : "flex"}
      justifyContent="center"
      mt={2}
      flexDirection={isMobile ? "column" : "row"} // Stack vertically on mobile
      alignItems="center"
    >
      <div className="pagination-container" style={{ marginBottom: isMobile ? "10px" : "0" }}>
        Page {currentPage} of {totalPages}
      </div>
      <SquarePagination
        count={totalPages}
        page={currentPage}
        showFirstButton={!isMobile} // Hide first/last buttons on mobile for simplicity
        showLastButton={!isMobile}
        onChange={handleChange}
        color="primary"
        siblingCount={isMobile ? 0 : 1} // Show fewer page buttons on mobile
        boundaryCount={isMobile ? 1 : 2}
      />
    </Box>
  );
};

export default Pagination;
