import { Fragment } from "react";
import "./StatuaryStatus.css";

const StatuaryStatus = ({ status }) => {
  return (
    <Fragment>
      {status?.toLowerCase() === "passed" && (
        <span className="badge rounded-pill bg-light text-success text-capitalize display-4">
          {status}
        </span>
      )}
      {status?.toLowerCase() === "failed" && (
        <span className="badge rounded-pill text-danger text-capitalize">
          {status}
        </span>
      )}
      {status?.toLowerCase() === "open" && (
        <span className="badge rounded-pill bg-light text-warning text-capitalize">
          {status}
        </span>
      )}
    </Fragment>
  );
};
export default StatuaryStatus;
