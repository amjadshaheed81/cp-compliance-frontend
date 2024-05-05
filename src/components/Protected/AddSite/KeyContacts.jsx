const KeyContacts = () => {
    return (
        <>
            <div class="row" style={{ backgroundColor: 'white', zIndex: '1' }}>

                <h2 class="fs-6 mt-4 border-bottom">Key Contacts</h2>
                <div style={{display:'flex', justifyContent: 'space-evenly'}}>
                <div class="grid-item" style={{marginLeft: '-13rem'}}>First Name</div>
                    <div class="grid-item">Last Name</div>
                    <div class="grid-item">Phone</div>
                    <div class="grid-item">Email</div>
                    <div class="grid-item">Role</div>
                </div>
                <div class="contact-grid-container">
                    <div class="contact-grid-item">
                        <input class="" type="text" />
                    </div>
                    <div class="grid-item"><input type="text" /></div>
                    <div class="grid-item"><input type="text" /></div>
                    <div class="grid-item"><input type="text" /></div>
                    <div class="grid-item"><input type="text" /></div>
                    <div class="grid-item"><input type="text" /></div>
                    <div class="grid-item"><input type="text" /></div>
                    <div class="grid-item"><input type="text" /></div>
                    <div class="grid-item"><input type="text" /></div>
                    <div class="grid-item"><input type="text" /></div>
                </div>
            </div>
        </>
    )
}
export default KeyContacts;