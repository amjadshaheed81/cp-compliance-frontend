import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import Header from "../../../common/Header/Header";
import BreadCrumHeader from "../../../common/BreadCrumHeader/BreadCrumHeader";
import SidebarNew from "../../../common/Sidebar/SidebarNew";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { useNavigate } from "react-router-dom";
import interactionPlugin from "@fullcalendar/interaction";
import Tooltip from "@mui/material/Tooltip";
import moment from "moment";
import "./calendar.css";
import { get, post, put } from "../../../../api";
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Appointment from "../../Dashboard/Appointment";
import {
  Autocomplete,
} from "@mui/material";

const SiteCalendar = ({ siteSelectedForGlobal, loggedInUserData }) => {
  const navigate = useNavigate();
  const navigateTo = (link) => {
    navigate(link);
  };
  let momentX = new Date();
  let date2 = moment(new Date()).add(5, 'days').toDate();
  const [clickedDate, setClickedDate] = useState(undefined);

  const [calendarEvent, setCalendarEvent] = useState([]);
  const [todayEvents, settodayEvents] = useState([]);
   const [openInvite, setOpenInvite] = useState(false);
    const [currentInvite, setCurrentInvite] = useState(null);
    
  // State for appointment modal
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({
    recipient: '',
    subject: '',
    date: '',
    startTime: '',
    endTime: ''
  });

  const [managerList, setManagerList] = useState([]);

  const getManagerList = async () => {
      const data = await get(
        `/api/user/all?siteId=${siteSelectedForGlobal?.siteId}`
      );
      setManagerList(
        data?.users?.sort((a, b) => {
          if (a.name < b.name) {
            return -1;
          }
          if (a.name > b.name) {
            return 1;
          }
          return 0;
        }) || []
      );
    };

  useEffect(() => {
    if(siteSelectedForGlobal?.siteId) {
      getData();
      getManagerList();
    }
  }, [])

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  const getUserName = (user) => {  
    if(String(user?.data?.param) === String(loggedInUserData?.id)) {
      return managerList.find(u => String(u.id) === String(user?.data?.userId))?.name;
    } else {
      return managerList.find(u => String(u.id) === String(user?.data?.param))?.name;
    }
    
  }

  const getData = async () => {
    let data = await get("/api/user/calendar/events?siteId="+siteSelectedForGlobal?.siteId);
    // let invitedata = await get("/api/user/calendar/invites?userId=" + (loggedInUserData?.id ?? 0));
    //     data = [...data, ...invitedata]
    data = data.filter(d=> d.section !== 'proposed'  && d.section !== 'dismissed' )
    data = filterDuplicates(data);
    const todays = data.filter(e => isToday(new Date(e.endDate)));
    settodayEvents(todays);
    const event = data?.map(d => {
      return {
        title: JSON.stringify([
          {
            label: d.shortText,
            type: d.eventType,
            section: d.section,
            data: d
          }]),
        date: moment(d.endDate).format("YYYY-MM-DD"),
        getDate: moment(d.endDate).format("YYYY-MM-DD"),
      }
    })
    setCalendarEvent(event);
  }

  const handleAppointmentChange = (e) => {
    const { name, value } = e.target;
    setAppointmentForm({
      ...appointmentForm,
      [name]: value
    });
    getData();
  };

  const handleAppointmentSubmit = async (e) => {
    e.preventDefault();
    const calenderBody = {
          siteId: siteSelectedForGlobal?.siteId,
          startDate: moment(appointmentForm.date),
          endDate: moment(appointmentForm.date),
          shortText: appointmentForm.subject,
          eventType: `Appointment`,
          userId: loggedInUserData?.id,
          includeCompanyUsers: false,
          status:"invite",
          param: appointmentForm?.recipient,
          startTime: appointmentForm.startTime,
          endTime: appointmentForm.endTime,
          section: "proposed",
        };
    
    await put('/api/user/calendar',calenderBody)
    setShowAppointmentModal(false);
    setAppointmentForm({
      recipient: '',
      subject: '',
      date: '',
     startTime: '',
    endTime: ''
    });
  };

  const filterDuplicates = (arr) => {
    const uniqueSet = new Set();
    return arr.filter(item => {
        const key = `${item.section}-${item.eventType}-${item.siteId}-${item.startDate}-${item.endDate}-${item.shortText}`;
        if (uniqueSet.has(key)) {
            return false;
        } else {
            uniqueSet.add(key); 
            return true;
        }
    });
  }

  const [formData, setFormData] = useState({
    searchField: "",
    month: "",
    year: "",
  });
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  useEffect(() => {
    searchSiteCalendar();
  }, [formData.searchField, formData.month, formData.year]);
  
  const searchSiteCalendar = () => {
    const searchField = formData?.searchField;
    const month = formData?.month;
    const year = formData?.year;
    if (searchField || month || year) {
    } else {
    }
  };
  
  const msg = async (date) => {
    setClickedDate(date?._def?.extendedProps?.getDate);
  };
  
  function truncateString(str, num) {
    return str.length > num ? str?.slice(0, num) + "..." : str;
  }
  
  function renderEventContent(eventInfo) {
    const title = JSON.parse(eventInfo.event.title);
    return (
      <>
        <p onClick={() => msg(eventInfo.event)} style={{ overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
          {title?.map((itm, index) => (
            <Tooltip title={itm?.type?.includes("Appointment") ? `${itm?.label} - ${getUserName(itm)}- Timing : ${itm?.data?.startTime} - : ${itm?.data?.endTime}` : itm?.label} arrow key={index}>
              {itm?.type?.includes("Audit") && (
                <p onClick={()=>{navigateTo(itm?.section)}}><span className="badge bg-primary"  >{truncateString(itm?.type, 15)}</span></p>
              )}
              {itm?.type?.includes("Assessment") && (
                <p onClick={()=>{navigateTo(itm?.section)}}><span className="badge bg-dark" >{truncateString(itm?.type, 15)}</span></p>
              )}
              {itm?.type?.includes("Inspection") && (
                <p onClick={()=>{navigateTo(itm?.section)}}><span className="badge bg-success" >{truncateString(itm?.type, 15)}</span></p>
              )}
              {itm?.type?.includes("Survey") && (
                <p onClick={()=>{navigateTo(itm?.section)}}><span className="badge bg-danger" >{truncateString(itm?.type, 15)}</span></p>
              )}
              {itm?.type?.includes("Asbestos") && (
                <p onClick={()=>{navigateTo(itm?.section)}}><span className="badge bg-warning text-dark" >{truncateString(itm?.type, 15)}</span></p>
              )}
              {itm?.type?.includes("Document") && (
                <p><span className="badge bg-info">{truncateString(itm?.type, 15)}</span></p>
              )}
              {itm?.type?.includes("Contract") && (
                <p onClick={()=>{navigateTo(itm?.section)}}><span className="badge bg-info" >{truncateString(itm?.type, 15)}</span></p>
              )}
             {itm?.type?.includes("Appointment") &&  itm?.data?.section === "accepted" && (
                  <p><span class="badge bg-info" >{itm?.type}</span></p>
                )}

{itm?.type?.includes("Appointment") &&  (itm?.data?.section === "proposed" || itm?.data?.section === "dismissed") && (
                  <p onClick={() => { setCurrentInvite(itm?.data);
                    setOpenInvite(true); }}><span class="badge bg-danger" >{itm?.type}</span></p>
                )}
            </Tooltip>
          ))}
        </p>
      </>
    );
  }
  
  return (
    <Fragment>
      <SidebarNew />
      <Appointment 
      getData={getData}
        openInvite={openInvite} 
        setOpenInvite={setOpenInvite}
        currentInvite={currentInvite}
        setCurrentInvite={setCurrentInvite}
      />
      <div className="content">
        <Header />
        <div className="container-fluid">
          <BreadCrumHeader header={"Site Calendar"} page={"Calendar"} />
          
          {/* Book Appointment Button */}
          <div className="d-flex justify-content-end mb-3">
            <button 
              className="btn btn-primary"
              onClick={() => setShowAppointmentModal(true)}
            >
              Book Appointment
            </button>
          </div>
          
          {/* Appointment Modal */}
          <Modal show={showAppointmentModal} onHide={() => setShowAppointmentModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Book New Appointment</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form onSubmit={handleAppointmentSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Recipient</Form.Label>
                                       <Autocomplete
                                          id="recipient"
                                          onChange={(event, item) => {

                                            setAppointmentForm({
                                              ...appointmentForm,
                                              recipient: item?.key
                                            });
                                          }}
                                          value={
                                            managerList
                                            .filter((o) =>
                                             String(o.id) !== String(loggedInUserData?.id))
                                              .filter(
                                                (o) =>
                                                  String(o.id) === String(appointmentForm.recipient)
                                              )
                                              .map((option) => {
                                                return {
                                                  key: option.id,
                                                  label:
                                                    option.role +
                                                    " - " +
                                                    option.name +
                                                    " (" +
                                                    option.email +
                                                    ")" +
                                                    (option.companyName
                                                      ? " - " + option.companyName
                                                      : ""),
                                                };
                                              })[0]
                                          }
                                          options={managerList
                                            .filter((o) =>
                                              String(o.id) !== String(loggedInUserData?.id)).map((option) => {
                                            return {
                                              key: option.id,
                                              label:
                                                option.role +
                                                " - " +
                                                option.name +
                                                " (" +
                                                option.email +
                                                ")" +
                                                (option.companyName
                                                  ? " - " + option.companyName
                                                  : ""),
                                            };
                                          })}
                                          getOptionLabel={(option) => option.label}
                                          renderInput={(params) => (
                                            <div ref={params.InputProps.ref}>
                                              <input
                                                type="text"
                                                autoComplete="off"
                                                readOnly
                                                onFocus={(e) =>
                                                  e.target.removeAttribute("readonly")
                                                }
                                                {...params.inputProps}
                                                required
                                                className="form-control"
                                                placeholder="Select Lead"
                                              />
                                            </div>
                                          )}
                                        />
                  {/* <Form.Control
                    as="select"
                    name="recipient"
                    value={appointmentForm.recipient}
                    onChange={handleAppointmentChange}
                    required
                  >
                    <option value="">Select Lead</option>
                    {managerList?.map(u => {
                      return (
                        <option value={u.id}>{u.trade}({u.role}) - {u.name} ({u.email}) - {u.company} </option>
                      )
                    })}
                  </Form.Control> */}
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Subject</Form.Label>
                  <Form.Control
                    type="text"
                    name="subject"
                    value={appointmentForm.subject}
                    onChange={handleAppointmentChange}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="date"
                    value={appointmentForm.date}
                    onChange={handleAppointmentChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </Form.Group>
                
                <div className="row">
                  <Form.Group className="mb-3 col-md-6">
                    <Form.Label>Start Time</Form.Label>
                    <Form.Control
                      type="time"
                      name="startTime"
                      value={appointmentForm.startTime}
                      onChange={handleAppointmentChange}
                      required
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3 col-md-6">
                    <Form.Label>End Time</Form.Label>
                    <Form.Control
                      type="time"
                      name="endTime"
                      value={appointmentForm.endTime}
                      onChange={handleAppointmentChange}
                      required
                    />
                  </Form.Group>
                </div>
                
                <div className="d-flex justify-content-end">
                  <Button variant="secondary" onClick={() => setShowAppointmentModal(false)} className="me-2">
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit">
                    Book Appointment
                  </Button>
                </div>
              </Form>
            </Modal.Body>
          </Modal>

          {/* Search and Filter Section */}
          <div className="d-flex bd-highlight">
            <div className="pt-2 bd-highlight ">
              <div className="row" style={{ height: "auto" }}>
                <div className="col">
                  <input
                    type="text"
                    autoComplete="off"
                    readOnly
                    onFocus={(e) => e.target.removeAttribute("readonly")}
                    className="form-control"
                    placeholder="Search"
                    name="searchField"
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col">
                  <select
                    name="month"
                    className="form-control form-select"
                    id="month"
                    onChange={handleInputChange}
                  >
                    <option value="">Select Month</option>
                    <option value="January">January</option>
                    <option value="February">February</option>
                    <option value="March">March</option>
                    <option value="April">April</option>
                    <option value="May">May</option>
                    <option value="May">June</option>
                    <option value="July">July</option>
                    <option value="August">August</option>
                    <option value="September">September</option>
                    <option value="October">October</option>
                    <option value="Novembar">Novembar</option>
                    <option value="December">December</option>
                  </select>
                </div>
                <div className="col">
                  <select
                    name="year"
                    className="form-control form-select"
                    id="year"
                    onChange={handleInputChange}
                  >
                    <option value="">Select Year</option>
                    <option value="2024">2024</option>
                    <option value="2024">2023</option>
                    <option value="2024">2022</option>
                    <option value="2024">2021</option>
                    <option value="2024">2020</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          {/* Calendar and Sidebar Section */}
          <div className="row p-2">
            <div className="col-md-9 p-4">
              <section className="calendar__days">
                <FullCalendar
                  plugins={[dayGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  events={calendarEvent}
                  eventContent={renderEventContent}
                  datesSet={(e) => {
                    console.log("===>", e);
                  }}
                />
              </section>
            </div>
            <div className="col-md-3 pt-4" style={{ marginTop: "4rem" }}>
              <div>
                <p className="h6">
                  12 July 2024{" "}
                  <span
                    style={{
                      position: "absolute",
                      right: "2rem",
                    }}
                  >
                    <span class="badge bg-primary">{todayEvents.length}</span>
                  </span>
                </p>
                <ul class="list-group">
                {todayEvents.map(e => (
                  <li class="list-group-item text-primary">
                    {e.shortText}
                  </li>
                  ))
                  }
                </ul>
              </div>
              <div className="mt-4">
                <p className="h6">Event Type</p>
                <ul class="list-group">
                  <li class="list-group-item">
                    <span class="badge bg-primary">Audit</span>
                  </li>
                  <li class="list-group-item">
                    <span class="badge bg-dark">Assessment</span>
                  </li>
                  <li class="list-group-item">
                    <span class="badge bg-success">Inspection</span>
                  </li>
                  <li class="list-group-item">
                    <span class="badge bg-danger">Water Survey</span>
                  </li>
                  <li class="list-group-item">
                    <span class="badge bg-warning text-dark">
                      Asbestos Survey
                    </span>
                  </li>
                  <li class="list-group-item">
                    <span class="badge bg-info">PAT Testing</span>
                  </li>
                  <li class="list-group-item">
                    <span class="badge bg-info">Appointment</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

const mapStateToProps = (state) => ({
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
  loggedInUserData: state.site.loggedInUserData,
});

export default connect(mapStateToProps, {})(SiteCalendar);