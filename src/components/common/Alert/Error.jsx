import React, { Fragment, useEffect, useState } from "react";

const Error = ({ msg, setParentState }) => {
  const [isVisible, setSetIsVisible] = useState(true);
  return (
    <Fragment>
      {isVisible ? (
        <div
          className="alert alert-warning alert-dismissible fade show"
          role="alert"
        >
          <p>{msg}</p>
        </div>
      ) : null}
    </Fragment>
  );
};
export default Error;
