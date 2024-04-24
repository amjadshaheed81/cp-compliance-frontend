import React, { Fragment, useState } from "react";

const Success = ({ msg, setSuccessMsg }) => {
  const [isVisible, setSetIsVisible] = useState(true);
  return (
    <Fragment>
      {isVisible ? (
        <div
          className="alert alert-success alert-dismissible fade show"
          role="alert"
        >
          <p>{msg}</p>
        </div>
      ) : null}
    </Fragment>
  );
};
export default Success;
