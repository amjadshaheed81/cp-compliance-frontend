import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { connect } from "react-redux";
import {
  addKeyContact,
  getKeyContact,
  deleteKeyContact,
} from "./../../../../store/thunk/site";
import Error from "../../../common/Alert/Error";

const KeyContacts = ({
  updateSite,
  keyContactsFailure,
  keyContacts,
  addKeyContact,
  getKeyContact,
  deleteKeyContact,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    reset,
  } = useForm({});
  const [selectedItem, setSelectedItem] = useState("");

  useEffect(() => {
    getKeyContact(updateSite?.siteId);
  }, []);
  const submitKeyContact = (data) => {
    console.log(data);
  };
  const deleteKeyContactClick = async (itm) => {
    const res = await deleteKeyContact(itm?.id);
    if (res === "Success") {
      getKeyContact(updateSite?.siteId);
    }
  };
  const addKeyContactClick = () => {
    const data = {
      id: "-1",
      siteId: updateSite?.siteId,
      contactName: getValues("contactName"),
      phone: getValues("phone"),
      email: getValues("email"),
      actionManager: getValues("actionManager"),
    };
    const formData = [...keyContacts, {...data}];
    addKeyContact(formData, updateSite?.siteId);
    reset({
      contactName: '',
      phone: '',
      email: '',
      actionManager: '',
    });
  };
  return (
    <>
      <div className="row p-2 bg-white">
        <h2 className="fs-6 mt-4 border-bottom">Key Contacts</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              {/* <th>Last Name</th> */}
              <th>Phone</th>
              <th>Email</th>
              <th>Role</th>
              <th>&nbsp;</th>
            </tr>
          </thead>
          <tbody>
            {keyContacts.map((row) => (
              <tr key={row?.id}>
                <td>{row?.contactName}</td>
                <td>{row?.phone}</td>
                <td>{row?.email}</td>
                <td>{row?.actionManager}</td>
                <td>
                  <button
                    className="btn btn-sm btn-light text-danger mt-4"
                    onClick={() => deleteKeyContactClick(row)}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
            {/* <form className="p-2" onSubmit={handleSubmit(submitKeyContact)}> */}
              <tr>
                <td>
                  <input
                    className="contact-input form-control"
                    type="text"
                    {...register("contactName")}
                  />
                </td>
                {/* <td>
                <input className="contact-input form-control" type="text" {...register("lastName")}/>
              </td> */}
                <td>
                  <input
                    className="contact-input form-control"
                    type="phone"
                    {...register("phone")}
                  />
                </td>
                <td>
                  <input
                    className="contact-input form-control"
                    type="email"
                    {...register("email")}
                  />
                </td>
                <td>
                  {/* <input
                    className="contact-input form-control"
                    type="text"
                    {...register("actionManager")}
                  /> */}
                  <select
                    name="actionManager"
                    className="contact-input form-control form-select"
                    id="actionManager"
                    {...register("actionManager")}
                    value={selectedItem}
                    onChange={(e)=> setSelectedItem(e.target.value)}
                  >
                    <option value=""></option>
                    <option value="admin">Admin</option>
                    <option value="propertymanager">Property Manager</option>
                    <option value="siteactionmanager">Site Action Manager</option>
                    <option value="siteusers">Site users</option>
                    <option value="caretaker">Care Taker</option>
                    <option value="contractor">Contractor</option>
                    <option value="surveyor">Surveyor</option>
                    <option value="tradesman">Tradesman</option>
                    <option value="electrician">Electrician</option>
                    <option value="gasengineer">Gas Engineer</option>
                    <option value="asbestossurveyor">Asbestos Surveyor</option>
                    <option value="acengineer">AC Engineer</option>
                    <option value="firedoorinstall">Fire Door Install</option>
                    <option value="genralcompany">Genral Company</option>
                    <option value="lift+maintainence">Lift Maintainence</option>
                    <option value="plumber">Plumber</option>
                    <option value="autodoormaintainence">Auto Door Maintainence</option>
                    <option value="refusecollector">Refse Collector</option>
                    <option value="firealarm">Fire Alarm</option>
                    <option value="asbestossurveyor">Asbestos Surveyor</option>
                  </select>
                </td>
                <td>&nbsp;</td>
              </tr>
            {/* </form> */}
          </tbody>
        </table>
        <div>{keyContactsFailure && <Error msg={keyContactsFailure} />}</div>
        <div className="pt-4">
          <button
            type="button"
            onClick={() => addKeyContactClick()}
            className="btn btn-light mb-3 mr-4"
          >
            Add Row
          </button>
          &nbsp; &nbsp;
          {/* <button type="submit" className="btn btn-primary mb-3 mr-4">
            Save
          </button> */}
        </div>
      </div>
    </>
  );
};

const mapStateToProps = (state) => ({
  success: state.site.localDetailsSuccess,
  error: state.site.localDetailsError,
  updateSite: state.site.updateSite,
  keyContacts: state.site.keyContacts,
  keyContactsFailure: state.site.keyContactsFailure,
});
export default connect(mapStateToProps, {
  addKeyContact,
  getKeyContact,
  deleteKeyContact,
})(KeyContacts);
