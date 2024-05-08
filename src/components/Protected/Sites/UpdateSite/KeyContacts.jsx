import { useEffect } from "react";
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
  useEffect(() => {
    getKeyContact(updateSite?.id);
  }, []);
  const submitKeyContact = (data) => {
    console.log(data);
  };
  const deleteKeyContactClick = (itm) => {
    console.log(itm);
    deleteKeyContact(itm?.id);
  };
  const addKeyContactClick = () => {
    const data = {
      id: "-1",
      siteId: updateSite?.id,
      contactName: getValues("contactName"),
      phone: getValues("phone"),
      email: getValues("email"),
      actionManager: getValues("actionManager"),
    };
    const formData = [...keyContacts, {...data}];
    addKeyContact(formData, updateSite?.id);
  };
  return (
    <>
      <div class="row p-2 bg-white">
        <h2 class="fs-6 mt-4 border-bottom">Key Contacts</h2>
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
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
            {/* <form className="p-2" onSubmit={handleSubmit(submitKeyContact)}> */}
              <tr>
                <td>
                  <input
                    class="contact-input form-control"
                    type="text"
                    {...register("contactName")}
                  />
                </td>
                {/* <td>
                <input class="contact-input form-control" type="text" {...register("lastName")}/>
              </td> */}
                <td>
                  <input
                    class="contact-input form-control"
                    type="phone"
                    {...register("phone")}
                  />
                </td>
                <td>
                  <input
                    class="contact-input form-control"
                    type="email"
                    {...register("email")}
                  />
                </td>
                <td>
                  <input
                    class="contact-input form-control"
                    type="text"
                    {...register("actionManager")}
                  />
                </td>
                <td>&nbsp;</td>
              </tr>
            {/* </form> */}
          </tbody>
        </table>
        <div>{keyContactsFailure && <Error msg={keyContactsFailure} />}</div>
        <div class="pt-4">
          <button
            type="button"
            onClick={() => addKeyContactClick()}
            class="btn btn-light mb-3 mr-4"
          >
            Add Row
          </button>
          &nbsp; &nbsp;
          {/* <button type="submit" class="btn btn-primary mb-3 mr-4">
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
