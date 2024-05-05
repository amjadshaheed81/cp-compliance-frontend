const KeyContacts = () => {
  return (
    <>
      <div class="row p-2 bg-white">
        <h2 class="fs-6 mt-4 border-bottom">Key Contacts</h2>
        <div style={{ display: "flex", justifyContent: "space-evenly" }}>
          <div class="grid-item" style={{ marginLeft: "-13rem" }}>
            First Name
          </div>
          <div class="grid-item">Last Name</div>
          <div class="grid-item">Phone</div>
          <div class="grid-item">Email</div>
          <div class="grid-item">Role</div>
        </div>
        <div class="contact-grid-container">
          <div class="contact-grid-item">
            <input class="" type="text" />
          </div>
          <div class="grid-item">
            <input type="text" />
          </div>
          <div class="grid-item">
            <input type="text" />
          </div>
          <div class="grid-item">
            <input type="text" />
          </div>
          <div class="grid-item">
            <input type="text" />
          </div>
        </div>
        <div class="float-end">
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
export default KeyContacts;
