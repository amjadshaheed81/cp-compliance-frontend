// components/Login/LoginForm.js
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import moment from "moment";
import React, { Fragment, useEffect, useState } from "react";
import Tooltip from "@mui/material/Tooltip";
import { connect } from "react-redux";
import { get } from "../../../api";
const DashboardEventCalendar = (loggedInUserData) => {

  const [data, setData] = useState([]);
  useEffect(() => {
    getData();
  }, [])
  const getData = async () => {
    console.log('loggedInUserData', loggedInUserData)
    const data = await get("/api/user/calendar/events?userId="+loggedInUserData?.loggedInUserData?.id??0);
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
    setData(event);
  }
  
  const renderEventContent = (eventInfo) => {
    const title = JSON.parse(eventInfo.event.title);
    return (
      <>
        <p
          //onClick={() => msg(eventInfo.event)}
        >
           
          {title?.map((itm, index) => (
            <>
           <Tooltip title={itm?.label} arrow>
           {/* <p><span class="badge bg-primary">{itm?.label}</span></p> */}
           {itm?.type?.includes("Audit") && (
             <p><span class="badge bg-primary">{itm?.type}</span></p>
           )}
           {itm?.type?.includes("Assessment") && (
             <p><span class="badge bg-dark">{itm?.type}</span></p>
           )}
           {itm?.type?.includes("Inspection") && (
             <p><span class="badge bg-success">{itm?.type}</span></p>
           )}
           {itm?.type?.includes("Survey") && (
             <span class="badge bg-danger">{itm?.type}</span>
           )}
           {itm?.type?.includes("Asbestos") && (
             <span class="badge bg-warning text-dark">{itm?.type}</span>
           )}
           {itm?.type?.includes("Document") && (
             <span class="badge bg-info">{itm?.type}</span>
           )}
           {itm?.type?.includes("Contract") && (
                <span class="badge bg-info">{itm?.type}</span>
              )}
           </Tooltip>
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


const mapStateToProps = (state) => ({
  loggedInUserData: state.site.loggedInUserData,
});
export default connect(mapStateToProps, {})(DashboardEventCalendar);
