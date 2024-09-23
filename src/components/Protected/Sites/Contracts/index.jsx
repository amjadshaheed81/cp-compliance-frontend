import React, { Fragment, useState, useEffect } from "react";
import { connect } from "react-redux";
import { CSVLink } from "react-csv";
import Header from "../../../common/Header/Header";
import BreadCrumHeader from "../../../common/BreadCrumHeader/BreadCrumHeader";
import SidebarNew from "../../../common/Sidebar/SidebarNew";
import { Switch, CircularProgress } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import {
  getSiteContracts,
  getSiteContractDetails,
  updateContractDetail,
  setLoader,
} from "../../../../store/thunk/contracts";
import { toast } from "react-toastify";
import { get } from "../../../../api";
import AddContracts from "./AddContracts";
import moment from "moment";
import { ROLE } from "../../../../Constant/Role";
import ChipComponent from "../../../common/Chips/Chips";
import ManagerContractView from "./ManagerContractView";
import ContractorContractView from "./ContractorContractView";
import Swal from "sweetalert2";
import Pagination from "../../../common/Pagination/Pagination";
import { isManagerAdminLogin } from "../../../../utils/isManagerAdminLogin";
import { calculateLastPageIndex } from "../../../../utils/calculateSearchedPageNumber";

const Contracts = ({
  loggedInUserData,
  siteSelectedForGlobal,
}) => {
  const [filteredContractList, setFilteredContractList] = useState([]);
  const [contractList, setContractList] = useState([]);
  const [formData, setFormData] = useState({
    searchField: "",
    category: "",
    subCategory: "",
    status: "",
  });
  const [selectedContract, setSelectedContract] = useState({});
  const [editContractViewType, setEditContractViewType] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [category, setCategory] = useState([]);
  const [subCategory, setSubCategory] = useState([]);
  const [subCategoryList, setSubCategoryList] = useState([]);
  const [checked, setChecked] = useState(false);
  const [contractsPerPage] = useState(7);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const indexOfLastContract = currentPage * contractsPerPage;
  const indexOfFirstContract = indexOfLastContract - contractsPerPage;
  const currentContracts = filteredContractList.slice(
    indexOfFirstContract,
    indexOfLastContract
  );
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };
  const handleInputChange = (e) => {
    console.log("e", e)
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (name === "category") {
      categoryChange(value);
    }
  };
  useEffect(() => {
    searchContracts();
  }, [
    formData.searchField,
    formData.category,
    formData.subCategory,
    formData.status,
  ]);
  const handleChange = (event) => {
    setChecked(event.target.checked);
    if (event.target.checked) {
      getProjectList(true);
    } else {
      getProjectList(false);
    }
  };
  useEffect(() => {
    if (!siteSelectedForGlobal?.siteId) {
      Swal.fire({
        icon: "error",
        title: "Site is not selected",
        text: "Please select site from site search and try again.",
      });
      return;
    }
    getCategories();
    getProjectList();
  }, [siteSelectedForGlobal]);
  const getProjectList = async (isSiteSelectedForContractor = false) => {
    setIsLoading(true);
    if (isManagerAdminLogin(loggedInUserData)) {
      const projects = await get(
        `/api/project/contracts?siteId=${siteSelectedForGlobal?.siteId}`
      );
      setFilteredContractList(projects?.projectContracts || []);
      setContractList(projects?.projectContracts || []);
    } else if (loggedInUserData?.role === ROLE.CONTRACTOR) {
      try {
        let url = isSiteSelectedForContractor
          ? `/api/project/contracts?siteId=${siteSelectedForGlobal?.siteId}&contractorCompanyId=${loggedInUserData?.companyId}`
          : `/api/project/contracts?contractorCompanyId=${loggedInUserData?.companyId}`;
        const projects = await get(url);
        setFilteredContractList(projects?.projectContracts || []);
        setContractList(projects?.projectContracts || []);
      } catch (e) {
        setFilteredContractList([]);
        setContractList([]);
      }
    }
    setIsLoading(false);
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
  const searchContracts = () => {
    const searchField = formData?.searchField;
    const category = formData?.category;
    const subCategory = formData?.subCategory;
    const status = formData?.status;
    if (searchField || category || subCategory || status) {
      const list = contractList?.filter(
        (x) =>
          String(x?.summary)
            .toLowerCase()
            .includes(String(searchField).toLowerCase()) &&
          String(x?.category)
            .toLowerCase()
            .includes(String(category).toLowerCase()) &&
          String(x?.subCategory)
            .toLowerCase()
            .includes(String(subCategory).toLowerCase()) &&
          String(x?.status).toLowerCase().includes(String(status).toLowerCase())
      );
      setCurrentPage(calculateLastPageIndex(list?.length, contractsPerPage));
      setFilteredContractList(list);
    } else {
      setFilteredContractList(contractList);
    }
  };
  const categoryChange = (value) => {
    const val = value;
    const subCategoryData = subCategory?.filter(
      (itm) => itm?.attribite1 === val
    );
    setSubCategoryList(subCategoryData);
  };
  const openContractDetail = (contract) => {
    setSelectedContract(contract);
    if (isManagerAdminLogin(loggedInUserData)) {
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
              refresh={() => {
                getProjectList();
              }}
            />
          )}
          {editContractViewType === ROLE.CONTRACTOR && (
            <ContractorContractView
              selectedContract={selectedContract}
              showAddModal={showUpdateModal}
              setShowAddModal={setShowUpdateModal}
              category={category}
              subCategory={subCategory}
              refresh={() => {
                getProjectList();
              }}
            />
          )}
          <div className="d-flex bd-highlight">
            <div className="pt-2 bd-highlight">
              <div className="row">
                <div className="col-md-4 col-sm-4 mt-2">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search"
                    name="searchField"
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-4 col-sm-4 mt-2">
                  <select
                    className="form-control form-select"
                    id="startMonth"
                    name="category"
                    onChange={handleInputChange}
                  >
                    <option value="">Category</option>
                    {category?.map((itm) => (
                      <option value={itm?.lovValue}>{itm?.lovValue}</option>
                    ))}
                  </select>
                </div>
                {subCategoryList?.length > 0 && (
                  <div className="col-md-4 col-sm-4 mt-2">
                    <select
                      name="subCategory"
                      className="form-control form-select"
                      id="subCategory"
                      onChange={handleInputChange}
                    >
                      <option value="">Sub Category</option>
                      {subCategoryList?.map((itm) => (
                        <option value={itm?.lovValue}>{itm?.lovValue}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="col-md-4 col-sm-4 mt-2">
                  <select
                    name="status"
                    className="form-control form-select"
                    id="status"
                    onChange={handleInputChange}
                  >
                    <option value="">Status</option>
                    <option value="Active">Active</option>
                    <option value="Expired">Expired</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                </div>
                {loggedInUserData?.role === ROLE.CONTRACTOR && (
                  <div className="col-md-4 col-sm-4 mt-2 p-0 m-0">
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
                {isManagerAdminLogin(loggedInUserData) && (
                  <>
                    <div className="col-md-6 col-sm-4 mt-2 pr-2">
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
                    <div className="col-md-6 col-sm-4 mt-2">
                        <CSVLink
                          filename={"contracts-lists.csv"}
                          className="btn btn-light bg-white text-primary"
                          data={filteredContractList}
                        >
                          {" "}
                          <Tooltip title={`Export`} arrow>
                            <i className="fas fa-download"></i>
                          </Tooltip>
                        </CSVLink>
                    </div>
                  </>
                )}
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
                  {isManagerAdminLogin(loggedInUserData) && (
                    <th scope="col">Company</th>
                  )}
                  {loggedInUserData?.role === ROLE.CONTRACTOR && (
                    <th scope="col">Site</th>
                  )}
                  <th scope="col">Start Date</th>
                  <th scope="col">End date</th>
                  <th scope="col">Status</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {!isLoading && currentContracts?.length === 0 && (
                  <tr>
                    <td>No Contracts Found</td>
                  </tr>
                )}
                {isLoading && (
                  <tr>
                    <td colSpan={8} align="center">
                      <CircularProgress />
                    </td>
                  </tr>
                )}
                {currentContracts?.map((itm) => (
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
                    {isManagerAdminLogin(loggedInUserData) && (
                      <td>{itm?.contractorCompanyName}</td>
                    )}
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
                    <td>
                      <ChipComponent status={itm?.status} />
                    </td>
                    <td>
                      <Tooltip title={`View ${itm?.summary}`} arrow>
                        <button
                          className="btn btn-sm btn-light"
                          onClick={() => {
                            openContractDetail(itm);
                          }}
                        >
                          <i className="fas fa-eye"></i>
                        </button>{" "}
                      </Tooltip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* row end*/}
          <div className="row">
            <Pagination
              totalPages={Math.ceil(
                filteredContractList.length / contractsPerPage
              )}
              currentPage={currentPage}
              onPageChange={handlePageChange}
            />
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
