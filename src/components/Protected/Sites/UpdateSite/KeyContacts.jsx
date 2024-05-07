import { connect } from "react-redux";

const KeyContacts = ({ updateSite }) => {
  return (
    <>
      <div class="row p-2 bg-white">
        <h2 class="fs-6 mt-4 border-bottom">Key Contacts</h2>
        <div class='col-md-2'>
          <label htmlFor="fname">First Name</label>
          <input class="contact-input form-control"type="text" />
        </div>
        <div class='col-md-2'>
          <label htmlFor="fname">Last Name</label>
          <input class="contact-input form-control"type="text" />
        </div>
        <div class='col-md-2'>
        <label htmlFor="fname">Phone</label>
          <input class="contact-input form-control"type="phone" />
        </div>
        <div class='col-md-2'>
        <label htmlFor="fname">Email</label>
          <input class="contact-input form-control"type="email" />
        </div>
        <div class='col-md-2'>
        <label htmlFor="fname">Role</label>
          <input class="contact-input form-control"type="text" />
        </div>
        <div class='col-md-2'>
        <button
          className="btn btn-sm btn-light text-danger mt-4"
          // onClick={() => deleteSiteById(itm)}
        >
          <i class="fas fa-trash"></i>
        </button>
        </div>
        <div class="pt-4">
          <button type="button" class="btn btn-light mb-3 mr-4">
            Add Row
          </button>
          &nbsp; &nbsp;
          <button type="submit" class="btn btn-primary mb-3 mr-4">
            Save
          </button>
        </div>
      </div>
    </>
  );
};

const mapStateToProps = (state) => ({
  success: state.site.localDetailsSuccess,
  error: state.site.localDetailsError,
  updateSite: state.site.updateSite,
});
export default connect(mapStateToProps, {})(KeyContacts);
