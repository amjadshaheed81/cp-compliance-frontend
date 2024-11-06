import React, { Fragment, useEffect, useRef, useState } from "react";
import { connect } from "react-redux";
import { useNavigate } from "react-router-dom";
import { get } from "../../../../api";
import { getSites } from "../../../../store/thunk/site";
import TotalAction from "./TotalAction";

const StatutoryRegister = ({ siteSelectedForGlobal, loggedInUserData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [create, setCreate] = useState(false);
  const site = JSON.parse(localStorage.getItem("site"));
  const [filteredSiteChecks, setFilteredSiteChecks] = useState([]);
  const [managerList, setManagerList] = useState([]);
  const [statutory, setStatutory] = useState([]);


  useEffect(() => {
    getStatutory(siteSelectedForGlobal?.siteId);
  }, []);
  const getStatutory = async (siteId) => {
    setIsLoading(true);
    let getStatutoryDocuments = await get(
      `/api/document/${siteId}/statutoryRegister`
    );
    getStatutoryDocuments = getStatutoryDocuments.sort(
      (a, b) => parseInt(a.sortOrder) - parseInt(b.sortOrder)
    );
    setStatutory(getStatutoryDocuments);
    setIsLoading(false);
  };

  const [itemsPerPage] = useState(7);
  const [currentPage, setCurrentPage] = useState(1);
  const indexOfLastPreAction = currentPage * itemsPerPage;
  const indexOfFirstPreAction = indexOfLastPreAction - itemsPerPage;
  const currentSiteChecks = filteredSiteChecks.slice(
    indexOfFirstPreAction,
    indexOfLastPreAction
  );

  return (
    <Fragment>
      <div>
        <div>
          {!create && (
            <>
              <div className="">
                <div className="">
                  <div className="row" style={{ height: "auto" }}>
                    <div className="col-md-6 mt-2 mb-4">
                      <h5>Statutory Register</h5>
                      <TotalAction
                        data={statutory}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Fragment>
  );
};

const mapStateToProps = (state) => ({
  sites: state.site.sites,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
  loggedInUserData: state.site.loggedInUserData,
});
export default connect(mapStateToProps, { getSites })(StatutoryRegister);
