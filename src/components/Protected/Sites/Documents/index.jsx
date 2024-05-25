import BreadCrumHeader from "../../../common/BreadCrumHeader/BreadCrumHeader";
import Header from "../../../common/Header/Header";
import SidebarNew from "../../../common/Sidebar/SidebarNew";

const Document = () => {
    return (
        <>
            <Header />
            <SidebarNew />
            <div class='container-fluid' style={{ marginLeft: '5rem', paddingRight:'9rem' }}>
                <BreadCrumHeader header={"Document Management"} page={"Documents"} />
                <div class="float-end w-25" style={{ position: "relative" }}>
                    <i
                        style={{
                            position: "absolute",
                            color: "lightgrey",
                            paddingLeft: "1.5rem",
                        }}
                        className="fas fa-search p-3"
                    ></i>
                    <input
                        type="text"
                        style={{ textAlign: "center" }}
                        className="form-control m-2"
                        id="search"
                        name="search"
                        placeholder="Search for Document"
                    // onChange={searchDocument}
                    />
                </div>
                <table class="table f-11">
                    <thead class="table-dark">
                        <tr>
                            <th scope="col">Document Name</th>
                            <th scope="col">Uploader</th>
                            <th scope="col">Issue Date</th>
                            <th scope="col">Expiry Date</th>
                            <th scope="col">Source</th>
                            <th scope="col">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                        <div><i style={{color: '#384BD3'}} class="fas fa-folder fa-2x"></i><span class="p-3">Statutory Documents</span></div>
                            <td>--</td>
                            <td>--</td>
                            <td>--</td>
                            <td>--</td>
                            <td>
                            <span style={{color: 'gray'}}><i class="fa fa-eye fa-2x" aria-hidden="true" size="md"></i></span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </>
    )
}
export default Document;