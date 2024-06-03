import { Fragment } from "react";

const ListStatusBadge = ({ status }) => {
  return (
    <Fragment>
      {!status && (
        <span class="badge rounded-pill bg-success text-capitalize">{'open'}</span>
      )}
      {(status?.toLowerCase() === "open") && (
        <span class="badge rounded-pill bg-success text-capitalize">{status}</span>
      )}
      {status?.toLowerCase() === "closed" && (
        <span class="badge rounded-pill bg-danger text-capitalize">{status}</span>
      )}
      {status?.toLowerCase() === "sold" && (
        <span class="badge rounded-pill bg-primary text-capitalize">{status}</span>
      )}
    </Fragment>
  );
};
export default ListStatusBadge;
