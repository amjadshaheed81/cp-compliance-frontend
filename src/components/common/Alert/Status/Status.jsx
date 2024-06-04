import { Fragment } from "react";

const Status = ({ status }) => {
  return (
    <Fragment>
      {String(status).toLowerCase() === "received" && (
        <span className="badge bg-info">Recieved</span>
      )}
      {String(status).toLowerCase() === "submmitted" && (
        <span className="badge bg-light">Submmitted</span>
      )}
      {String(status).toLowerCase() === "awarded" && (
        <span className="badge bg-success">Awarded</span>
      )}
      {String(status).toLowerCase() === "completed" && (
        <span className="badge bg-primary">Completed</span>
      )}
    </Fragment>
  );
};
export default Status;
