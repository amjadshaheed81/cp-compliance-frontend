const UpdateFloor = () => {
return(
    <div>
        <h5 class="pt-5 text-start">Update Floor Plan</h5>
        <table style={{borderCollapse: 'separate', borderSpacing: '2rem'}}>
          <thead>
            <tr>
              <td>Floor Name</td>
              <td>Floor Image</td>
            </tr>
          </thead>
          <tbody>
              <tr key="FloorName">
                <td>Internal: First Floor</td>
                <td><input
                    // {...register("siteImage")}
                    className="form-control"
                    type="file"
                    name="siteImage"
                    accept="image/*, application/pdf"
                    id="siteImage"
                    // onChange={handleFileSelect}
                  /></td>
                <td></td>
              </tr>
          </tbody>
        </table>
    </div>
)
}
export default UpdateFloor;