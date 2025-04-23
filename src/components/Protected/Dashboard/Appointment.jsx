// components/Login/LoginForm.js
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import React, { Fragment, useEffect, useState } from "react";
import Tooltip from "@mui/material/Tooltip";
import { connect } from "react-redux";
import { del, get, put } from "../../../api";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box
} from "@mui/material";
import Form from 'react-bootstrap/Form';
import { toast } from "react-toastify";

const Appointment = ({ openInvite, setOpenInvite,currentInvite, setCurrentInvite, loggedInUserData, sites, siteSelectedForGlobal }) => {
  // const [openInvite, setOpenInvite] = useState(false);
  // const [currentInvite, setCurrentInvite] = useState(null);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [proposedDate, setProposedDate] = useState('');
  const [proposedStartTime, setProposedStartTime] = useState('');
  const [proposedEndTime, setProposedEndTime] = useState('');

  useEffect(() => {
    getManagerList();
  }, []);


  useEffect(() => {
    if (currentInvite) {
      const date = moment(currentInvite.startDate).format('YYYY-MM-DD');
      
      setProposedDate(date);
      setProposedStartTime(currentInvite?.startTime);
      setProposedEndTime(currentInvite?.endTime);
    }
  }, [currentInvite]);

  const getSiteName = (siteId) => {
    const filters = sites.filter(s => s.siteId === siteId);
    if (filters.length) {
      return `  (${filters[0].siteName})`
    }
    return '';
  }

  const handleAccept = () => {
    del(`/api/user/calendar/${currentInvite?.calendarId}/delete`);
    const calenderBody = {
      siteId: currentInvite?.siteId,
      startDate: moment(currentInvite.startDate),
      endDate: moment(currentInvite.endDate),
      shortText: currentInvite.shortText,
      eventType: `Appointment`,
      userId: currentInvite?.userId,
      includeCompanyUsers: false,
      status: "Active",
      startTime: currentInvite.startTime,
      endTime: currentInvite.endTime,
    };
    put('/api/user/calendar', calenderBody);
    calenderBody.userId = currentInvite.param;
    put('/api/user/calendar', calenderBody);
    setOpenInvite(false);
  };

  const dismiss = async () => {
    const updatedInvite = {
      ...currentInvite,
      
      section: "dismissed",
    };
      await put(`/api/user/calendar`, updatedInvite);
      setOpenInvite(false);
  }

  const handleProposeNewTime = async () => {
    
    if (!isEditingTime) {
      setIsEditingTime(true);
      return;
    }
    if(!proposedStartTime || !proposedEndTime) {
      toast.error("Please select start and end time");
      return;
    }


    // Combine date and time to create new datetime objects
    const newStartDate = moment(`${proposedDate}`);
    const newEndDate = moment(`${proposedDate}`);

    // Update the invite with proposed time
    const updatedInvite = {
      ...currentInvite,
      startDate: newStartDate.toISOString(),
      endDate: newEndDate.toISOString(),
      startTime: proposedStartTime,
      endTime: proposedEndTime,
      userId: loggedInUserData?.id,
      includeCompanyUsers: false,
      param: currentInvite?.userId,
    };

      await put(`/api/user/calendar`, updatedInvite);
      setIsEditingTime(false);
      setOpenInvite(false);
    
  };

  const handleCancelEdit = () => {
    setIsEditingTime(false);
    const date = moment(currentInvite.startDate).format('YYYY-MM-DD');
    const startTime = moment(currentInvite.startDate).format('HH:mm');
    const endTime = moment(currentInvite.endDate).format('HH:mm');
    
    setProposedDate(date);
    setProposedStartTime(startTime);
    setProposedEndTime(endTime);
  };

  const [managerList, setManagerList] = useState([]);
  const fromUser = managerList.find(u => u.id === currentInvite?.userId);

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


  return (
    <Fragment>
      {fromUser?.name && 
      <Dialog
        maxWidth="lg"
        fullWidth
        open={openInvite}
        onClose={() => setOpenInvite(false)}
      >
        <DialogTitle>Calendar Invitation</DialogTitle>
        <DialogContent dividers>
          {currentInvite && (
            <Box sx={{ p: 2 }}>
              <Typography variant="h5" gutterBottom>
              Appointment 
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Site:</strong> {getSiteName(currentInvite?.siteId)}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>From:</strong> {fromUser?.name}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Subject:</strong> {currentInvite.shortText}
              </Typography>

              {isEditingTime ? (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={proposedDate}
                      onChange={(e) => setProposedDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </Form.Group>
                  
                  <div className="row">
                    <Form.Group className="mb-3 col-md-6">
                      <Form.Label>Start Time</Form.Label>
                      <Form.Control
                        type="time"
                        value={proposedStartTime}
                        onChange={(e) => setProposedStartTime(e.target.value)}
                        required
                      />
                    </Form.Group>
                    
                    <Form.Group className="mb-3 col-md-6">
                      <Form.Label>End Time</Form.Label>
                      <Form.Control
                        type="time"
                        value={proposedEndTime}
                        onChange={(e) => setProposedEndTime(e.target.value)}
                        required
                      />
                    </Form.Group>
                  </div>
                </>
              ) : (
                <>
                  <Typography variant="body1" gutterBottom>
                    <strong>Date:</strong> {moment(currentInvite.startDate).format("MMMM Do, YYYY")}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>Time:</strong> 
                    &nbsp;
                    <input type='time' value={currentInvite.startTime} disabled/>
                    &nbsp; -&nbsp;
                    <input type='time' value={currentInvite.endTime} disabled/>
                  </Typography>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            color="success"
            onClick={handleAccept}
          >
            Accept
          </Button>
          {isEditingTime ? (
            <>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleCancelEdit}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleProposeNewTime}
              >
                Submit New Time
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleProposeNewTime}
            >
              Propose New Time
            </Button>
          )}

            <Button
              variant="contained"
              color="primary"
              onClick={dismiss}
            >
              Dismiss
            </Button>
        </DialogActions>
      </Dialog>}
    </Fragment>
  );
};

const mapStateToProps = (state) => ({
  loggedInUserData: state.site.loggedInUserData,
  sites: state.site.sites,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
});

export default connect(mapStateToProps, {})(Appointment);