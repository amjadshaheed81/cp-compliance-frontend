// components/Login/LoginForm.js
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import React, { Fragment } from "react";
import { connect } from "react-redux";
const DashboardEventCalendar = () => {
  return (
    <Fragment>
      <div className="card">
        <div className="card-body p-2">
          {/* <div className="d-flex bd-highlight p-0">
            <div className="bd-highlight">
              <h5 className="card-title">Event Calendar</h5>
            </div>
            <div className="ms-auto bd-highlight"></div>
          </div> */}
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
          />
        </div>
      </div>
    </Fragment>
  );
};

export default connect(null, {})(DashboardEventCalendar);
