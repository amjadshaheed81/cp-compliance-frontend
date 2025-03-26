import React, { useState, useEffect } from 'react';
import { requestForToken, onMessageListener } from './firebase';
import { Toast } from 'react-bootstrap';

const Notification = () => {
  const [notification, setNotification] = useState({title: '', body: ''});
  const [show, setShow] = useState(false);

  useEffect(() => {
    requestForToken().then((token) => {
      // You would typically send this token to your backend during login
      console.log('Token:', token);
    });

    onMessageListener().then((payload) => {
      setNotification({
        title: payload?.notification?.title,
        body: payload?.notification?.body
      });
      setShow(true);
    });
  }, []);

  return (
    <div style={{position: 'fixed', top: '20px', right: '20px', zIndex: 9999}}>
      <Toast 
        onClose={() => setShow(false)} 
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