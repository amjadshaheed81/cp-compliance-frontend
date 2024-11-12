import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { connect } from "react-redux";
import {
  addKeyContact,
  getKeyContact,
  deleteKeyContact,
  setLoader,
} from "./../../../../store/thunk/site";
import Error from "../../../common/Alert/Error";
import { toast } from "react-toastify";
import { useSearchParams } from "react-router-dom";
import { InputError } from "../../../common/InputError";
import { isManagerAdminLogin } from "../../../../utils/isManagerAdminLogin";

const KeyContacts = ({
  updateSite,
  keyContactsFailure,
  keyContacts,
  addKeyContact,
  getKeyContact,
  deleteKeyContact,
  loggedInUserData,
  setLoader,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    trigger,
    reset,
  } = useForm({});
  const [selectedItem, setSelectedItem] = useState("");
  const isViewMode = updateSite?.isViewMode;
  const [searchParams] = useSearchParams();
  const paramSiteId = searchParams.get("siteId");
  useEffect(() => {
    if (updateSite?.siteId) {
      getKeyContact(updateSite?.siteId);
    } else {
      getKeyContact(paramSiteId);
    }
  }, []);
  const submitKeyContact = (data) => {
    console.log(data);
  };
  const deleteKeyContactClick = async (itm) => {
    setLoader(true);
    const res = await deleteKeyContact(itm?.id);
    if (res === "Success") {
      toast.success("Key contact has been deleted succesfully.");
      setLoader(false);
      getKeyContact(updateSite?.siteId);
    } else {
      toast.error("Something went wrong while deleting key contact.");
    }
  };
  const addKeyContactClick = async () => {
    const isValidForm = await trigger();
    if(isValidForm) {
      setLoader(true);
      const data = {
        id: "-1",
        siteId: updateSite?.siteId,
        contactName: getValues("contactName"),
        phone: getValues("phone"),
        email: getValues("email"),
        actionManager: getValues("actionManager"),
      };
      const formData = [...keyContacts, { ...data }];
      addKeyContact(formData, updateSite?.siteId);
      reset({
        contactName: "",
        phone: "",
        email: "",
        actionManager: "",
      });
    }
    
  };
  return (
    <>
      <div className="row p-2 bg-white">
        <h2 className="fs-6 mt-4 bg-white">Key Contacts</h2>
        <div className="table-responsive">
          <table className="table">
            <thead className="table-dark">
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Role</th>
                <th>&nbsp;</th>
              </tr>
            </thead>
            <tbody>
              {keyContacts?.length === 0 && (
                <tr>
                  <td colSpan={4}>No Contacts Found!!</td>
                </tr>
              )}
              {keyContacts?.map((row) => (
                <tr key={row?.id}>
                  <td>{row?.contactName}</td>
                  <td>{row?.phone}</td>
                  <td>{row?.email}</td>
                  <td>{row?.actionManager}</td>
                  <td>
                    <button
                      style={{
                        display: isViewMode ? "none" : "",
                      }}
                      disabled={!isManagerAdminLogin(loggedInUserData)}
                      className="btn btn-sm btn-light"
                      onClick={() => deleteKeyContactClick(row)}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
              <tr
                style={{
                  display: isViewMode ? "none" : "",
                }}
              >
                <td>
                  <input
                    className="contact-input form-control"
                    type="text"
                    disabled={isViewMode}
                    {...register("contactName", {
                      required: {
                        value: true,
                        message: `Please enter contact name.`,
                      },
                    })}
                  />
                  {errors?.contactName && (
                    <InputError
                      message={errors?.contactName?.message}
                      key={errors?.contactName?.message}
                    />
                  )}
                </td>
                <td>
                  <input
                    className="contact-input form-control"
                    type="tel"
                    maxLength={11}
                    pattern="[0-9]*"
                    disabled={isViewMode}
                    {...register("phone", {
                      required: {
                        value: true,
                        message: `Please enter phone.`,
                      },
                    })}
                  />
                  {errors?.phone && (
                    <InputError
                      message={errors?.phone?.message}
                      key={errors?.phone?.message}
                    />
                  )}
                </td>
                <td>
                  <input
                    className="contact-input form-control"
                    type="email"
                    disabled={isViewMode}
                    {...register("email", {
                      required: {
                        value: true,
                        message: `Please enter email.`,
                      },
                    })}
                  />
                  {errors?.email && (
                    <InputError
                      message={errors?.email?.message}
                      key={errors?.email?.message}
                    />
                  )}
                </td>
                <td>
                  <select
                    name="actionManager"
                    className="contact-input form-control form-select"
                    id="actionManager"
                    disabled={isViewMode}
                    {...register("actionManager", {
                      required: {
                        value: true,
                        message: `Please select role.`,
                      },
                    })}
                    value={selectedItem}
                    onChange={(e) => setSelectedItem(e.target.value)}
                  >
                    <option value=""></option>
                    <option value="admin">Admin</option>
                    <option value="propertymanager">Property Manager</option>
                    <option value="siteactionmanager">
                      Site Action Manager
                    </option>
                    <option value="siteusers">Site users</option>
                    <option value="caretaker">Caretaker</option>
                    <option value="contractor">Contractor</option>
                    <option value="surveyor">Surveyor</option>
                    <option value="tradesman">Tradesman</option>
                    <option value="electrician">Electrician</option>
                    <option value="gasengineer">Gas Engineer</option>
                    <option value="asbestossurveyor">Asbestos Surveyor</option>
                    <option value="acengineer">AC Engineer</option>
                    <option value="firedoorinstall">Fire Door Install</option>
                    <option value="generalcompany">General Company</option>
                    <option value="lift+maintainence">Lift Maintainence</option>
                    <option value="plumber">Plumber</option>
                    <option value="autodoormaintainence">
                      Auto Door Maintainence
                    </option>
                    <option value="refusecollector">Refse Collector</option>
                    <option value="firealarm">Fire Alarm</option>
                    <option value="asbestossurveyor">Asbestos Surveyor</option>
                  </select>
                  {errors?.actionManager && (
                    <InputError
                      message={errors?.actionManager?.message}
                      key={errors?.actionManager?.message}
                    />
                  )}
                </td>
                <td>&nbsp;</td>
              </tr>
              <tr>
                <td className="pt-4">
                  <button
                    style={{
                      display: isViewMode ? "none" : "",
                    }}
                    disabled={!isManagerAdminLogin(loggedInUserData)}
                    type="button"
                    onClick={() => addKeyContactClick()}
                    className="btn btn-light"
                  >
                    Add Row
                  </button>
                  &nbsp; &nbsp;
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div>{keyContactsFailure && <Error msg={keyContactsFailure} />}</div>
      </div>
    </>
  );
};

const mapStateToProps = (state) => ({
  success: state.site.localDetailsSuccess,
  error: state.site.localDetailsError,
  updateSite: state.site.updateSite,
  keyContacts: state.site.keyContacts,
  loggedInUserData: state.site.loggedInUserData,
  keyContactsFailure: state.site.keyContactsFailure,
});
export default connect(mapStateToProps, {
  addKeyContact,
  getKeyContact,
  deleteKeyContact,
  setLoader,
})(KeyContacts);
