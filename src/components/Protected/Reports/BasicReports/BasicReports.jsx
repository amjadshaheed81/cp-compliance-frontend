import React, { Fragment, useState, useEffect } from "react";
import { connect } from "react-redux";
import { CSVLink } from "react-csv";
import { Switch, CircularProgress, Tooltip } from "@mui/material";
import {
  getSiteContracts,
  getSiteContractDetails,
  updateContractDetail,
  setLoader,
} from "../../../../store/thunk/contracts";
import { get } from "../../../../api";
import Swal from "sweetalert2";
import { SiteArea } from "../../../../Constant/SiteArea";
import Pagination from "../../../common/Pagination/Pagination";

const Contracts = ({ loggedInUserData, siteSelectedForGlobal }) => {
  const [basicReportsData, setBasicReportsData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [dataPerPage] = useState(10);
  const [selectedQuestion, setSelectedQuestion] = useState(null); // State for selected question
  const [currentPage, setCurrentPage] = useState(1);
  const indexOfLastContract = currentPage * dataPerPage;
  const indexOfFirstContract = indexOfLastContract - dataPerPage;
  const currentContracts = filteredData.slice(
    indexOfFirstContract,
    indexOfLastContract
  );
  // CSV headers for export
  const csvHeaders = [
    { label: "ID", key: "siteId" },
    { label: "Site Name", key: "siteName" },
    { label: selectedQuestion?.question, key: "selectedValue" },
    { label: "Status", key: "status" },
  ];
  // Prepare data for CSV export
  const csvData = filteredData?.map((data) => ({
    siteId: data?.siteId,
    siteName: data?.siteName,
    selectedValue:
      data[selectedQuestion?.main]?.[selectedQuestion?.key] ? "Yes" : "No",
    status: data.status,
  }));
  const [questions, setQuestions] = useState([
    {
      question:
        "Where the Building is / is not Under the Control of the Client",
      key: "buildingUnderClientControl",
      main: "siteInfoData",
    },
    {
      question: "Where security Guards are / are not Employed",
      key: "securityGuardEmployed",
      main: "siteSafetyData",
    },
    {
      question: "Where there is / is not a Canteen within the Building",
      key: "canteenInBuilding",
      main: "siteInfoData",
    },
    {
      question:
        "Where there is / is not a Dedicated Kitchen Area within the Building",
      key: "dedicatedKitchenArea",
      main: "siteInfoData",
    },
    {
      question: "Where there is / is not areas considered as Confined Spaces",
      key: "confinedSpaces",
      main: "siteSafetyData",
    },
    {
      question:
        "Where there is / is not areas considered as an Accessible Unguarded Roof Area(s)",
      key: "accessibleUnguardedRoofAreas",
      main: "siteSafetyData",
    },
    {
      question:
        "Where there is / is not surface(s) considered as Fragile Roofs or Surfaces",
      key: "fragileRoof",
      main: "siteSafetyData",
    },
    {
      question: "That does / does not contain a permanent Gas Supply",
      key: "utilGas",
      main: "siteEnergyData",
    },
    {
      question: "That does / does not contain a permanent Electricity Supply",
      key: "utilElectricity",
      main: "siteEnergyData",
    },
    {
      question: "That does / does not contain a permanent Water Supply",
      key: "utilWater",
      main: "siteEnergyData",
    },
    {
      question: "That does / does not contain a permanent Telecom/Data Supply",
      key: "utilTelecom",
      main: "siteEnergyData",
    },
    {
      question: "That does / does not have Mains Drainage",
      key: "utilMainsDrainage",
      main: "siteEnergyData",
    },
    {
      question: "That does / does not have a Lighting Conductor",
      key: "lightingConductoreInstalltion",
      main: "siteSafetyData",
    },
    {
      question: "That does / does not have Air Conditioning",
      key: "airConditioning",
      main: "siteEnergyData",
    },
    {
      question: "That does / does not have a Cooling Tower",
      key: "coolingTower",
      main: "siteEnergyData",
    },
    {
      question: "That does / does not have Water Storage Tanks",
      key: "waterTanks",
      main: "siteEnergyData",
    },
    {
      question: "That do / do not contain a Gas Boiler",
      key: "gasBoiler",
      main: "siteEnergyData",
    },
    {
      question: "That do /do not have an Electric Sub-Station on Site",
      key: "electricSubStationOnSite",
      main: "siteEnergyData",
    },
    {
      question: "That do /do not have a Back Up Generator on Site",
      key: "backupGenerator",
      main: "siteEnergyData",
    },
    {
      question: "That do /do not have a Fire Alarm/Detection System",
      key: "fireAlarmSystem",
      main: "siteSafetyData",
    },
    {
      question: "That do /do not have a Sprinkler System",
      key: "sprinklerSystem",
      main: "siteSafetyData",
    },
    {
      question: "That do /do not have Hose Reels",
      key: "hoseReels",
      main: "siteSafetyData",
    },
    {
      question: "That do /do not have Internal CCTV",
      key: "internalCCTV",
      main: "siteSafetyData",
    },
    {
      question: "That do /do not have External CCTV",
      key: "externalCCTV",
      main: "siteSafetyData",
    },
    {
      question: "That does / does not have External Lighting",
      key: "externalLighting",
      main: "siteEnergyData",
    },
    {
      question: "That does / does not have Automatic Barrier(s)",
      key: "automaticBarrier",
      main: "siteSafetyData",
    },
    {
      question: "That does / does not have Automatic Gates (Sliding)",
      key: "automaticGatesSliding",
      main: "siteSafetyData",
    },
    {
      question: "That does / does not have Automatic Gates (Hinged)",
      key: "automaticGatesHinged",
      main: "siteSafetyData",
    },
    {
      question: "That does / does not have Manual Swing Gates",
      key: "manualSwingGates",
      main: "siteSafetyData",
    },
    {
      question: "That does / does not have Hard Landscaping",
      key: "hardLandScaping",
      main: "siteLandScapeData",
    },
    {
      question: "That does / does not have Soft Landscaping",
      key: "softLandScaping",
      main: "siteLandScapeData",
    },
    {
      question: "That does / does not have any Rivers/Ponds/Lakes nearby",
      key: "riverPondLakes",
      main: "siteLandScapeData",
    },
    {
      question: "That does / does not have Tall Trees within its grounds",
      key: "tallTrees",
      main: "siteLandScapeData",
    },
    {
      question: "That does / does not have Drainage Interceptors",
      key: "drainageInterceptors",
      main: "siteLandScapeData",
    },
    {
      question: "That does / does not house any Third Party Telecoms Equipment",
      key: "thirdPartyTelEquipment",
      main: "siteLandScapeData",
    },
    {
      question:
        "That does / does not have any Electrical Overhead Power Lines over-sailing the site",
      key: "electricalOverHeadPowerLines",
      main: "siteLandScapeData",
    },
    {
      question: "That does / does not have Oil/Petrol Storage on Site",
      key: "oilStorageOnSite",
      main: "siteSafetyData",
    },
    {
      question: "That does / does not have LPG Storage on Site",
      key: "lpgStorageOnSite",
      main: "siteSafetyData",
    },
    {
      question: "That does / does not have LPG Bulk Storage on Site",
      key: "lpgBulkStorageOnSite",
      main: "siteSafetyData",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    getProjectList();
  }, [siteSelectedForGlobal]);

  const getProjectList = async () => {
    setIsLoading(true);
    const data = await get("/api/site/site/all?withDetails=true");
    setBasicReportsData(data);
    setIsLoading(false);
  };

  const handleQuestionClick = (question) => {
    const { main, key } = question;
    setSelectedQuestion(question); // Store the selected question
    // Filter data where data[main][key] is explicitly true or false, excluding undefined
    const filtered = basicReportsData.filter(
      (data) => data[main] && data[main][key] !== undefined
    );
    setFilteredData(filtered);
    setCurrentPage(1); // Reset to first page after filtering
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <Fragment>
      <div>
        <div className="d-flex bd-highlight">
          <div className="pt-2 bd-highlight">
            <div
              className="mt-2"
              style={{ display: filteredData?.length === 0 ? "none" : "" }}
            >
              <button
                className="btn btn-sm btn-primary mb-2"
                onClick={() => setFilteredData([])}
              >
                Back
              </button>
              <CSVLink
                data={csvData}
                headers={csvHeaders}
                filename={"basic-report.csv"}
                className="btn btn-sm btn-light mb-2 ml-2"
                style={{ marginLeft: "10px" }}
              >
                <Tooltip title={`Export`} arrow>
                  <i className="fas fa-download"></i>
                </Tooltip>
              </CSVLink>
            </div>
            <div
              className="row p-4"
              style={{
                height: "auto",
                display: filteredData?.length > 0 ? "none" : "",
              }}
            >
              {isLoading && (
                <div>
                  <CircularProgress />
                </div>
              )}
              {!isLoading && (
                <Fragment>
                  <ul>
                    {questions.map((question, index) => (
                      <li key={index}>
                        <a
                          className="cursor"
                          onClick={(e) => {
                            e.preventDefault();
                            handleQuestionClick(question);
                          }}
                        >
                          {question.question}
                        </a>
                      </li>
                    ))}
                  </ul>
                </Fragment>
              )}
            </div>
            <div
              className="row"
              style={{
                display: currentContracts?.length === 0 ? "none" : "",
                height: "auto",
              }}
            >
              <div className="col-md-12 table-responsive">
                <table className="table w-100">
                  <thead className="table-dark">
                    <tr>
                      <th scope="col">ID</th>
                      <th scope="col">SiteName</th>
                      <th scope="col">{selectedQuestion?.key}</th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!isLoading && filteredData.length === 0 && (
                      <tr>
                        <td colSpan={4} align="center">
                          No Data Found
                        </td>
                      </tr>
                    )}
                    {isLoading && (
                      <tr>
                        <td colSpan={4} align="center">
                          <CircularProgress />
                        </td>
                      </tr>
                    )}
                    {currentContracts?.map((data) => (
                      <tr key={data?.siteId}>
                        <td>{data?.siteId}</td>
                        <td>{data?.siteName}</td>
                        <td>
                          {data?.[questions?.[0]?.main]?.[questions?.[0].key]
                            ? "Yes"
                            : "No"?.toString()}
                        </td>
                        <td>{data?.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="row" style={{ height: "auto" }}>
                <Pagination
                  totalPages={Math.ceil(filteredData.length / dataPerPage)}
                  currentPage={currentPage}
                  onPageChange={handlePageChange}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

const mapStateToProps = (state) => ({
  error: state.siteContracts.error,
  success: state.siteContracts.success,
  contractsList: state.siteContracts.contractsList,
  filterContract: state.siteContracts.filterContract,
  contractDetail: state.siteContracts.contractDetail,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
  loggedInUserData: state.site.loggedInUserData,
});

export default connect(mapStateToProps, {
  getSiteContracts,
  getSiteContractDetails,
  updateContractDetail,
  setLoader,
})(Contracts);
