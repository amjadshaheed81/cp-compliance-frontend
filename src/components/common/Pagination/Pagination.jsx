import React from 'react';
import { Pagination as MuiPagination } from '@mui/material';
import Box from "@mui/material/Box";

const Pagination = ({ totalPages, currentPage, onPageChange }) => {
  const handleChange = (event, value) => {
    onPageChange(value);
  };

  return (
    <Box display="flex" justifyContent="center" mt={2}>
      <MuiPagination
        count={totalPages}
        page={currentPage}
        onChange={handleChange}
        color="primary"
      />
    </Box>
  );
};

export default Pagination;