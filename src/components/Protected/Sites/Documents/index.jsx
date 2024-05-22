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
                    // onChange={searchSite}
                    />
                </div>
                <table class="table table-bordered f-11">
                    <thead class="table-dark">
                        <tr>
                            <th scope="col">Action</th>
                            <th scope="col">Owner</th>
                            <th scope="col">End Date</th>
                            <th scope="col">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Action A</td>
                            <td>Joe B</td>
                            <td>31 Dec 24</td>
                            <td>
                                <div class="bg-warning text-light rounded-1 p-1" role="alert">
                                    In Progress
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>Action B</td>
                            <td>Joe B</td>
                            <td>31 Dec 24</td>
                            <td>
                                <div class="bg-warning text-light rounded-1 p-1" role="alert">
                                    In Progress
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>Action B</td>
                            <td>Joe B</td>
                            <td>31 Dec 24</td>
                            <td>
                                <div class="bg-success text-light rounded-1 p-1" role="alert">
                                    Completed
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </>
    )
}
export default Document;