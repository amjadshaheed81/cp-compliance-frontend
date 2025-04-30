// components/Login/LoginForm.js
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import moment from "moment";
import React, { Fragment, useEffect, useState } from "react";
import Tooltip from "@mui/material/Tooltip";
import { useNavigate } from "react-router-dom";
import { connect } from "react-redux";
import { get } from "../../../api";
const DashboardEventCalendar = ({loggedInUserData, siteSelectedForGlobal}) => {

  const [openInvite, setOpenInvite] = useState(false);
  const [currentInvite, setCurrentInvite] = useState(null);
    
  
  const navigate = useNavigate();
  const navigateTo = (link) => {
    navigate(link);
  };

  const [data, setData] = useState([]);
 

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

  const getUserName = (user) => {  
    if(String(user?.data?.param) === String(loggedInUserData?.id)) {
      return managerList.find(u => String(u.id) === String(user?.data?.userId))?.name;
    } else {
      return managerList.find(u => String(u.id) === String(user?.data?.param))?.name;
    }
  }

  useEffect(() => {
   
    if(siteSelectedForGlobal?.siteId) {
      getData();
      getManagerList();
    }
  }, [siteSelectedForGlobal])

  const getData = async () => {
    let data = await get("/api/user/calendar/events?siteId="+siteSelectedForGlobal?.siteId??0);
    //let invitedata = await get("/api/user/calendar/invites?userId=" + (loggedInUserData?.id ?? 0));
    // data = [...data, ...invitedata]
    data = data.filter(d=> d.eventType !== 'Appointment' && d.section !== 'proposed'  && d.section !== 'dismissed' )
    data = filterDuplicates(data);
    const event = data?.map(d => {
      return {
        title: JSON.stringify([
          {
            label: d.shortText,
            type: d.eventType,
            section: d.section,
            data: d,
          }]),
        date: moment(d.endDate).format("YYYY-MM-DD"),
        getDate: moment(d.endDate).format("YYYY-MM-DD"),
      }
    })
    setData(event);
  }

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
  
  const renderEventContent = (eventInfo) => {
    const title = JSON.parse(eventInfo.event.title);
    return (
      <>
        <p
          //onClick={() => msg(eventInfo.event)}
        >
           
          {title?.map((itm, index) => (
            <>
           <Tooltip title={itm?.type?.includes("Appointment")? `${itm?.label} - ${getUserName(itm)} - Timing : ${itm?.data?.startTime} - : ${itm?.data?.endTime}` : itm?.label} arrow>
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
             <p onClick={()=>{navigateTo(itm?.section)}}><span class="badge bg-danger" >{itm?.type}</span></p> 
           )}
           {itm?.type?.includes("Asbestos") && (
            <p onClick={()=>{navigateTo(itm?.section)}}><span class="badge bg-warning text-dark" >{itm?.type}</span></p> 
           )}
           {itm?.type?.includes("Document") && (
            <p onClick={()=>{navigateTo(itm?.section)}}><span class="badge bg-info" >{itm?.type}</span></p> 
           )}
           {itm?.type?.includes("Contract") && (
              <p onClick={()=>{navigateTo(itm?.section)}}> <span class="badge bg-info" >{itm?.type}</span></p> 
              )}
           {itm?.type?.includes("Appointment") && (
                  <p><span class="badge bg-info" >{itm?.type}</span></p>
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
              <h5 className="card-title">Site Calendar - {siteSelectedForGlobal?.siteName}</h5>
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
      {/* <Appointment 
        openInvite={openInvite} 
        setOpenInvite={setOpenInvite}
        currentInvite={currentInvite}
        setCurrentInvite={setCurrentInvite}
      /> */}
    </Fragment>
  );
};


const mapStateToProps = (state) => ({
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
  loggedInUserData: state.site.loggedInUserData,
});
export default connect(mapStateToProps, {})(DashboardEventCalendar);
