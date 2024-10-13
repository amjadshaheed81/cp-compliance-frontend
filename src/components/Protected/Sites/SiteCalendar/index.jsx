import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import Header from "../../../common/Header/Header";
import BreadCrumHeader from "../../../common/BreadCrumHeader/BreadCrumHeader";
import SidebarNew from "../../../common/Sidebar/SidebarNew";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import Tooltip from "@mui/material/Tooltip";
import moment from "moment";
import "./calendar.css";
import { get } from "../../../../api";

const SiteCalendar = ({ siteSelectedForGlobal, loggedInUserData }) => {
  let momentX = new Date();
  let date2 = moment(new Date()).add(5, 'days').toDate();
  const [clickedDate, setClickedDate] = useState(undefined);

  const [calendarEvent, setCalendarEvent] = useState([]);
  const [todayEvents, settodayEvents] = useState([]);
  //const [data, setData] = useState([]);
  useEffect(() => {
    getData();
  }, [])

  const isToday = (date) => {
    const today = new Date();
    
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }
  const getData = async () => {
    
    const data = await get("/api/user/calendar/events?userId="+loggedInUserData?.id);
    const todays = data.filter(e => isToday(new Date(e.endDate)));
    settodayEvents(todays);
    const event = data.map(d => {
      return {
        title: JSON.stringify([
          {
            label: d.shortText,
            type: d.eventType,
          }]),
        date: moment(d.endDate).format("YYYY-MM-DD"),
        getDate: moment(d.endDate).format("YYYY-MM-DD"),
      }
    })
    console.log("datatatatat", event)
    setCalendarEvent(event);
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
    return str.length > num ? str.slice(0, num) + "..." : str;
  }
  
  function renderEventContent(eventInfo) {
    const title = JSON.parse(eventInfo.event.title);
    return (
      <>
        <p onClick={() => msg(eventInfo.event)} style={{ overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
          {title?.map((itm, index) => (
            <Tooltip title={itm?.label} arrow key={index}>
              {itm?.type?.includes("Audit") && (
                <p><span className="badge bg-primary">{truncateString(itm?.type, 15)}</span></p>
              )}
              {itm?.type?.includes("Assessment") && (
                <p><span className="badge bg-dark">{truncateString(itm?.type, 15)}</span></p>
              )}
              {itm?.type?.includes("Inspection") && (
                <p><span className="badge bg-success">{truncateString(itm?.type, 15)}</span></p>
              )}
              {itm?.type?.includes("Survey") && (
                <p><span className="badge bg-danger">{truncateString(itm?.type, 15)}</span></p>
              )}
              {itm?.type?.includes("Asbestos") && (
                <p><span className="badge bg-warning text-dark">{truncateString(itm?.type, 15)}</span></p>
              )}
              {itm?.type?.includes("Document") && (
                <p><span className="badge bg-info">{truncateString(itm?.type, 15)}</span></p>
              )}
              {itm?.type?.includes("Contract") && (
                <p><span className="badge bg-info">{truncateString(itm?.type, 15)}</span></p>
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
      <div className="content">
        <Header />
        <div className="container-fluid">
          <BreadCrumHeader header={"Site Calendar"} page={"Calendar"} />
          {/*  */}
          {/*  */}
          <div className="d-flex bd-highlight">
            <div className="pt-2 bd-highlight ">
              <div className="row" style={{ height: "auto" }}>
                <div className="col">
                  <input
                    type="text"
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
          {/* row start*/}
          <div className="row p-2">
            <div className="col-md-9 p-4">
              <section className="calendar__days">
                <FullCalendar
                  plugins={[dayGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  // weekends={false}
                  dateClick={(e) => {
                    console.log("e", e);
                  }}
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
                  {/* <li class="list-group-item">Domestic Water RA Survey</li> */}
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
                    <span class="badge bg-info text-dark">PAT Testing</span>
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
