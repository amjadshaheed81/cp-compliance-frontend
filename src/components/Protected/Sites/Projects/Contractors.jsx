// components/Login/LoginForm.js
import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import moment from "moment";
import { Box, Modal, Typography, Chip } from "@mui/material";

const Contractors = ({
  contractsList,
  setSelectedContractors,
  data,
  setData,
}) => {
  const [open, setOpen] = useState(false);
  const [tableData, setTableData] = useState(data);
  useEffect(() => {
    setTableData(data);
  }, [data]);
  const handleOpen = () => {
    setOpen(!open);
  };
  const handleClose = () => {
    setOpen(false);
  };
  const removeByIndex = (list, index) => [
    ...list?.slice(0, index),
    ...list?.slice(index + 1),
  ];
  const GettableRow = ({ itm, index, setData, data }) => {
    const [row, setRowdata] = useState(itm);
    const deleteContractById = (index) => {
      const res = removeByIndex(data, index);
      setData(res);
    };
    let color = "secondary" 
    if (itm.status === "received") {
      color="success"
    }
    return (
      <tr>
        {itm ? (
          <td>
            <select
              className="form-control form-select"
              name="contractors"
              id="contractors"
              onChange={(e) => {
                const selectedValue = e.target.value;
                const getContractorList = contractsList?.filter(
                  (contractor) => contractor?.id == selectedValue
                );
                const contractRows = [...data];
                contractRows[index] = {
                  ...row,
                  contractorUserId: selectedValue,
                  company: getContractorList?.[0]?.company || "",
                };
                setData(contractRows);
                setRowdata({
                  ...row,
                  contractorUserId: selectedValue,
                  company: getContractorList?.[0]?.company || "",
                });
              }}
            >
              <option value={""}>Select Contractor</option>
              {contractsList?.map((contractItm) => (
                <option
                  value={contractItm?.id}
                  selected={contractItm?.id == itm?.contractorUserId}
                >
                  {contractItm?.name}
                </option>
              ))}
            </select>
          </td>
        ) : (
          <td></td>
        )}
        {itm?.company ? <td>{itm?.company}</td> : <td></td>}
        {itm?.quote ? <td>£ {itm?.quote}</td> : <td></td>}
        {itm?.quoteDate ? <td>{moment(itm?.quoteDate).format('DD-MM-YYYY')}</td> : <td></td>}
        {itm?.status ? <td><Chip label={itm?.status} color={color}/></td> : <td></td>}
        {itm?.actions ? (
          <td>
            <button
              className="btn btn-sm btn-light text-danger"
              onClick={() => deleteContractById(index)}
            >
              <i className="fas fa-trash"></i>
            </button>
          </td>
        ) : (
          <td>
            <button
              className="btn btn-sm btn-light text-danger"
              onClick={() => deleteContractById(index)}
            >
              <i className="fas fa-trash"></i>
            </button>
          </td>
        )}
      </tr>
    );
  };
  const style = {
    position: "absolute",
    overflow: "auto",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 700,
    height: 400,
    bgcolor: "background.paper",
    border: "2px solid #fff",
    boxShadow: 24,
    p: 4,
  };
  return (
    <Fragment>
      <div>
        <table className="table table-bordered f-11">
          <thead className="table-dark">
            <tr>
              <th scope="col">Contractor Contact</th>
              <th scope="col">Company</th>
              <th scope="col">Quote (GBP)</th>
              <th scope="col">Quote Date</th>
              <th scope="col">Status</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tableData?.map((dataItm, index) => (
              <GettableRow
                itm={dataItm}
                index={index}
                setData={setData}
                data={data}
              />
            ))}
          </tbody>
        </table>
      </div>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        
        <div style={{padding: "20px"}}>
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            View Contract &amp; Quote
          </Typography>
          <form className="row border-top">
            <div>
              <span className="badge bg-warning">Recieved</span>
            </div>
            <div className="col-md-6">
              <label for="projectSummary" className="form-label">
                Project Summary
              </label>
              <input
                type="text"
autoComplete="off"
          readOnly
          onFocus={(e) => e.target.removeAttribute("readonly")}
                name="projectSummary"
                className="form-control"
                id="projectSummary"
              />
            </div>
            <div className="col-md-6">
              <label for="contractor" className="form-label">
                Contractor
              </label>
              <input
                type="text"
autoComplete="off"
          readOnly
          onFocus={(e) => e.target.removeAttribute("readonly")}
                name="contractor"
                className="form-control"
                id="contractor"
              />
            </div>
            <div className="col-md-6">
              <label for="projectManager" className="form-label">
                Project Manager
              </label>
              <input
                type="text"
autoComplete="off"
          readOnly
          onFocus={(e) => e.target.removeAttribute("readonly")}
                name="projectManager"
                className="form-control"
                id="projectManager"
              />
            </div>
            <div className="col-md-6">
              <label for="projectStartDate" className="form-label">
                Project Start date
              </label>
              <input
                type="date"
                name="projectStartDate"
                className="form-control"
                id="projectStartDate"
              />
            </div>
            <div className="col-md-6">
              <label for="quoteDate" className="form-label">
                Quote date
              </label>
              <input
                type="date"
                name="quoteDate"
                className="form-control"
                id="quoteDate"
              />
            </div>
            <div className="col-md-6">
              <label for="quote" className="form-label">
                Quote (GBP)
              </label>
              <input
                type="text"
autoComplete="off"
          readOnly
          onFocus={(e) => e.target.removeAttribute("readonly")}
                name="budget"
                className="form-control"
                id="budget"
              />
            </div>
            <div className="col-md-6">
              <label for="officialQuote" className="form-label">
                Official Quote
              </label>
              <input
                type="text"
autoComplete="off"
          readOnly
          onFocus={(e) => e.target.removeAttribute("readonly")}
                name="officialQuote"
                className="form-control"
                id="officialQuote"
              />
            </div>
            <div className="col-md-6">
              <label for="notes" className="form-label">
                Notes
              </label>
              <textarea
                name="notes"
                className="form-control"
                id="notes"
              ></textarea>
            </div>
            <div>
              <table className="table f-11">
                <thead className="table-dark">
                  <tr>
                    <th scope="col">Mandatory Folder</th>
                    <th scope="col">File</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Asbestos Removal Work</td>
                    <td>
                      <span className="badge bg-light text-primary">
                        File1.pdf
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="col-md-12 pt-4 border-top">
              <div className="float-end">
                <button
                  type="button"
                  className="btn btn-light mb-3 mr-4 text-primary"
                  onClick={() => {
                    setOpen(false);
                  }}
                >
                  Close
                </button>
                &nbsp; &nbsp;
                <button type="button" className="btn btn-success mb-3 mr-4">
                  Approve
                </button>
                &nbsp; &nbsp;
                <button type="button" className="btn btn-danger mb-3 mr-4">
                  Reject
                </button>
              </div>
            </div>
          </form>
          </Box>
        </div>
      </Modal>
    </Fragment>
  );
};

export default connect(null, {})(Contractors);
