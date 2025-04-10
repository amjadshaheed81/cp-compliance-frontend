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
    console.log('data',data)
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
                  watch("date")
                    ? new Date(watch("date"))
                    : null
                }
                onChange={(date) => {
                  setValue(
                    "date",
                    date ? date.toISOString().split("T")[0] : "",
                    { shouldValidate: true }
                  );
                  handleSubmit(onSubmit)();
                }}
              />
              {errors?.date && (
                <InputError
                  message={errors?.date?.message}
                  key={errors?.date?.message}
                />
              )}
            </div>
          </div>
          <div className="col-md-4">
            <div className="form-group mt-2">
              <label htmlFor={`valuation-${index}`}>Valuation</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                id={`valuation-${index}`}
                placeholder=""
                {...register("valuation", {
                  required: {
                    value: true,
                    message: `Please enter valuation value`,
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
          </div>
          <div className="col-md-4">
            <label htmlFor={`valuationBy-${index}`}>
              Valuation Done By
            </label>
            <select
              className="form-control form-select"
              id={`valuationBy-${index}`}
              {...register("valuationBy", {
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
            {errors?.valuationBy && (
              <InputError
                message={errors?.valuationBy?.message}
                key={errors?.valuationBy?.message}
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
