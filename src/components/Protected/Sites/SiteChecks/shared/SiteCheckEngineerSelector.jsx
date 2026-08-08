import React from "react";
import { Autocomplete, TextField } from "@mui/material";
import { getUserLabel } from "./useSiteCheckEngineers";

/**
 * Shared Site Check engineer dropdown.
 * The business behaviour is controlled by the parent form; this component
 * only provides the common Air Conditioning-style UI and validation display.
 */
const SiteCheckEngineerSelector = ({
  options = [],
  value = null,
  onChange,
  isOpen,
  disabled,
  loading,
  error,
  label = "Engineer's Name",
}) => (
  <div className="mb-3">
    <label className="form-label fw-bold">{label}</label>
    <Autocomplete
      options={options}
      value={value}
      getOptionLabel={getUserLabel}
      isOptionEqualToValue={(option, selectedValue) =>
        String(option.id) === String(selectedValue?.id)
      }
      onChange={onChange}
      disableClearable={isOpen}
      noOptionsText="No active users are assigned to this site"
      disabled={disabled}
      loading={loading}
      renderInput={(params) => (
        <TextField
          {...params}
          required
          variant="outlined"
          placeholder="Select engineer"
          error={Boolean(error)}
          helperText={error || ""}
          sx={{
            "& .MuiOutlinedInput-root": {
              minHeight: "40px",
              padding: "0 8px",
            },
          }}
        />
      )}
    />
  </div>
);

export default SiteCheckEngineerSelector;
