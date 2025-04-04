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
const DashboardNotification = ({siteSelectedForGlobal, loggedInUserData}) => {
  const [notification, setNotification] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getNotifications();
  }, [siteSelectedForGlobal]);

  const getNotifications = async () => {
    if (loggedInUserData?.id) {
      const actions = await get(
        `/api/user/notification/${loggedInUserData?.id}/site/${siteSelectedForGlobal?.siteId}`
      );
      setNotification(actions?.length > 10 ? actions?.slice(0, 10) : actions);
    }
  };

  const dateFormat = (date) => {
    return moment(date, "YYYY-MM-DD").format("DD/MM/YYYY");
  };

  return (
    <Fragment>
      <div className="card">
        <div className="card-body p-2">
         

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
                   <td><b>{i.title}</b> &nbsp;
                   {i.body}</td>
                  <td>{dateFormat(i?.createdAt?.split("T")?.[0])}</td>
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
