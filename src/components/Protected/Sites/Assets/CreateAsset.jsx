import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import Box from "@mui/material/Box";
import Header from "../../../common/Header/Header";
import BreadCrumHeader from "../../../common/BreadCrumHeader/BreadCrumHeader";
import SidebarNew from "../../../common/Sidebar/SidebarNew";
import {
  addSiteAsset,
  getDocumentsRootFolder,
  getSiteAssets,
  setLoader,
  getSiteLayout
} from "../../../../store/thunk/site";
import { Validation } from "../../../../Constant/Validation";
import { InputError } from "../../../common/InputError";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { TextField, Autocomplete } from "@mui/material";
import { get } from "../../../../api";

const CreateAsset = ({
  setLoader,
  siteSelectedForGlobal,
  getDocumentsRootFolder,
  rootFolder,
  addSiteAsset,
  getSiteAssets,
  siteAssets,
  getSiteLayout,
  siteLayout,
}) => {
  const [patRecord, setPatRecord] = useState([]);
  const [category, setCategory] = useState([]);
  const [subCategory, setSubCategory] = useState([]);
  const [subCategoryList, setSubCategoryList] = useState([]);
  const [subCategory2, setSubCategory2] = useState([]);
  const [subCategory2List, setSubCategory2List] = useState([]);
  const [subCategory3, setSubCategory3] = useState([]);
  const [subCategory3List, setSubCategory3List] = useState([]);

  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    if (siteSelectedForGlobal?.siteId) {
      getDocumentsRootFolder(siteSelectedForGlobal?.siteId);
      getSiteAssets(siteSelectedForGlobal?.siteId);
      getSiteLayout(siteSelectedForGlobal?.siteId);
      getCategories();
    } else {
      toast.error("Please select site from site search to proceed....");
    }
  }, []);
  const getCategories = async () => {
    const category = await get("/api/lov/ASSET_CATEGORY");
    const subCategory = await get("/api/lov/ASSET_SUB_CATEGORY");
    const subCategory2 = await get("/api/lov/ASSET_SUB_CATEGORY_2");
    const subCategory3 = await get("/api/lov/ASSET_SUB_CATEGORY_3");
    setCategory(category);
    setSubCategory(subCategory);
    setSubCategory2(subCategory2);
    setSubCategory3(subCategory3);
  };

  const changePatItem = (e) => {
    const value = e.target.checked;
    setValue("patItem", value);
    const ispfpItem = getValues("pfpItem");
    const isdoorItem = getValues("doorItem");
    if (ispfpItem || isdoorItem) {
      setValue("pfpItem", false);
      setValue("doorItem", false);
    }
  };
  const changePfpItem = (e) => {
    const value = e.target.checked;
    setValue("pfpItem", value);
    const ispatItem = getValues("patItem");
    const isdoorItem = getValues("doorItem");
    if (ispatItem || isdoorItem) {
      setValue("patItem", false);
      setValue("doorItem", false);
    }
  };
  const changeDoorItem = (e) => {
    const value = e.target.checked;
    setValue("doorItem", value);
    const ispatItem = getValues("patItem");
    const ispfpItem = getValues("pfpItem");
    if (ispatItem || ispfpItem) {
      setValue("patItem", false);
      setValue("pfpItem", false);
    }
  };


  const addPatRecord = () => {
    setPatRecord([
      ...patRecord,
      {
        tester: "",
        testDate: "",
        nextTestDate: "",
      },
    ]);
  };
  const defaultValues = {
    assetId: null,
    assetName: "",
    manufacturer: "",
    category: "",
    subCategory: "",
    subCategory2: "",
    subCategory3: "",
    model: "",
    serialNumber: "",
    powerOutput: "",
    damperSize: "",
    relatedAssetId: null,
    folderId: null,
    patItem: false,
    pfpItem: false,
    doorItem: false,
    barcode: "",
  };
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    getValues,
    setValue,
    watch,
  } = useForm({
    defaultValues,
  });
  const navigate = useNavigate();
  const goTo = (link) => {
    navigate(link);
  };
  const submitSiteAsset = async (data) => {
    setLoader(true);
    let form_data = new FormData();
    if (data?.assetImage?.length > 0) {
      data?.assetImage?.forEach(assetImage=>{
        form_data.append(
          "assetImage",
          assetImage,
        );
      })
    } else {
      // form_data.append("assetImage", "", "");
    }
    try {
      const { assetImage, ...formData } = data;
      form_data.append("assetRequestString", JSON.stringify(formData));
      await addSiteAsset(form_data, goTo, siteSelectedForGlobal?.siteId);
      setLoader(false);
    } catch (e) {
      setLoader(false);
      toast.error(
        "Something went wrong while adding asset. Please try again!!"
      );
    }
  };
  return (
    <Fragment>
      <SidebarNew />
      <div className="content">
        <Header />
        <div className="container-fluid">
          <BreadCrumHeader header={"Create New Asset"} page={"Asset Details"} />

          <Box sx={{ width: "100%", typography: "body1" }}>
            <form onSubmit={handleSubmit(submitSiteAsset)}>
              <div className="row p-2 border">
                <div className="col-md-12">
                  <div className="float-end">
                    <button
                      type="button"
                      className="btn btn-light mb-3 mr-4"
                      onClick={() => window.history.back()}
                    >
                      Close
                    </button>
                    &nbsp; &nbsp;
                    <button type="submit" className="btn btn-primary mb-3 mr-4">
                      Save
                    </button>
                  </div>
                </div>
                <div className="col-md-12 p-2">
                  <div className="row" style={{ height: "auto" }}>
                    <div className="col-md-8">
                      <div className="row">
                        <div className="col-md-6 mt-2">
                          <div className="form-group mt-2">
                            <label for="assetName">Asset Name</label>
                            <input
                              type="text"
                              autoComplete="off"
                              readOnly
                              onFocus={(e) =>
                                e.target.removeAttribute("readonly")
                              }
                              className="form-control"
                              id="assetName"
                              name="assetName"
                              placeholder=""
                              {...register("assetName", {
                                required: {
                                  value: true,
                                  message: `${Validation.REQUIRED} asset name`,
                                },
                              })}
                            />
                            {errors?.assetName && (
                              <InputError
                                message={errors?.assetName?.message}
                                key={errors?.assetName?.message}
                              />
                            )}
                          </div>
                        </div>
                        <div className="col-md-6 mt-2">
                          <div className="form-group mt-2">
                            <label for="manufacturer">Manufacturer</label>
                            <input
                              type="text"
                              autoComplete="off"
                              readOnly
                              onFocus={(e) =>
                                e.target.removeAttribute("readonly")
                              }
                              className="form-control"
                              id="manufacturer"
                              name="manufacturer"
                              placeholder=""
                              {...register("manufacturer")}
                            />
                          </div>
                        </div>

                        <div className="col-md-6 mt-2">
                          <div className="form-group mt-2">
                            <label for="relatedAssetId">Related Asset</label>
                            <Autocomplete
                              multiple
                              onChange={(event, newValue) => {
                                const keys = newValue
                                  ?.map((itm) => itm?.key)
                                  ?.join(",");
                                setValue("relatedAssetId", keys);
                              }}
                              options={siteAssets?.map((option) => {
                                return {
                                  key: option.assetId,
                                  label:
                                    option.assetId +
                                    " - " +
                                    option.assetName +
                                    " (" +
                                    `${option?.position || "NA"} > ${
                                      option?.floor || "NA"
                                    } > ${option?.room || "NA"}` +
                                    ")",
                                };
                              })}
                              getOptionLabel={(option) => option.label}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  label="Tag Asset"
                                  placeholder="Tag Asset"
                                />
                              )}
                            />
                          </div>
                        </div>

                        {/* <div className="col-md-6 mt-2">
                          <label for="folder">Folder</label>
                          <select
                            name="folderId"
                            className="form-control form-select"
                            id="folderId"
                            {...register("folderId")}
                          >
                            <option value="" selected disabled>
                              New Document Location
                            </option>
                            {rootFolder?.parentFolders?.map((folder) => (
                              <option value={folder?.id}>{folder?.name}</option>
                            ))}
                          </select>
                        </div> */}

                        <div className="col-md-6 mt-2">
                          <div className="form-group mt-2">
                            <label for="model">Model</label>
                            <input
                              type="text"
                              autoComplete="off"
                              readOnly
                              onFocus={(e) =>
                                e.target.removeAttribute("readonly")
                              }
                              className="form-control"
                              id="model"
                              name="model"
                              placeholder=""
                              {...register("model")}
                            />
                          </div>
                        </div>

                        <div className="col-md-6 mt-2">
                          <div className="form-group mt-2">
                            <label for="serialNumber">Serial Number</label>
                            <input
                              type="text"
                              autoComplete="off"
                              readOnly
                              onFocus={(e) =>
                                e.target.removeAttribute("readonly")
                              }
                              className="form-control"
                              id="serialNumber"
                              name="serialNumber"
                              placeholder=""
                              {...register("serialNumber")}
                            />
                          </div>
                        </div>

                        <div className="col-md-6 mt-2">
                          <div className="form-group mt-2">
                            <label for="powerOutput">Power Output</label>
                            <input
                              type="text"
                              autoComplete="off"
                              readOnly
                              onFocus={(e) =>
                                e.target.removeAttribute("readonly")
                              }
                              className="form-control"
                              id="powerOutput"
                              name="powerOutput"
                              placeholder=""
                              {...register("powerOutput")}
                            />
                          </div>
                        </div>
                        <div className="col-md-6 mt-2">
                          <div className="form-group mt-2">
                            <label for="damperSize">Damper Size(mm)</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              autoComplete="off"
                              readOnly
                              onFocus={(e) =>
                                e.target.removeAttribute("readonly")
                              }
                              className="form-control"
                              id="damperSize"
                              name="damperSize"
                              placeholder=""
                              {...register("damperSize")}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4 mt-2">
                      <div className="form-group">
                        <input
                          type="file"
                          multiple
                          className="form-control"
                          {...register("assetImage")}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="row" style={{ height: "auto" }}>
                    <div className="col-md-4 mt-2">
                      <label for="category">Category</label>
                      <select
                        name="category"
                        className="form-control form-select"
                        id="category"
                        {...register("category", {
                          required: {
                            value: true,
                            message: `Please select category`,
                          },
                        })}
                        onChange={(e) => {
                          const val = e.target.value;
                          setValue("category", val);
                          const subCategoryData = subCategory?.filter(
                            (itm) => itm?.attribite1 === val
                          );
                          setSubCategoryList(subCategoryData);
                          setSubCategory2List([]);
                          setSubCategory3List([]);
                        }}
                      >
                        <option value="" selected disabled>
                          Select Category
                        </option>
                        {category?.map((itm) => (
                          <option value={itm?.lovValue}>{itm?.lovValue}</option>
                        ))}
                      </select>
                      {errors?.category && (
                        <InputError
                          message={errors?.category?.message}
                          key={errors?.category?.message}
                        />
                      )}
                    </div>
                    <div className="col-md-4 mt-2">
                      <label for="subCategory">Sub Category 1</label>
                      <select
                        name="subCategory"
                        className="form-control form-select"
                        id="subCategory"
                        {...register("subCategory")}
                        onChange={(e) => {
                          const val = e.target.value;
                          setValue("subCategory", val);
                          const subCategoryData = subCategory2?.filter(
                            (itm) => itm?.attribite1 === val
                          );
                          setSubCategory2List(subCategoryData);
                          setSubCategory3List([]);
                        }}
                      >
                        <option value="">Select Sub Category</option>
                        {subCategoryList?.map((itm) => (
                          <option value={itm?.lovValue}>{itm?.lovValue}</option>
                        ))}
                      </select>
                      {errors?.subCategory && (
                        <InputError
                          message={errors?.subCategory?.message}
                          key={errors?.subCategory?.message}
                        />
                      )}
                    </div>
                    <div className="col-md-4 mt-2">
                      <label for="subCategory2">Sub Category 2</label>
                      <select
                        name="subCategory2"
                        className="form-control form-select"
                        id="subCategory2"
                        {...register("subCategory2")}
                        onChange={(e) => {
                          const val = e.target.value;
                          setValue("subCategory2", val);
                          const subCategoryData = subCategory3?.filter(
                            (itm) => itm?.attribite1 === val
                          );
                          setSubCategory3List(subCategoryData);
                        }}
                      >
                        <option value="">Select Sub Category 2</option>
                        {subCategory2List?.map((itm) => (
                          <option value={itm?.lovValue}>{itm?.lovValue}</option>
                        ))}
                      </select>
                      {errors?.subCategory2 && (
                        <InputError
                          message={errors?.subCategory2?.message}
                          key={errors?.subCategory2?.message}
                        />
                      )}
                    </div>
                    <div>
                      <div className="col-md-4 mt-2">
                        <label for="subCategory3">Sub Category 3</label>
                        <select
                          name="subCategory3"
                          className="form-control form-select"
                          id="subCategory3"
                          {...register("subCategory3")}
                        >
                          <option value="">Select Sub Category 3</option>
                          {subCategory3List?.map((itm) => (
                            <option value={itm?.lovValue}>
                              {itm?.lovValue}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="col-md-4 mt-2">
                      <input
                        type="checkbox"
                        id="patItem"
                        name="patItem"
                        onClick={changePatItem}
                        className="form-check-input"
                        {...register("patItem")}
                      />
                      &nbsp;
                      <label for="patItem">
                        PAT item (fill PAT details below)
                      </label>
                    </div>
                    <div className="col-md-4 mt-2">
                      <input
                        type="checkbox"
                        id="pfpItem"
                        name="pfpItem"
                        onClick={changePfpItem}
                        className="form-check-input"
                        {...register("pfpItem")}
                      />
                      &nbsp;
                      <label for="pfpItem">
                        Passive fire schedule required (fill PFS details below
                        below)
                      </label>
                    </div>
                    <div className="col-md-4 mt-2">
                      <input
                        type="checkbox"
                        id="doorItem"
                        name="doorItem"
                        onClick={changeDoorItem}
                        className="form-check-input"
                        {...register("doorItem")}
                      />
                      &nbsp;
                      <label for="doorItem">
                        Door Assets (fill Door assets details below below)
                      </label>
                    </div>

                    <div className="row" style={{ marginTop: "20px" }}>
                      <hr />
                      <h5>Location </h5>
                    </div>
                    <div className="row">
                      <div className="col-md-4">
                        <label for="position">Interior/Exterior</label>
                        <select
                          name="position"
                          className="form-control form-select"
                          id="position"
                          {...register("position")}
                          onChange={(e) => {
                            const val = e.target.value;
                            setValue("position", val);

                            const node = siteLayout.filter(
                              (site) => site.nodeName === val
                            );
                            const data = siteLayout.filter(
                              (site) =>
                                site.nodeType === "floor" &&
                                site.parentNode === node?.[0]?.id
                            );
                            setFloors(data || []);
                          }}
                        >
                          <option value="">Select Interior/Exterior</option>
                          {["Interior", "Exterior"].map((num) => (
                            <option value={num}>{num} </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label for="floor">Floor</label>
                        <select
                          name="floor"
                          className="form-control form-select"
                          id="floor"
                          {...register("floor")}
                          onChange={(e) => {
                            const val = e.target.value;
                            setValue("floor", val);

                            const node = siteLayout.filter(
                              (site) => site.nodeName === val
                            );
                            const data = siteLayout.filter(
                              (site) =>
                                site.nodeType === "room" &&
                                site.parentNode === node?.[0]?.id
                            );
                            setRooms(data || []);
                          }}
                        >
                          <option value="">Select Floor</option>
                          {floors?.map((site) => (
                            <option value={site.nodeName}>
                              {site.nodeName}{" "}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label for="room">Room</label>
                        <select
                          name="room"
                          className="form-control form-select"
                          id="room"
                          {...register("room")}
                          onChange={(e) => {
                            const val = e.target.value;
                            setValue("room", val);
                          }}
                        >
                          <option value="">Select Room</option>
                          {rooms?.map((site) => (
                            <option value={site.nodeName}>
                              {site.nodeName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* start */}

                  {/* end */}
                </div>
              </div>
            </form>
          </Box>
          {/*  */}
          {/*  */}
        </div>
      </div>
    </Fragment>
  );
};
const mapStateToProps = (state) => ({
  rootFolder: state.site.rootFolder,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
  siteAssets: state.site.siteAssets,

  siteLayout: state.site.siteLayout,
});
export default connect(mapStateToProps, {
  setLoader,
  getDocumentsRootFolder,
  addSiteAsset,
  getSiteAssets,
  getSiteLayout
})(CreateAsset);
