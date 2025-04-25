import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import SidebarNew from "../../../common/Sidebar/SidebarNew";
import Header from "../../../common/Header/Header";
import BreadCrumHeader from "../../../common/BreadCrumHeader/BreadCrumHeader";
import { get } from "../../../../api";
import { selectGlobalSite } from "../../../../store/thunk/site";
import moment from "moment";
import InspectionElectricalCertificate from "./InspectionElectricalCertificate";
import InspectionElectricalFault from "./InspectionElectricalFault";
import InspectionFireCertificate from "./InspectionFireCertificate";
import InspectionFireFault from "./InspectionFireFault";

const SiteCheckDetail = ({ sasToken, loggedInUserData, selectGlobalSite }) => {
  const [siteCheck, setSiteCheck] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    getSiteCheck();
  }, []);

  const getSiteCheck = async () => {
    const data = await get(`/api/site-check/${id}`);
    selectGlobalSite(data.siteId, data.site?.siteName)
    setSiteCheck(data);
    setIsLoading(false);
  };

  const getTypeFromSubtype = (subType) => {
    if (subType === "Electrical") {
      return "Electrical";
    } else if (subType === "Fire Alarm to meet BS5839") {
      return "FireAlarm";
    }
    return subType;
  };

  return (
    <>
      <SidebarNew />
      <div className="content">
        <Header />
        <div className="container-fluid">
          <BreadCrumHeader header={"Site Check"} page={"Site Check Detail"} />
          {isLoading ? (
            <div className="d-flex justify-content-center pt-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <>
              <div className="row pb-3">
                <div className="col-md-2">
                  <div class="home-cards bg-white">
                    <div class="home-card-content">
                      <h6>Site Name</h6>
                      <h6
                        class="font-weight-light"
                        style={{ color: "#384BD3" }}
                      >
                        {siteCheck?.site?.siteName}
                      </h6>
                    </div>
                  </div>
                </div>
                <div className="col-md-2">
                  <div class="home-cards bg-white">
                    <div class="home-card-content">
                      <h6>Type</h6>
                      <h6
                        class="font-weight-light"
                        style={{ color: "#384BD3" }}
                      >
                        {siteCheck?.type}
                      </h6>
                    </div>
                  </div>
                </div>
                <div className="col-md-2">
                  <div class="home-cards bg-white">
                    <div class="home-card-content">
                      <h6>Sub Type</h6>
                      <h6
                        class="font-weight-light"
                        style={{ color: "#384BD3" }}
                      >
                        {siteCheck?.subType}
                      </h6>
                    </div>
                  </div>
                </div>
                <div className="col-md-2">
                  <div class="home-cards bg-white">
                    <div class="home-card-content">
                      <h6>Category</h6>
                      <h6
                        class="font-weight-light"
                        style={{ color: "#384BD3" }}
                      >
                        {siteCheck?.category}
                      </h6>
                    </div>
                  </div>
                </div>
                <div className="col-md-2">
                  <div class="home-cards bg-white">
                    <div class="home-card-content">
                      <h6>Start Date</h6>
                      <h6
                        class="font-weight-light"
                        style={{ color: "#384BD3" }}
                      >
                        {moment(siteCheck?.startDate).format("MM/DD/YYYY")}
                      </h6>
                    </div>
                  </div>
                </div>
                <div className="col-md-2">
                  <div class="home-cards bg-white">
                    <div class="home-card-content">
                      <h6>Due Date</h6>
                      <h6
                        class="font-weight-light"
                        style={{ color: "#384BD3" }}
                      >
                        {moment(siteCheck?.dueDate).format("MM/DD/YYYY")}
                      </h6>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
          <div className="col-md-12 bg-white p-4 card">
            {getTypeFromSubtype(siteCheck?.subType) === "Electrical" && (
              <>
                <InspectionElectricalCertificate
                  sasToken={sasToken}
                  checkId={id}
                />
                <hr />
                <InspectionElectricalFault
                  sasToken={sasToken}
                  checkId={id}
                  siteCheck={siteCheck}
                />
              </>
            )}
            {getTypeFromSubtype(siteCheck?.subType) === "FireAlarm" && (
              <>
                <InspectionFireCertificate
                  sasToken={sasToken}
                  checkId={id}
                />
                <hr />
                <InspectionFireFault
                  sasToken={sasToken}
                  checkId={id}
                  siteCheck={siteCheck}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

const mapStateToProps = (state) => ({
  sasToken: state.site.sasToken,
  loggedInUserData: state.site.loggedInUserData,
});

export default connect(mapStateToProps, { selectGlobalSite })(SiteCheckDetail); 