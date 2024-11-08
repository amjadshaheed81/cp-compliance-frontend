import React, { Fragment, useState, useEffect } from "react";
import { connect } from "react-redux";
import { CSVLink } from "react-csv";
import { Switch, CircularProgress } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import {
  getSiteContracts,
  getSiteContractDetails,
  updateContractDetail,
  setLoader,
} from "../../../../store/thunk/contracts";
import { get } from "../../../../api";
import moment from "moment";
import { ROLE } from "../../../../Constant/Role";
import ChipComponent from "../../../common/Chips/Chips";
import Swal from "sweetalert2";
import Pagination from "../../../common/Pagination/Pagination";
import { isManagerAdminLogin } from "../../../../utils/isManagerAdminLogin";
import { calculateLastPageIndex } from "../../../../utils/calculateSearchedPageNumber";
import BarChart from "./Barchart";
import { SiteArea } from "../../../../Constant/SiteArea";

const Contracts = ({ loggedInUserData, siteSelectedForGlobal }) => {
  const [state, setState] = useState({
    selectedArea: "",
    allSites: true,
  });
  const [filteredContractList, setFilteredContractList] = useState([]);
  const [contractList, setContractList] = useState([]);
  const [formData, setFormData] = useState({
    searchField: "",
    category: "",
    subCategory: "",
    status: "",
  });
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
  const handleAreaChange = (e) => {
    setState((prevState) => ({
      ...prevState,
      selectedArea: e.target.value,
    }));
    getContractsByArea(e.target.value);
  };
  const getContractsByArea = async (area) => {
    const projects = await get(`/api/project/contracts?area=${area}`);
    setFilteredContractList(projects?.projectContracts || []);
    setContractList(projects?.projectContracts || []);
  };
  const handleChange = (event) => {
    setState((prevState) => ({
      ...prevState,
      allSites: event.target.checked,
    }));
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
    getProjectList(state.allSites);
  }, [siteSelectedForGlobal]);
  const getProjectList = async (isSiteSelectedForContractor = false) => {
    setIsLoading(true);
    if (isManagerAdminLogin(loggedInUserData)) {
      if (!isSiteSelectedForContractor) {
        const projects = await get(`/api/project/contracts`);
        setFilteredContractList(projects?.projectContracts || []);
        setContractList(projects?.projectContracts || []);
      } else {
        const projects = await get(
          `/api/project/contracts?siteId=${siteSelectedForGlobal?.siteId}`
        );
        setFilteredContractList(projects?.projectContracts || []);
        setContractList(projects?.projectContracts || []);
      }
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
      setCurrentPage(1); //calculateLastPageIndex(list?.length, contractsPerPage)
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
  return (
    <Fragment>
      <div className="">
        <div className="">
          <div className="d-flex bd-highlight">
            <div className="pt-2 bd-highlight">
              <div className="row">
                {/* <div className="col-md-4 col-sm-4 mt-2">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search"
                    name="searchField"
                    onChange={handleInputChange}
                  />
                </div> */}
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
                {/* <div className="col-md-4 col-sm-4 mt-2">
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
                </div> */}
                <div className="col-md-4 col-sm-4 mt-2">
            <select
              name="area"
              className="form-control form-select"
              id="area"
              value={state.selectedArea}
              onChange={handleAreaChange}
            >
              <option value="">Area</option>
              {SiteArea?.map((itm)=> <option value={itm}>{itm}</option>)}
            </select>
          </div>
                {/* {loggedInUserData?.role === ROLE.CONTRACTOR && ( */}
                <div className="col-md-4 col-sm-4 mt-2 p-0 m-0">
                <label>All</label>
                  <Switch
                    checked={state.allSites}
                    onChange={handleChange}
                    inputProps={{ "aria-label": "controlled" }}
                  />
                  <label>Individual Site</label>
                  
                  
                </div>
                {/* )} */}
              </div>
            </div>
          </div>
          {/* row start*/}
          <div className="row p-2">
            <BarChart data={filteredContractList} />
          </div>
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
                  <th scope="col">Cost</th>
                  <th scope="col">Status</th>
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
                      <span>{itm?.summary}</span>
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
                    <td>{itm?.budget}</td>
                    <td>
                      <ChipComponent status={itm?.status} />
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
