import { Fragment } from "react";

export const InputError = ({ message, key, classList }) => {
  return (
    <Fragment key={key}>
      <div className={`text-danger ${classList}`}>{message}</div>
    </Fragment>
  );
};
