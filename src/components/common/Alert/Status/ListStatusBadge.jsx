import { Fragment } from "react";

const ListStatusBadge = ({ status }) => {
  return (
    <Fragment>
      {!status && (
        <span className="badge rounded-pill bg-success text-capitalize">{'open'}</span>
      )}
      {(status?.toLowerCase() === "open") && (
        <span className="badge rounded-pill bg-success text-capitalize">{status}</span>
      )}
      {status?.toLowerCase() === "closed" && (
        <span className="badge rounded-pill bg-danger text-capitalize">{status}</span>
      )}
      {status?.toLowerCase() === "sold" && (
        <span className="badge rounded-pill bg-primary text-capitalize">{status}</span>
      )}
    </Fragment>
  );
};
export default ListStatusBadge;
