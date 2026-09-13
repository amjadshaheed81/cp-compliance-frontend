import React, { useState, useEffect } from 'react';
import { onMessage } from "firebase/messaging";
import { getMessagingInstance } from "./firebase";
import { Toast } from 'react-bootstrap';
import { getGroupKeyFromPayload, shouldShowNotification } from './utils/notificationGroupFilter';

const Notification = () => {
  const [notification, setNotification] = useState({ title: '', body: '' });
  const [show, setShow] = useState(false);

  const playSound = () => {
    const audio = new Audio('not.wav');
    audio.play().catch(e => console.log("Audio play failed:", e));
  };

  useEffect(() => {
    let unsubscribe = null;
    let active = true;

    const registerForegroundNotifications = async () => {
      const messaging = await getMessagingInstance();
      if (!active || !messaging) {
        return;
      }

      unsubscribe = onMessage(messaging, (payload) => {
        console.log('notification', payload);
        const groupKey = getGroupKeyFromPayload(payload);
        if (groupKey != null && !shouldShowNotification(groupKey)) {
          return;
        }
        setNotification({
          title: payload?.notification?.title ?? '',
          body: payload?.notification?.body ?? ''
        });
        setShow(true);
        playSound();
      });
    };

    registerForegroundNotifications().catch((error) => {
      console.warn('Foreground notifications are unavailable.', error);
    });

    return () => {
      active = false;
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
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
            delay={20000}
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