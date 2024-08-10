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
const DashboardActiveProjects = (siteSelectedForGlobal) => {

  const [contractList, setContractList] = useState([]);

  useEffect(()=>{
    getProjectList();
  },[])

  const getProjectList = async () => {
    if(siteSelectedForGlobal?.siteSelectedForGlobal?.siteId) {
      const projects = await get(
        `/api/project/contracts?siteId=${siteSelectedForGlobal?.siteSelectedForGlobal?.siteId}`
      );
      setContractList(projects?.projectContracts || []);
    }
  };

  const dateFormat = (date) => {
    return moment(date, 'YYYY-MM-DD').format('DD/MM/YYYY');
  }

  return (
    <Fragment>
      <div className="card">
        <div className="card-body p-2">
          <div className="d-flex bd-highlight p-0">
            <div className="bd-highlight">
              <h5 className="card-title">Active Projects</h5>
            </div>
            <div className="ms-auto bd-highlight">
              <button
                type="button"
                className="btn btn-sm btn-light text-primary"
              >
                View All
              </button>
            </div>
          </div>
          <div className="table-responsive">
            <table className="table table-bordered f-11">
              <thead className="table-dark">
               
                <tr>
                  <th scope="col">Project</th>
                  <th scope="col">Start Date</th>
                  <th scope="col">End Date</th>
                  <th scope="col">Budget</th>
                </tr>
              </thead>
              <tbody>
              
                {contractList.slice(0, 5).map(i=>(
                  <tr>
                  <td>{i.summary}</td>
                  <td>{dateFormat(i?.startDate?.split("T")?.[0])}</td>
                  <td>{dateFormat(i?.endDate?.split("T")?.[0])}</td>
                  <td>&#8364; {i.cost}</td>
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
})(DashboardActiveProjects);