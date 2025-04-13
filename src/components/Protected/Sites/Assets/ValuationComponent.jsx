import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import DatePicker from "../../../common/DatePicker";
import { InputError } from "../../../common/InputError";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { IconButton, Tooltip, Box } from "@mui/material";

const ValuationComponent = ({
  valuation,
  index,
  onRemove,
  onUpdate,
  users,
  isRemovable,
  hasDisposalDate, // Add this prop
}) => {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
    control,
  } = useForm({
    defaultValues: valuation,
  });

  // Disable all fields if disposal date exists
  const isDisabled = hasDisposalDate;

  // Update parent whenever any field changes
  useEffect(() => {
    const subscription = watch((value) => {
      if (!isDisabled) {
        onUpdate(index, {
          ...valuation,
          ...value,
        });
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, onUpdate, index, valuation, isDisabled]);

  return (
    <tr>
      {/* Valuation Date Cell */}
      <td className="align-middle" style={{ padding: "12px 16px" }}>
        <div className="form-group mb-0">
          <DatePicker
            label=""
            required={true}
            value={watch("date") ? new Date(watch("date")) : null}
            onChange={(date) => {
              if (!isDisabled) {
                const dateValue = date ? date.toISOString().split("T")[0] : "";
                setValue("date", dateValue, {
                  shouldValidate: true,
                });
                onUpdate(index, {
                  ...valuation,
                  date: dateValue,
                });
              }
            }}
            fullWidth
            variant="standard"
            InputProps={{
              disableUnderline: true,
              className: "form-control p-0",
              readOnly: isDisabled, // Disable if disposal date exists
            }}
            sx={{
              "& .MuiInputBase-root": {
                height: "40px",
                alignItems: "center",
                backgroundColor: isDisabled ? "#f5f5f5" : "inherit",
              },
            }}
          />
          {errors?.date && (
            <InputError
              message={errors?.date?.message}
              key={errors?.date?.message}
            />
          )}
        </div>
      </td>

      {/* Valuation Cell */}
      <td className="align-middle" style={{ padding: "12px 16px" }}>
        <div className="form-group mb-0">
          <input
            id={`valuation-${index}`}
            type="number"
            step="0.01"
            min={0}
            className="form-control plain-input"
            style={{
              height: "40px",
              padding: "8px 12px",
              border: "none",
              backgroundColor: isDisabled ? "#f5f5f5" : "transparent",
              borderBottom: "1px solid #ced4da",
              width: "100%",
              boxSizing: "border-box",
              cursor: isDisabled ? "not-allowed" : "default",
            }}
            {...register("valuation", {
              required: {
                value: true,
                message: `Please enter valuation value`,
              },
              min: {
                value: 0,
                message: "Valuation must be positive",
              },
              valueAsNumber: true,
            })}
            onChange={(e) => {
              if (!isDisabled) {
                const value = parseFloat(e.target.value) || 0;
                setValue("valuation", value);
                onUpdate(index, {
                  ...valuation,
                  valuation: value,
                });
              }
            }}
            readOnly={isDisabled} // Disable if disposal date exists
          />
          {errors?.valuation && (
            <InputError
              message={errors?.valuation?.message}
              key={errors?.valuation?.message}
            />
          )}
        </div>
      </td>

      {/* Valuation Done By Cell */}
      <td className="align-middle" style={{ padding: "12px 16px" }}>
        <div className="form-group mb-0">
          <select
            id={`valuationBy-${index}`}
            className="form-control plain-input"
            style={{
              height: "40px",
              padding: "8px 12px",
              border: "none",
              backgroundColor: isDisabled ? "#f5f5f5" : "transparent",
              borderBottom: "1px solid #ced4da",
              width: "100%",
              appearance: "none",
              boxSizing: "border-box",
              cursor: isDisabled ? "not-allowed" : "default",
            }}
            {...register("valuationBy", {
              required: {
                value: true,
                message: `Please select valuation done by`,
              },
            })}
            onChange={(e) => {
              if (!isDisabled) {
                const value = Number(e.target.value);
                setValue("valuationBy", value);
                onUpdate(index, {
                  ...valuation,
                  valuationBy: value,
                });
              }
            }}
            disabled={isDisabled} // Disable if disposal date exists
          >
            <option value="">Select evaluator</option>
            {users?.map((itm) => (
              <option value={itm?.id} key={itm?.name}>
                {itm?.name}
              </option>
            ))}
          </select>
          {errors?.valuationBy && (
            <InputError
              message={errors?.valuationBy?.message}
              key={errors?.valuationBy?.message}
            />
          )}
        </div>
      </td>

      {/* Delete Action Cell */}
      <td className="align-middle" style={{ padding: "12px 16px" }}>
        <Box display="flex" gap={1} justifyContent="flex-end">
          {isRemovable &&
            !isDisabled && ( // Only show if not disabled
              <Tooltip
                title={
                  isDisabled
                    ? "Cannot remove after disposal"
                    : "Remove valuation"
                }
              >
                <IconButton
                  color="error"
                  onClick={() => !isDisabled && onRemove(index)}
                  size="small"
                  disabled={isDisabled}
                >
                  <DeleteForeverIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
        </Box>
      </td>
    </tr>
  );
};

export default ValuationComponent;
