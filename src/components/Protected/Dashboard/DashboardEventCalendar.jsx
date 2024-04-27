// components/Login/LoginForm.js
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import React, { Fragment } from "react";
import { connect } from "react-redux";
const DashboardEventCalendar = () => {
  return (
    <Fragment>
      <div class="card">
        <div class="card-body p-2">
          {/* <div class="d-flex bd-highlight p-0">
            <div class="bd-highlight">
              <h5 class="card-title">Event Calendar</h5>
            </div>
            <div class="ms-auto bd-highlight"></div>
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
