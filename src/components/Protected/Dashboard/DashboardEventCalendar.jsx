// components/Login/LoginForm.js
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import React, { Fragment, useEffect, useState } from "react";
import Tooltip from "@mui/material/Tooltip";
import { connect } from "react-redux";
import { get } from "../../../api";
const DashboardEventCalendar = ({loggedInUserData,sites} ) => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  useEffect(() => {
    getData();
  }, [])

  const getSiteName = (siteId) => {
    const filters = sites.filter(s=> s.siteId === siteId);
    if(filters.length) {
      return `  (${filters[0].siteName})`
    }
    return '';
  }
  const getData = async () => {
    const data = await get("/api/user/calendar/events?userId="+loggedInUserData?.id??0);
    const event = data.map(d => {
      return {
        title: JSON.stringify([
          {
            label: d.shortText + getSiteName(d.siteId),
            type: d.eventType + getSiteName(d.siteId),
            section: d.section
          }]),
        date: moment(d.endDate).format("YYYY-MM-DD"),
        getDate: moment(d.endDate).format("YYYY-MM-DD"),
      }
    })
    setData(event);
  }
  const navigateTo = (link) => {
    navigate(link);
  };
  
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
           {/* <p onClick={()=>{navigateTo(itm?.section)}}><span class="badge bg-primary">{itm?.label}</span></p> */}
           {itm?.type?.includes("Audit") && (
             <p onClick={()=>{navigateTo(itm?.section)}}><span class="badge bg-primary" >{itm?.type}</span></p>
           )}
           {itm?.type?.includes("Assessment") && (
             <p onClick={()=>{navigateTo(itm?.section)}}><span class="badge bg-dark" >{itm?.type}</span></p>
           )}
           {itm?.type?.includes("Inspection") && (
             <p onClick={()=>{navigateTo(itm?.section)}}><span class="badge bg-success" >{itm?.type}</span></p>
           )}
           {itm?.type?.includes("Survey") && (
             <span class="badge bg-danger" >{itm?.type}</span>
           )}
           {itm?.type?.includes("Asbestos") && (
             <p onClick={()=>{navigateTo(itm?.section)}}><span class="badge bg-warning text-dark" >{itm?.type}</span></p>
           )}
           {itm?.type?.includes("Document") && (
             <p onClick={()=>{navigateTo(itm?.section)}}><span class="badge bg-info" >{itm?.type}</span></p>
           )}
           {itm?.type?.includes("Contract") && (
                <p onClick={()=>{navigateTo(itm?.section)}}><span class="badge bg-info" >{itm?.type}</span></p>
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
          <div className="d-flex bd-highlight p-0">
            <div className="bd-highlight">
              <h5 className="card-title">Your ({loggedInUserData?.name}) Calender</h5>
            </div>
            </div>
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
  sites: state.site.sites,
});
export default connect(mapStateToProps, {})(DashboardEventCalendar);
