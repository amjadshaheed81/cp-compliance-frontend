import { Fragment } from "react";

const StatusBadge = ({ status }) => {
  return (
    <Fragment>
      {status === "Received" || status === "New" && (
        <div className="bg-warning text-light rounded-1 p-1" role="alert">
          Recieved
        </div>
      )}
      {status === "Submmitted" && (
        <div className="bg-light text-primary rounded-1 p-1" role="alert">
          Recieved
        </div>
      )}
      {status === "Awarded" && (
        <div className="bg-light text-success rounded-1 p-1" role="alert">
          Recieved
        </div>
      )}
    </Fragment>
  );
};
export default StatusBadge;
