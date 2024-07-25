// components/Login/LoginForm.js
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import moment from "moment";
import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import { get } from "../../../api";
const DashboardEventCalendar = () => {
  const events2 = [
    {
      title: 'Event 1',
      date: '2024-07-25', // YYYY-MM-DD format
    }
  ];
  const [data, setData] = useState([]);
  useEffect(() => {
    getData();
  }, [])
  const getData = async () => {
    const data = await get("/api/user/calendar/events");
    const event = data.map(d => {
      return {
        title: JSON.stringify([
          {
            label: d.shortText,
          type: d.shortText,
          }]),
        date: moment(d.expiryDate).format("YYYY-MM-DD"),
        getDate: moment(d.expiryDate).format("YYYY-MM-DD"),
      }
    })
    console.log("datatatatat", event)
    setData(event);
  }
  
  const renderEventContent = (eventInfo) => {
    console.log("event", eventInfo);
    const title = JSON.parse(eventInfo.event.title);
    return (
      <>
        <p
          //onClick={() => msg(eventInfo.event)}
        >
          {title?.map((itm, index) => (
            <>
              <p><span class="badge bg-primary">{itm?.label}</span></p>
              {/* {itm?.type === "Audit" && (
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
              )} */}
            </>
          ))}
        </p>
      </>
    );
  }

  return (
    <Fragment>
      <div className="card">
        <div className="card-body p-2">
         
          <FullCalendar
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            weekends={true}
            events={data}
            eventContent={renderEventContent}
          />
        </div>
      </div>
    </Fragment>
  );
};


export default connect(null, {})(DashboardEventCalendar);
