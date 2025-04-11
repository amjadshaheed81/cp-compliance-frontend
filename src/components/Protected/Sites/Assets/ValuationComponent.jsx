import React from "react";
import { useForm } from "react-hook-form";
import DatePicker from "../../../common/DatePicker";
import { InputError } from "../../../common/InputError";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { IconButton, Tooltip, Box } from "@mui/material";

const ValuationComponent = ({
  valuation,
  index,
  onRemove,
  users,
  isRemovable,
}) => {
  const {
    register,
    control,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    defaultValues: valuation,
  });

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
              setValue("date", date ? date.toISOString().split("T")[0] : "", {
                shouldValidate: true,
              });
            }}
            fullWidth
            variant="standard"
            InputProps={{
              disableUnderline: true,
              className: "form-control p-0",
            }}
            sx={{
              "& .MuiInputBase-root": {
                height: "40px",
                alignItems: "center",
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
              backgroundColor: "transparent",
              borderBottom: "1px solid #ced4da",
              width: "100%",
              boxSizing: "border-box",
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
            })}
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
              backgroundColor: "transparent",
              borderBottom: "1px solid #ced4da",
              width: "100%",
              appearance: "none",
              boxSizing: "border-box",
              cursor: "default",
            }}
            {...register("valuationBy", {
              required: {
                value: true,
                message: `Please select valuation done by`,
              },
            })}
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
          {isRemovable && (
            <Tooltip title="Remove valuation">
              <IconButton
                color="error"
                onClick={() => onRemove(index)}
                size="small"
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
