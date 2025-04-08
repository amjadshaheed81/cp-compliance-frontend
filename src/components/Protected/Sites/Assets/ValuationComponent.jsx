import React from "react";
import { useForm } from "react-hook-form";
import DatePicker from "../../../common/DatePicker";
import { InputError } from "../../../common/InputError";

const ValuationComponent = ({
  valuation,
  index,
  onRemove,
  onUpdate,
  users,
  isRemovable,
}) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    defaultValues: valuation,
  });

  const onSubmit = (data) => {
    onUpdate(index, data);
  };

  return (
    <div className="border p-3 mb-3">
      <form onChange={handleSubmit(onSubmit)}>
        <div className="row">
          <div className="col-md-4">
            <div className="form-group mt-2">
              <DatePicker
                label="Valuation Date"
                required={true}
                value={
                  watch("valuationDate")
                    ? new Date(watch("valuationDate"))
                    : null
                }
                onChange={(date) => {
                  setValue(
                    "valuationDate",
                    date ? date.toISOString().split("T")[0] : "",
                    { shouldValidate: true }
                  );
                  handleSubmit(onSubmit)();
                }}
              />
              {errors?.valuationDate && (
                <InputError
                  message={errors?.valuationDate?.message}
                  key={errors?.valuationDate?.message}
                />
              )}
            </div>
          </div>
          <div className="col-md-4">
            <div className="form-group mt-2">
              <label htmlFor={`valuationValue-${index}`}>Valuation</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                id={`valuationValue-${index}`}
                placeholder=""
                {...register("valuationValue", {
                  required: {
                    value: true,
                    message: `Please enter valuation value`,
                  },
                })}
              />
              {errors?.valuationValue && (
                <InputError
                  message={errors?.valuationValue?.message}
                  key={errors?.valuationValue?.message}
                />
              )}
            </div>
          </div>
          <div className="col-md-4">
            <label htmlFor={`valuationUserId-${index}`}>
              Valuation Done By
            </label>
            <select
              className="form-control form-select"
              id={`valuationUserId-${index}`}
              {...register("valuationUserId", {
                required: {
                  value: true,
                  message: `Please select valuation done by`,
                },
              })}
            >
              <option value=""></option>
              {users?.map((itm) => (
                <option value={itm?.id} key={itm?.name}>
                  {itm?.name}
                </option>
              ))}
            </select>
            {errors?.valuationUserId && (
              <InputError
                message={errors?.valuationUserId?.message}
                key={errors?.valuationUserId?.message}
              />
            )}
          </div>
        </div>
        {isRemovable && (
          <button
            type="button"
            className="btn btn-danger btn-sm mt-2"
            onClick={() => onRemove(index)}
          >
            Remove Valuation
          </button>
        )}
      </form>
    </div>
  );
};

export default ValuationComponent;
