import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import Header from "../../common/Header/Header";
import BreadCrumHeader from "../../common/BreadCrumHeader/BreadCrumHeader";
import SidebarNew from "../../common/Sidebar/SidebarNew";
import { useNavigate } from "react-router-dom";
import { deleteUser, getSites, getUsers } from "../../../store/thunk/site";
import { get, post, del } from "../../../api";
import CircularProgress from '@mui/material/CircularProgress';


const AdminCategories = ({ }) => {

  const navigate = useNavigate();
  
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    getCategories();
  },[])
  const getCategories = async () => {
    setIsLoading(true);
    const lovtypes = await get("/api/lov/SITE_CHECK_TYPE");
    const lovsubtypes = await get("/api/lov/SITE_CHECK_SUB_TYPE");
    const categories = await get("/api/lov/SITE_CHECK_CATEGORY");

    console.log(lovtypes, lovsubtypes, categories)
    const fetchData = [];
    lovtypes.forEach(t => {
      const subTypes = lovsubtypes.filter(l => l.attribite1 === t.lovValue);
      const subTypesList = []
      subTypes.forEach(s => {
        const cat = categories.filter(l => l.attribite1 === s.lovValue).map(l => l.lovValue);
        const cat2 = categories.filter(l => l.attribite1 === s.lovValue).map(l => { return { category: l.lovValue, id: l.id } });
        subTypesList.push({
          subType: s.lovValue,
          id: t.id,
          categories: cat2,
          //categories2: cat2
        });
       
      })
      fetchData.push({
        type: t.lovValue,
        id: t.id,
        subTypes: subTypesList
      })
    })
    console.log(fetchData)
    setData(fetchData);
    setIsLoading(false);
    const fetchData2 = [
      {
        type: "Inspection",
        subTypes: [
          {
            subType: "Electrical",
            categories: ["Test1", "Test2"]
          },
          {
            subType: "Water",
            categories: ["Test3", "Test4"]
          }
        ]
      },
      {
        type: "Survey",
        subTypes: [
          {
            subType: "Absestos",
            categories: ["Test1", "Test2"]
          },
          {
            subType: "Period",
            categories: ["6monthly", "yearly"]
          }
        ]
      }
    ]
    //const subTypeLov = await get("/api/lov/SITE_CHECK_SUB_TYPE?filter1=");
   
  }
  
  const  convertToTableFormatWithRowspan = () => {
    const table = [];

    data.forEach((item,idx) => {
      const type = item.type;
      item.subTypes.forEach((sub, subIndex) => {
        const subType = sub.subType;
        const rowspanSubtype = sub.categories.length; 
        const rowspanType = item.subTypes.length * rowspanSubtype; 
        sub.categories.forEach((category, categoryIndex) => {
          table.push({
            Type: categoryIndex === 0 && subIndex === 0 ? { content: type, rowspan: rowspanType } : null,
            Subtype: categoryIndex === 0 ? { content: subType, rowspan: rowspanSubtype } : null,
            Category: category.category, 
            index: idx,
            id: item.id
          });
        });
      });
    });

    return table;
  }

  
  const [formData, setFormData] = useState({
    searchField: "",
    role: "",
    site: "",
    status: "",
  });
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  // useEffect(() => {
  //   searchUser();
  // }, [formData.role, formData.searchField, formData.site, formData.status]);
  // const searchUser = () => {
  //   const searchField = formData?.searchField;
  //   const role = formData?.role;
  //   const site = formData?.site;
  //   const status = formData?.status;
  //   if (searchField || role || site || status) {
  //     const list = users?.filter(
  //       (x) =>
  //         String(x?.name)
  //           .toLowerCase()
  //           .includes(String(searchField).toLowerCase()) &&
  //         String(x?.role).toLowerCase().includes(String(role).toLowerCase()) &&
  //         String(x?.defaultSiteName)
  //           .toLowerCase()
  //           .includes(String(site).toLowerCase()) &&
  //         String(x?.status).toLowerCase().includes(String(status).toLowerCase())
  //     );
  //     setFilteredUser(list);
  //   } else {
  //     setFilteredUser(users);
  //   }
  // };
  // const deleteUserCall = (user) => {
  //   Swal.fire({
  //     title: `Do you want to delete ${user?.name}`,
  //     showDenyButton: false,
  //     showCancelButton: true,
  //     confirmButtonText: "Delete",
  //   }).then(async (result) => {
  //     if (result.isConfirmed) {
  //       const res = await deleteUser(user?.id);
  //       if (res === "Success") {
  //         toast.success(`${user?.name} user has been deleted successully`);
  //         getUsers();
  //       } else {
  //         toast.error(
  //           `Something went wrong while deleting user. Please try again.`
  //         );
  //       }
  //     } else if (result.isDenied) {
  //       toast.info(`delete action has been denied.`);
  //     }
  //   });
  // };

  return (
    <Fragment>
      <SidebarNew />
      <div className="content">
        <Header />
        <div className="container-fluid">
          
          <BreadCrumHeader header={"Categories Management"} page={"Manage"} />
         
         
          <div className="row p-2"></div>
          <div className="col-md-12 table-responsive">
            <table className="table" style={{ border: "1px solid" }}>
              <thead className="table-dark">
                <tr>
                  <th scope="col">Type</th>
                  <th scope="col">Sub type</th>
                  <th scope="col">Category</th>
                  <th scope="col"></th>
                </tr>
              </thead>
              <tbody>
                {isLoading &&
                  <tr>
                    <td colSpan={4} align="center"><CircularProgress /></td>
                  </tr>
                }
                  
                 
                {!isLoading && data?.length === 0 && (
                  <tr>
                    <td colSpan={4} align="center">No result found!!</td>
                  </tr>
                )}
               
                {convertToTableFormatWithRowspan().map((row, rowIndex) => (
                  <tr key={rowIndex} style={{ border: "2px groove",  fontWeight: '500', fontSize: '14px' }}>
                    {row.Type && (
                      <td rowSpan={row.Type.rowspan}  style={{ border: "2px groove", verticalAlign: 'middle' }}>
                        {row.Type.content}
                      </td>
                    )}
                    {row.Subtype && (
                      <td rowSpan={row.Subtype.rowspan} style={{ border: "2px groove", verticalAlign: 'middle' }}>
                        {row.Subtype.content}
                      </td>
                    )}
                    <td  style={{ border: "2px groove", verticalAlign: 'middle' }}>{row.Category}</td>
                    {row.Type && (
                      <td rowSpan={row.Type.rowspan} style={{ border: "2px groove", width: "20px", verticalAlign: 'middle' }}>
                        <button
                          className="btn btn-sm btn-light text-dark"
                          onClick={() => {
                            navigate(`/admin/categories/${row.id}/update`)
                          }}
                          style={{ align: "center" }}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                <tr>
                  <td colSpan={4} align="center">
                    <button
                      className="btn btn-sm btn-primary text-white w-100"
                      
                      onClick={() => {
                        navigate("/admin/categories/new");
                      }}
                      style={{ align: "center" }}
                    >
                      <i className="fas fa-plus"></i>  &nbsp; Add New 
                    </button>
                  </td>
                </tr>

                
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Fragment>
  );
};
const mapStateToProps = (state) => ({
  sites: state.site.sites,
  users: state.site.users,
});
export default connect(mapStateToProps, { getUsers, deleteUser, getSites })(
  AdminCategories
);
