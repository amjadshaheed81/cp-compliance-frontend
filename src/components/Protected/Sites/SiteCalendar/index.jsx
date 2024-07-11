import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import Header from "../../../common/Header/Header";
import BreadCrumHeader from "../../../common/BreadCrumHeader/BreadCrumHeader";
import SidebarNew from "../../../common/Sidebar/SidebarNew";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import moment from "moment";
import "./calendar.css";

const SiteCalendar = ({ siteSelectedForGlobal }) => {
  let momentX = new Date();
  let date2 = moment(new Date()).add(5, 'days').toDate();
  const [clickedDate, setClickedDate] = useState(undefined);

  const [calendarEvent, setCalendarEvent] = useState();
  useEffect(() => {
    setCalendarEvent([
      {
        title: JSON.stringify([
          {
            label: "WC Alarm Test",
            type: "Inspection",
          },
          {
            label: "Fire Risk Assessment",
            type: "Assessment",
          },
        ]),
        date: moment(momentX).format("YYYY-MM-DD"),
        getDate: moment(momentX).format("YYYY-MM-DD"),
      },
      {
        title: JSON.stringify([
          {
            label: "Water Outlet Temp Survey",
            type: "Water Survey",
          },
        ]),
        date: moment(date2).format("YYYY-MM-DD"),
        getDate: moment(date2).format("YYYY-MM-DD"),
      }
    ]);
  }, []);
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
  function renderEventContent(eventInfo) {
    console.log("event", eventInfo);
    const title = JSON.parse(eventInfo.event.title);
    return (
      <>
        <p onClick={() => msg(eventInfo.event)}>
          {title?.map((itm, index) => (
            <>
              {itm?.type === "Audit" && (
                <p><span class="badge bg-primary">{itm?.label}</span></p>
              )}
              {itm?.type === "Assessment" && (
                <p><span class="badge bg-dark">{itm?.label}</span></p>
              )}
              {itm?.type === "Inspection" && (
                <p><span class="badge bg-success">{itm?.label}</span></p>
              )}
              {itm?.type === "Water Survey" && (
                <span class="badge bg-danger">{itm?.label}</span>
              )}
              {itm?.type === "Asbestos Survey" && (
                <span class="badge bg-warning text-dark">{itm?.label}</span>
              )}
              {itm?.type === "PAT Testing" && (
                <span class="badge bg-info text-dark">{itm?.label}</span>
              )}
            </>
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
                    <span class="badge bg-primary">2</span>
                  </span>
                </p>
                <ul class="list-group">
                  <li class="list-group-item active text-primary">
                    6 monthly Unite Maintenance Audit
                  </li>
                  <li class="list-group-item">Domestic Water RA Survey</li>
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
});
export default connect(mapStateToProps, {})(SiteCalendar);
