import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import DatePicker from "../../../common/DatePicker";
import { InputError } from "../../../common/InputError";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { IconButton, Tooltip, Box } from "@mui/material";
import { formatDate } from "../../../../utils/dateFormat";

const ValuationComponent = ({
  valuation,
  onRemove,
  onUpdate,
  users,
  isRemovable,
  index,
  hasDisposalDate, // Add this prop
}) => {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    defaultValues: valuation,
  });

  // Update parent whenever any field changes
  useEffect(() => {
    const subscription = watch((value) => {
      if (!hasDisposalDate) {
        onUpdate(value);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, onUpdate, hasDisposalDate]);

  return (
    <tr>
      {/* Valuation Date Cell */}
      <td className="align-middle" style={{ padding: "12px 16px" }}>
        <div className="form-group mb-0">
          <DatePicker
            disabled={hasDisposalDate}
            required={true}
            value={watch("date") ? new Date(watch("date")) : null}
            onChange={(date) => {
              if (hasDisposalDate) return;

              // Improved date handling
              const dateValue = date ? `${formatDate(date)} 10:00:00` : "";

              setValue("date", dateValue, {
                shouldValidate: true,
              });
              onUpdate(index, {
                ...valuation,
                date: dateValue,
              });
            }}
            fullWidth
            variant="standard"
            InputProps={{
              disableUnderline: true,
              className: "form-control p-0",
              readOnly: hasDisposalDate,
            }}
            sx={{
              "& .MuiInputBase-root": {
                height: "40px",
                alignItems: "center",
                backgroundColor: hasDisposalDate ? "#f5f5f5" : "inherit",
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
            required
            className="form-control plain-input"
            style={{
              height: "40px",
              padding: "8px 12px",
              border: "none",
              backgroundColor: hasDisposalDate ? "#f5f5f5" : "transparent",
              borderBottom: "1px solid #ced4da",
              width: "100%",
              boxSizing: "border-box",
              cursor: hasDisposalDate ? "not-allowed" : "default",
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
              if (!hasDisposalDate) {
                const value = parseFloat(e.target.value) || 0;
                setValue("valuation", value);
                onUpdate(index, {
                  ...valuation,
                  valuation: value,
                });
              }
            }}
            readOnly={hasDisposalDate}
            disabled={hasDisposalDate}
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
            required
            style={{
              height: "40px",
              padding: "8px 12px",
              border: "none",
              backgroundColor: hasDisposalDate ? "#f5f5f5" : "transparent",
              borderBottom: "1px solid #ced4da",
              width: "100%",
              appearance: "none",
              boxSizing: "border-box",
              cursor: hasDisposalDate ? "not-allowed" : "default",
            }}
            {...register("valuationBy", {
              required: {
                value: true,
                message: `Please select valuation done by`,
              },
            })}
            onChange={(e) => {
              if (!hasDisposalDate) {
                const value = Number(e.target.value);
                setValue("valuationBy", value);
                onUpdate(index, {
                  ...valuation,
                  valuationBy: value,
                });
              }
            }}
            readOnly={hasDisposalDate}
            disabled={hasDisposalDate}
          >
            <option value="">Select evaluator</option>
            {users?.map((itm) => (
              <option value={itm?.id} key={itm?.id}>
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
        <Box
          display="flex"
          gap={1}
          justifyContent="flex-end"
          sx={{ visibility: hasDisposalDate ? "hidden" : "visible" }}
        >
          {isRemovable && !hasDisposalDate && (
            <Tooltip
              title={
                hasDisposalDate
                  ? "Cannot remove after disposal"
                  : "Remove valuation"
              }
            >
              <span>
                <IconButton
                  color="error"
                  onClick={() => !hasDisposalDate && onRemove(index)}
                  size="small"
                  readOnly={hasDisposalDate}
                  disabled={hasDisposalDate}
                  sx={{
                    display: hasDisposalDate ? "none" : "inline-flex",
                    opacity: hasDisposalDate ? 0 : 1,
                    pointerEvents: hasDisposalDate ? "none" : "auto",
                  }}
                >
                  <DeleteForeverIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Box>
      </td>
    </tr>
  );
};

export default ValuationComponent;
