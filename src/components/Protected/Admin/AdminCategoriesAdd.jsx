import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import Header from "../../common/Header/Header";
import BreadCrumHeader from "../../common/BreadCrumHeader/BreadCrumHeader";
import SidebarNew from "../../common/Sidebar/SidebarNew";
import { deleteUser, getSites, getUsers } from "../../../store/thunk/site";
import { TextField, Button, Grid, Paper, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { get, post, del } from "../../../api";
import { useNavigate } from "react-router-dom";


const AdminCategoriesAdd = ({loggedInUserData }) => {
  
  const navigate = useNavigate();
  const [type, setType] = useState('');
  const [subtypes, setSubtypes] = useState([{ name: '', categories: [''] }]);

  const handleAddSubtype = () => {
    setSubtypes([...subtypes, { name: '', categories: [''] }]);
  };

  const handleSubtypeNameChange = (index, value) => {
    const updatedSubtypes = [...subtypes];
    updatedSubtypes[index].name = value;
    setSubtypes(updatedSubtypes);
  };

  const handleCategoryChange = (subtypeIndex, categoryIndex, value) => {
    const updatedSubtypes = [...subtypes];
    updatedSubtypes[subtypeIndex].categories[categoryIndex] = value;
    setSubtypes(updatedSubtypes);
  };

  const handleAddCategory = (subtypeIndex) => {
    const updatedSubtypes = [...subtypes];
    updatedSubtypes[subtypeIndex].categories.push('');
    setSubtypes(updatedSubtypes);
  };

  const handleDeleteSubtype = (subtypeIndex) => {
    const updatedSubtypes = [...subtypes];
    updatedSubtypes.splice(subtypeIndex, 1);
    setSubtypes(updatedSubtypes);
  };

  const handleDeleteCategory = (subtypeIndex, categoryIndex) => {
    const updatedSubtypes = [...subtypes];
    updatedSubtypes[subtypeIndex].categories.splice(categoryIndex, 1);
    setSubtypes(updatedSubtypes);
  };

  const handleSubmit = async (event) => {
    let licenseId = undefined;
    const isadmin = loggedInUserData?.superAdmin ;
    if(!isadmin) {
      const license = JSON.parse(localStorage.getItem('license'));
      licenseId = license?.licenseId
    }
    
    event.preventDefault();
    const typeBody = {
      lovType: "SITE_CHECK_TYPE",
      lovValue: type,
      licenseId
    }
    await post("/api/lov/", typeBody);
    for (let subtype of subtypes) {
      const subtypeBody = {
        lovType: "SITE_CHECK_SUB_TYPE",
        lovValue: subtype.name,
        attribite1: type,
        licenseId
      }
      await post("/api/lov/", subtypeBody);
      for (let category of subtype.categories) { 
        const categoryBody = {
          lovType: "SITE_CHECK_CATEGORY",
          lovValue: category,
          attribite1: subtype.name,
          licenseId
        }
        await post("/api/lov/", categoryBody);
      }
    }
    navigate("/admin/categories")
  };

  return (
    <Fragment>
      <SidebarNew />
      <div className="content">
        <Header />
        <div className="container-fluid">

          <BreadCrumHeader header={"Categories Management - Add"} page={"Manage"} />


          <Grid container spacing={3} style={{ color: "white", }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Type"
                variant="outlined"
                value={type}
                onChange={(e) => setType(e.target.value)}
              />
            </Grid>
            {/* <Grid item xs={6}></Grid> */}
            <Grid item xs={6} container >
              <Button variant="outlined" onClick={handleAddSubtype} startIcon={<AddIcon />}>
                Add Subtype
              </Button>
            </Grid>
            {subtypes?.map((subtype, subtypeIndex) => (
              <Grid item xs={6} key={subtypeIndex}>
                <Paper elevation={24} style={{ padding: '30px', backgroundColor: '#f8f8fa' }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label={`Subtype ${subtypeIndex + 1}`}
                        variant="outlined"
                        value={subtype.name}
                        onChange={(e) => handleSubtypeNameChange(subtypeIndex, e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <IconButton style={{ color: 'red' }} onClick={() => handleDeleteSubtype(subtypeIndex)}>
                        <DeleteIcon />
                      </IconButton>
                      <Button
                        variant="outlined"
                        onClick={() => handleAddCategory(subtypeIndex)}
                        startIcon={<AddIcon />}
                      >
                        Add Category
                      </Button>
                    </Grid>
                    {subtype.categories?.map((category, categoryIndex) => (
                      <Grid item xs={6} key={categoryIndex}>
                        <Paper elevation={24} style={{ padding: '40px', backgroundColor: "#e5e6eb", display: 'flex' }}>
                          <TextField
                            fullWidth
                            label={`Subtype ${subtypeIndex + 1} - Category ${categoryIndex + 1}`}
                            variant="outlined"
                            value={category}
                            onChange={(e) =>
                              handleCategoryChange(subtypeIndex, categoryIndex, e.target.value)
                            }
                          />
                          <IconButton style={{ color: 'red' }}  onClick={() => handleDeleteCategory(subtypeIndex, categoryIndex)}>
                            <DeleteIcon />
                          </IconButton>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              </Grid>
            ))}
            
            
          </Grid>
          <br />
          <Grid container spacing={2}>
            <Grid item xs={12} container justifyContent="right">
              <Button variant="contained" color="primary" fullWidth onClick={handleSubmit}>
                Save
              </Button>
            </Grid>
            <Grid item xs={12} container justifyContent="center"></Grid>
          </Grid>
          
         
         
         
        </div>
      </div>
    </Fragment>
  );
};
const mapStateToProps = (state) => ({
  sites: state.site.sites,
  users: state.site.users,
  loggedInUserData: state.site.loggedInUserData,
});
export default connect(mapStateToProps, { getUsers, deleteUser, getSites })(
  AdminCategoriesAdd
);
