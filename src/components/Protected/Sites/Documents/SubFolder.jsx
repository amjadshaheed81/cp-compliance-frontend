import React from 'react'

const SubFolder = () => {
  return (
    <div>
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
                            <span style={{color: 'gray'}}><i class="fa-solid fa-folder-plus"></i></span>
                            </td>
                        </tr>
                    </tbody>
                </table>
    </div>
  )
}

export default SubFolder