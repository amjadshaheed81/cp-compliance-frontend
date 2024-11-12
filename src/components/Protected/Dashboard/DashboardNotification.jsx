import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import moment from "moment";
import {
  getSiteContracts,
  getSiteContractDetails,
  updateContractDetail,
  setLoader,
} from "../../../store/thunk/contracts";
import { get } from "../../../api";
import { useNavigate } from "react-router-dom";
const DashboardNotification = (siteSelectedForGlobal) => {
  const [notification, setNotification] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getNotifications();
  }, [siteSelectedForGlobal]);

  const getNotifications = async () => {
    if (siteSelectedForGlobal?.siteSelectedForGlobal?.siteId) {
      const actions = await get(
        `/api/action/${siteSelectedForGlobal?.siteSelectedForGlobal?.siteId}/summary`
      );
      const data =
        actions?.preActions?.filter(
          (a) => a.status === "Pending Action" || a.status === "Closed"
        ) || [];
      //setNotification(data?.length > 10 ? data?.slice(0, 10) : data);
    }
  };

  const dateFormat = (date) => {
    return moment(date, "YYYY-MM-DD").format("DD/MM/YYYY");
  };

  return (
    <Fragment>
      <div className="card">
        <div className="card-body p-2">
          <div className="d-flex bd-highlight p-0">
            <div className="bd-highlight">
              <h5 className="card-title">Notification - {siteSelectedForGlobal?.siteSelectedForGlobal?.siteName}</h5>
            </div>
            <div className="ms-auto bd-highlight">
              <button
                type="button"
                className="btn btn-sm btn-light text-primary"
                onClick={() => {
                  navigate("/notifications");
                }}
              >
                View All
              </button>
            </div>
          </div>

          <table className="table table-bordered f-11">
            <thead className="table-dark">
              <tr>
                <th scope="col">Notification</th>
                <th scope="col">Date</th>
              </tr>
            </thead>
            <tbody>
              {notification?.length === 0 && (
                <tr>
                  <td colSpan={2} align="center">
                    No records!
                  </td>
                </tr>
              )}
              {notification?.map((i) => (
                <tr>
                  <td>{i.description}</td>
                  <td>{dateFormat(i?.raisedDate?.split("T")?.[0])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Fragment>
  );
};

const mapStateToProps = (state) => ({
  loggedInUserData: state.site.loggedInUserData,

  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
});
export default connect(mapStateToProps, {
  getSiteContracts,
  getSiteContractDetails,
  updateContractDetail,
  setLoader,
})(DashboardNotification);
