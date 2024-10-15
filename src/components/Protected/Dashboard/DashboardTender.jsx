// components/Login/LoginForm.js
import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import { useNavigate } from "react-router-dom";
import { get } from "../../../api";
import moment from "moment";
import ChipComponent from "../../common/Chips/Chips";
const DashboardTender = ({ siteSelectedForGlobal }) => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  useEffect(() => {
    getContracts();
  }, []);
  const getContracts = async () => {
    if (siteSelectedForGlobal?.siteId) {
      const projects = await get(
        `/api/project/contracts?siteId=${siteSelectedForGlobal?.siteId}`
      );
      // Show only the first 5 contracts
      const limitedContracts = (projects?.projectContracts || []).slice(0, 5);
      
      setContracts(limitedContracts);
    }
  };
  return (
    <Fragment>
      <div className="card">
        <div className="card-body p-2">
          <div className="d-flex bd-highlight p-0">
            <div className="bd-highlight">
              <h5 className="card-title">Tender &amp; Quotes - {siteSelectedForGlobal?.siteName}</h5>
            </div>
            <div className="ms-auto bd-highlight">
              <button
                type="button"
                className="btn btn-sm btn-light text-primary"
                onClick={() => navigate("/site-contracts")}
              >
                View All
              </button>
            </div>
          </div>
          <div className="table-responsive">
            <table className="table table-bordered f-11">
              <thead className="table-dark">
                <tr>
                  <th scope="col">Tender ID</th>
                  <th scope="col"># of Quotes</th>
                  <th scope="col">End Date</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {contracts?.length === 0 && (
                  <tr>
                    <td colSpan={3}>No Result Found</td>
                  </tr>
                )}
                {contracts?.map((contract) => (
                  <tr>
                    <td>{contract?.projectContractId}</td>
                    <td>{contract?.contractorQuotes?.length || 0}</td>
                    <td>
                      {contract?.endDate
                        ? moment(contract?.endDate).format("DD-MM-YYYY")
                        : "--"}
                    </td>
                    <td>
                      <ChipComponent status={contract?.status} />
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
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
});
export default connect(mapStateToProps, {})(DashboardTender);
