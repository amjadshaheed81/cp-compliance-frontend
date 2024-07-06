import React, { Fragment, useState, useEffect } from "react";
import { connect } from "react-redux";
import { CSVLink } from "react-csv";
import Header from "../../../common/Header/Header";
import BreadCrumHeader from "../../../common/BreadCrumHeader/BreadCrumHeader";
import SidebarNew from "../../../common/Sidebar/SidebarNew";
import { Box, Modal, Typography, Chip } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import {
  getSiteContracts,
  getSiteContractDetails,
  updateContractDetail,
  setLoader,
} from "../../../../store/thunk/contracts";
import Success from "../../../common/Alert/Success";
import Status from "../../../common/Alert/Status/Status";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { get } from "../../../../api";
import AddContracts from "./AddContracts";

const Contracts = ({
  getSiteContracts,
  getSiteContractDetails,
  updateContractDetail,
  contractDetail,
  error,
  success,
  setLoader,
  loggedInUserData,
  siteSelectedForGlobal,
}) => {
  const [filteredContractList, setFilteredContractList] = useState([]);
  const [selectedContract, setSelectedContract] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [category, setCategory] = useState([]);
  const [subCategory, setSubCategory] = useState([]);
  const [subCategoryList, setSubCategoryList] = useState([]);
  useEffect(() => {
    getCategories();
    getProjectList();
  }, []);
  const getProjectList = async () => {
    const projects = await get(
      `/api/project/contracts?siteId=${siteSelectedForGlobal?.siteId}`
    );
    setFilteredContractList(projects?.projectContracts || []);
  };
  const getCategories = async () => {
    const category = await get("/api/lov/PROJECT_CONTRACT_CATEGORY");
    const subCategory = await get("/api/lov/PROJECT_CONTRACT_SUB_CATEGORY");
    console.log("category", category);
    setCategory(category);
    setSubCategory(subCategory);
  };
  /**
   *
   * @param {event} e
   * search project
   */
  const searchContract = (e) => {
    // const val = e.target.value;
    // if (val) {
    //   const list = contractsList?.filter((x) =>
    //     String(x?.project_summary)
    //       .toLowerCase()
    //       .includes(String(val).toLowerCase())
    //   );
    //   setFilteredContractList(list);
    // } else {
    //   setFilteredContractList(contractsList);
    // }
  };
  const categoryChange = (e) => {
    const val = e.target.value;
  };
  const style = {
    position: "absolute",
    overflow: "auto",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 700,
    height: 400,
    bgcolor: "background.paper",
    border: "2px solid #fff",
    boxShadow: 24,
    p: 4,
    margin: "20px",
  };
  return (
    <Fragment>
      <SidebarNew />
      <div className="content">
        <Header />
        <div className="container-fluid">
          <BreadCrumHeader header={"Site Contracts"} page={"Contracts"} />
          {/*  */}
          {/*  */}
          {showAddModal && (
            <AddContracts
              showAddModal={showAddModal}
              setShowAddModal={setShowAddModal}
              category={category}
              subCategory={subCategory}
              refresh={() => {}}
            />
          )}
          <div className="d-flex bd-highlight">
            <div className="pt-2 bd-highlight">
              <div className="row">
                <div className="col">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search"
                    name="project"
                    onChange={searchContract}
                  />
                </div>
                <div className="col">
                  <select
                    name="category"
                    className="form-control form-select"
                    id="startMonth"
                    onChange={categoryChange}
                  >
                    <option value="" selected disabled>
                      Category
                    </option>
                    {category?.map((itm) => (
                      <option value={itm?.lovValue}>{itm?.lovValue}</option>
                    ))}
                  </select>
                </div>
                <div className="col">
                  <select
                    name="subCategory"
                    className="form-control form-select"
                    id="subCategory"
                  >
                    <option value="" selected disabled>
                      Sub Category
                    </option>
                  </select>
                </div>
                <div className="col">
                  <select
                    name="status"
                    className="form-control form-select"
                    id="status"
                  >
                    <option value="" selected disabled>
                      Status
                    </option>
                    <option value="Active">Active</option>
                    <option value="Expired">Expired</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="ms-auto p-2 bd-highlight">
              <div className="row" style={{ height: "auto" }}>
                <div className="col">
                  <div className="col">
                    <Tooltip title={`Create New`} arrow>
                      <button
                        className="btn btn-primary text-white pr-2"
                        onClick={() => {
                          setShowAddModal(true);
                        }}
                      >
                        <i className="fas fa-plus"></i>
                      </button>
                    </Tooltip>
                  </div>
                </div>
                <div className="col">
                  <div className="col">
                    <CSVLink
                      filename={"contracts-lists"}
                      className="btn btn-light bg-white text-primary"
                      data={[]}
                    >
                      {" "}
                      <Tooltip title={`Export`} arrow>
                        <i className="fas fa-download"></i>
                      </Tooltip>
                    </CSVLink>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* row start*/}
          <div className="row p-2"></div>
          <div className="col-md-12 table-responsive">
            <table className="table">
              <thead className="table-dark">
                <tr>
                  <th scope="col">Summary</th>
                  <th scope="col">Category</th>
                  <th scope="col">SubCategory</th>
                  <th scope="col">Company</th>
                  <th scope="col">Start Date</th>
                  <th scope="col">End date</th>
                  <th scope="col">Cost</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredContractList?.length === 0 && (
                  <tr>
                    <td>No Contracts Found</td>
                  </tr>
                )}
                {filteredContractList?.map((itm) => (
                  <tr key={itm?.quote_id}>
                    <td>{itm?.project_summary}</td>
                    <td>{itm?.category}</td>
                    <td>{itm?.subCategory}</td>
                    <td>{itm?.company}</td>
                    <td>{itm?.startDate}</td>
                    <td>{itm?.endDate}</td>
                    <td>{itm?.cose}</td>

                    <td>
                      <Chip
                        label={itm?.status}
                        color={
                          itm.status === "received" ? "secondary" : "success"
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* row end*/}
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
  isLoading: state.siteContracts.isLoading,
  loggedInUserData: state.site.loggedInUserData,
});
export default connect(mapStateToProps, {
  getSiteContracts,
  getSiteContractDetails,
  updateContractDetail,
  setLoader,
})(Contracts);
