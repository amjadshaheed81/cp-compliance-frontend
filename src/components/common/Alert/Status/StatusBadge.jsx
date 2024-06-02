import { Fragment } from "react";

const StatusBadge = ({ status }) => {
  return (
    <Fragment>
      {status === "Received" || status === "New" && (
        <div class="bg-warning text-light rounded-1 p-1" role="alert">
          Recieved
        </div>
      )}
      {status === "Submmitted" && (
        <div class="bg-light text-primary rounded-1 p-1" role="alert">
          Recieved
        </div>
      )}
      {status === "Awarded" && (
        <div class="bg-light text-success rounded-1 p-1" role="alert">
          Recieved
        </div>
      )}
    </Fragment>
  );
};
export default StatusBadge;
