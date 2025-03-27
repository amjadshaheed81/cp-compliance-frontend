import React, { useState, useEffect } from 'react';
import { onMessage } from "firebase/messaging";
import {messaging} from "./firebase";
import { Toast } from 'react-bootstrap';

const Notification = () => {
  const [notification, setNotification] = useState({title: '', body: ''});
  const [show, setShow] = useState(false);

  const playSound = () => {
    const audio = new Audio('not.wav');
    audio.play().catch(e => console.log("Audio play failed:", e));
  };

  useEffect(() => {
    onMessage(messaging, (payload) => {
      console.log('notification', payload);
      setNotification({
        title: payload?.notification?.title,
        body: payload?.notification?.body
      });
      setShow(true);
      playSound();
      
    });
  }, []);

  return (
    <div style={{position: 'fixed', top: '20px', right: '20px', zIndex: 9999}}>
      <Toast 
      style={{
        borderLeft: '4px solid #0d6efd',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
      }}
        onClose={() => {console.log('closed called');setShow(false)}} 
        show={show} 
        delay={5000} 
        autohide
      >
        <Toast.Header>
          <strong className="me-auto">{notification.title}</strong>
        </Toast.Header>
        <Toast.Body>{notification.body}</Toast.Body>
      </Toast>
    </div>
  );
};

export default Notification;