import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import Header from "../../common/Header/Header";
import BreadCrumHeader from "../../common/BreadCrumHeader/BreadCrumHeader";
import SidebarNew from "../../common/Sidebar/SidebarNew";
import { deleteUser, getSites, getUsers } from "../../../store/thunk/site";
import { TextField, Button, Grid, Paper, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { get, post, del, put } from "../../../api";
import { useNavigate, useParams } from "react-router-dom";


const AdminCategoriesAdd = ({ }) => {
  
  const navigate = useNavigate();
  const params = useParams();

  const typeId = params.id;
  const [type, setType] = useState();
  const [subtypes, setSubtypes] = useState([{ name: '', categories: [''], id: null }]);

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
    updatedSubtypes[subtypeIndex].categories[categoryIndex].category = value;
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
    event.preventDefault();
    const typeBody = {
      lovType: "SITE_CHECK_TYPE",
      lovValue: type,
      id: typeId
    }
    console.log("typeBody", typeBody)
    await put("/api/lov/id/" + typeBody.id, typeBody);
    for (let subtype of subtypes) {
      const subtypeBody = {
        lovType: "SITE_CHECK_SUB_TYPE",
        lovValue: subtype.name,
        attribite1: type,
        id: subtype.id
      }
      console.log("subtypeBody", subtypeBody)
      await put("/api/lov/id/" + subtypeBody.id, subtypeBody);
      for (let category of subtype.categories) { 
        const categoryBody = {
          lovType: "SITE_CHECK_CATEGORY",
          lovValue: category.category,
          attribite1: subtype.name,
          id: category.id
        }
        console.log("categoryBody", categoryBody)
        console.log("categoryBody", "/api/lov/id/" + categoryBody.id, subtypes)
        await put("/api/lov/id/" + categoryBody.id, categoryBody);
      }
    }
    navigate("/admin/categories")
  };

  useEffect(() => {
    if (typeId) {
      getCategories(typeId);
    }
    
  }, [typeId])
  const getCategories = async () => {
    const lovtypes = await get("/api/lov/id/" + typeId);
    const lovsubtypes = await get("/api/lov/SITE_CHECK_SUB_TYPE?filter1=" + lovtypes.lovValue);
    const categories = await get("/api/lov/SITE_CHECK_CATEGORY");
    setType(lovtypes.lovValue)
    const subTypesList = []
    for (let s of lovsubtypes) {
      
     
        const cat2 = categories.filter(l => l.attribite1 === s.lovValue).map(l => { return { category: l.lovValue, id: l.id } });

        subTypesList.push({
          name: s.lovValue, categories: cat2, id: s.id
        });

      }
    setSubtypes(subTypesList)
  }

  return (
    <Fragment>
      <SidebarNew />
      <div className="content">
        <Header />
        <div className="container-fluid">

          <BreadCrumHeader header={"Categories Management - Edit"} page={"Manage"} />


          <Grid container spacing={3} style={{ color: "white", }}>
            <Grid item xs={6}>
        
              <TextField
                fullWidth
                label="Type"
                variant="outlined"
                InputLabelProps={{ shrink: true }}
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
            {subtypes.map((subtype, subtypeIndex) => (
              <Grid item xs={6} key={subtypeIndex}>
                <Paper elevation={24} style={{ padding: '30px', backgroundColor: '#f8f8fa' }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={6}>
                      <TextField
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        label={`Subtype ${subtypeIndex + 1}`}
                        variant="outlined"
                        value={subtype.name}
                        onChange={(e) => handleSubtypeNameChange(subtypeIndex, e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      {/* <IconButton style={{ color: 'red' }} onClick={() => handleDeleteSubtype(subtypeIndex)}>
                        <DeleteIcon />
                      </IconButton> */}
                      <Button
                        variant="outlined"
                        onClick={() => handleAddCategory(subtypeIndex)}
                        startIcon={<AddIcon />}
                      >
                        Add Category
                      </Button>
                    </Grid>
                    {subtype.categories.map((category, categoryIndex) => (
                      <Grid item xs={6} key={categoryIndex}>
                        <Paper elevation={24} style={{ padding: '40px', backgroundColor: "#e5e6eb", display: 'flex' }}>
                          <TextField
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            label={`Subtype ${subtypeIndex + 1} - Category ${categoryIndex + 1}`}
                            variant="outlined"
                            value={category.category}
                            onChange={(e) =>
                              handleCategoryChange(subtypeIndex, categoryIndex, e.target.value)
                            }
                          />
                          {/* <IconButton style={{ color: 'red' }}  onClick={() => handleDeleteCategory(subtypeIndex, categoryIndex)}>
                            <DeleteIcon />
                          </IconButton> */}
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
});
export default connect(mapStateToProps, { getUsers, deleteUser, getSites })(
  AdminCategoriesAdd
);
