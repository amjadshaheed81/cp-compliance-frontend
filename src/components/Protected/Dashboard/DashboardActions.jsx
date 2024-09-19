import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  getSiteContracts,
  getSiteContractDetails,
  updateContractDetail,
  setLoader,
} from "../../../store/thunk/contracts";
import { get } from "../../../api";
const DashboardActions = (siteSelectedForGlobal) => {

  
  const navigate = useNavigate();
  const goTo = (link) => {
    navigate(link);
  };

  const [actionList, setActionList] = useState([]);

  useEffect(()=>{
    getActionList();
  },[siteSelectedForGlobal?.siteSelectedForGlobal?.siteId])

  const getActionList = async () => {
    if(siteSelectedForGlobal?.siteSelectedForGlobal?.siteId) {
      const actions = await get(
        `api/site/actions/${siteSelectedForGlobal?.siteSelectedForGlobal?.siteId}`
      );
      setActionList(actions || []);
    }
  };

  // const dateFormat = (date) => {
  //   return moment(date, 'YYYY-MM-DD').format('DD/MM/YYYY');
  // }

  return (
    <Fragment>
      <div className="card">
        <div className="card-body p-2">
          <div className="d-flex bd-highlight p-0">
            <div className="bd-highlight">
              <h5 className="card-title">Actions</h5>
            </div>
            <div className="ms-auto bd-highlight">
              <button
                type="button"
                className="btn btn-sm btn-light text-primary"
                onClick={()=>{ goTo(
                  `/actions`
                );}}
              >
                View All
              </button>
            </div>
          </div>
          <div className="table-responsive">
            <table className="table table-bordered f-11">
              <thead className="table-dark">
                <tr>
                  <th scope="col">Type</th>
                  <th scope="col">Action</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
              {actionList?.length === 0 && 
                  <tr>
                  <td colSpan={3} align="center">No records!</td>
                 
                  </tr>
                }
                {actionList?.slice(0, 5).map(i=> (
                  <tr>
                     <td>{i.type}</td>
                  <td>{i.desc}</td>
                 
                  <td>
                    <div
                      className={`bg-${i.status === "Completed" ? 'success' : 'warning'} text-light rounded-1 p-1`}
                      role="alert"
                    >
                      {i.status}
                    </div>
                  </td>
                </tr>
                ))}
                
              </tbody>
            </table>
          </div>
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
})(DashboardActions);

