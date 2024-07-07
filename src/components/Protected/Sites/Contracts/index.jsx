import React, { Fragment, useState, useEffect } from "react";
import { connect } from "react-redux";
import { CSVLink } from "react-csv";
import Header from "../../../common/Header/Header";
import BreadCrumHeader from "../../../common/BreadCrumHeader/BreadCrumHeader";
import SidebarNew from "../../../common/Sidebar/SidebarNew";
import { Box, Modal, Typography, Chip, Switch } from "@mui/material";
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
import moment from "moment";
import { ROLE } from "../../../../Constant/Role";
import ChipComponent from "../../../common/Chips/Chips";
import ManagerContractView from "./ManagerContractView";
import ContractorContractView from "./ContractorContractView";

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
  const [editContractViewType, setEditContractViewType] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [category, setCategory] = useState([]);
  const [subCategory, setSubCategory] = useState([]);
  const [subCategoryList, setSubCategoryList] = useState([]);
  const [checked, setChecked] = useState(false);

  const handleChange = (event) => {
    setChecked(event.target.checked);
    if(event.target.checked) {
      getProjectList(true);
    }
  };
  useEffect(() => {
    getCategories();
    getProjectList();
  }, []);
  const getProjectList = async (isSiteSelectedForContractor = false) => {
    if (
      loggedInUserData?.role === ROLE.ADMIN ||
      loggedInUserData?.role === ROLE.MANAGER
    ) {
      const projects = await get(
        `/api/project/contracts?siteId=${siteSelectedForGlobal?.siteId}`
      );
      setFilteredContractList(projects?.projectContracts || []);
    } else if (loggedInUserData?.role === ROLE.CONTRACTOR) {
      let url = isSiteSelectedForContractor
        ? `/api/project/contracts?siteId=${siteSelectedForGlobal?.siteId}`
        : `/api/project/contracts?contractorId=${loggedInUserData?.id}`;
      const projects = await get(url);
      setFilteredContractList(projects?.projectContracts || []);
    }
  };
  const getCategories = async () => {
    const category = await get("/api/lov/PROJECT_CONTRACT_CATEGORY");
    const subCategory = await get("/api/lov/PROJECT_CONTRACT_SUB_CATEGORY");
    setCategory(category);
    setSubCategory(subCategory);
  };
  /**
   *
   * @param {event} e
   * search project
   */
  const searchContract = (e) => {};
  const categoryChange = (e) => {
    const val = e.target.value;
    const subCategoryData = subCategory?.filter(
      (itm) => itm?.attribite1 === val
    );
    setSubCategoryList(subCategoryData);
  };
  const openContractDetail = (contract) => {
    setSelectedContract(contract);
    if (
      loggedInUserData?.role === ROLE.ADMIN ||
      loggedInUserData?.role === ROLE.MANAGER
    ) {
      setShowUpdateModal(true);
      setEditContractViewType(ROLE.MANAGER);
    } else if (loggedInUserData?.role === ROLE.CONTRACTOR) {
      setShowUpdateModal(true);
      setEditContractViewType(ROLE.CONTRACTOR);
    } else {
      toast.warn("You don't have required access to update the contract");
      setEditContractViewType("");
    }
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
              refresh={() => {
                getProjectList();
              }}
            />
          )}
          {editContractViewType === ROLE.MANAGER && (
            <ManagerContractView
              selectedContract={selectedContract}
              showAddModal={showUpdateModal}
              setShowAddModal={setShowUpdateModal}
              category={category}
              subCategory={subCategory}
              refresh={() => {}}
            />
          )}
          {editContractViewType === ROLE.CONTRACTOR && (
            <ContractorContractView
              selectedContract={selectedContract}
              showAddModal={showUpdateModal}
              setShowAddModal={setShowUpdateModal}
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
                {subCategoryList?.length > 0 && (
                  <div className="col">
                    <select
                      name="subCategory"
                      className="form-control form-select"
                      id="subCategory"
                    >
                      <option value="" selected disabled>
                        Sub Category
                      </option>
                      {subCategoryList?.map((itm) => (
                        <option value={itm?.lovValue}>{itm?.lovValue}</option>
                      ))}
                    </select>
                  </div>
                )}
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
                {loggedInUserData?.role === ROLE.CONTRACTOR && (
                  <div className="col p-0 m-0">
                    <label>All</label>
                    <Switch
                      checked={checked}
                      onChange={handleChange}
                      inputProps={{ "aria-label": "controlled" }}
                    />
                    <label>Selected Site</label>
                  </div>
                )}
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
                  {loggedInUserData?.role === ROLE.ADMIN ||
                    (loggedInUserData?.role === ROLE.MANAGER && (
                      <th scope="col">Company</th>
                    ))}
                  {loggedInUserData?.role === ROLE.CONTRACTOR && (
                    <th scope="col">Site</th>
                  )}
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
                  <tr key={itm?.projectContractId}>
                    <td>
                      <span
                        onClick={() => openContractDetail(itm)}
                        className="text-primary cursor"
                      >
                        {itm?.summary}
                      </span>
                    </td>
                    <td>{itm?.category}</td>
                    <td>{itm?.subCategory}</td>
                    {loggedInUserData?.role === ROLE.ADMIN ||
                      (loggedInUserData?.role === ROLE.MANAGER && (
                        <td>{itm?.contractorCompanyName}</td>
                      ))}
                    {loggedInUserData?.role === ROLE.CONTRACTOR && (
                      <td>{itm?.siteName}</td>
                    )}
                    <td>
                      {itm?.startDate
                        ? moment(itm?.startDate).format("DD-MM-YYYY")
                        : "-"}
                    </td>
                    <td>
                      {itm?.endDate
                        ? moment(itm?.endDate).format("DD-MM-YYYY")
                        : "-"}
                    </td>
                    <td>{itm?.cost}</td>

                    <td>
                      <ChipComponent status={itm?.status} />
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
