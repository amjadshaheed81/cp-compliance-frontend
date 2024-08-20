import { Fragment } from "react";
import "./ListStatusBadge.css";

const ListStatusBadge = ({ status }) => {
  return (
    <Fragment>
      {!status && (
        <span className="badge rounded-pill bg-success text-capitalize">{'open'}</span>
      )}
      {(status?.toLowerCase() === "open") && (
        <span className="badge rounded-pill bg-light text-success text-capitalize">{status}</span>
      )}
      {status?.toLowerCase() === "closed" && (
        <span className="badge rounded-pill text-danger text-capitalize">{status}</span>
      )}
      {status?.toLowerCase() === "sold" && (
        <span className="badge rounded-pill bg-light text-warning text-capitalize">{status}</span>
      )}
      {status?.toLowerCase() === "recieved" && (
        <span className="badge rounded-pill bg-light text-warning text-capitalize">{status}</span>
      )}
      {status?.toLowerCase() === "awarded" && (
        <span className="badge rounded-pill bg-light text-success text-capitalize">{status}</span>
      )}
      {status?.toLowerCase() === "rejected" && (
        <span className="badge rounded-pill text-danger text-capitalize">{status}</span>
      )}
    </Fragment>
  );
};
export default ListStatusBadge;
