import { initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyARwHyh0QX1omIEqz92RWM4x6NyOlZxhJM",
  authDomain: "assaa-e3a6c.firebaseapp.com",
  databaseURL: "https://assaa-e3a6c.firebaseio.com",
  projectId: "assaa-e3a6c",
  storageBucket: "assaa-e3a6c.firebasestorage.app",
  messagingSenderId: "78511408937",
  appId: "1:78511408937:web:2bd8feb4aa895c75f2d938"
};

const app = initializeApp(firebaseConfig);
let messagingInstance = null;

export const getMessagingInstance = async () => {
  try {
    const supported = await isSupported();
    if (!supported) {
      return null;
    }
    if (!messagingInstance) {
      messagingInstance = getMessaging(app);
    }
    return messagingInstance;
  } catch (error) {
    console.warn("Firebase messaging is not available in this browser.", error);
    return null;
  }
};

const withTimeout = (promise, timeoutMs) =>
  Promise.race([
    promise,
    new Promise((resolve) =>
      window.setTimeout(() => resolve(null), timeoutMs)
    ),
  ]);

export const requestForToken = async ({ timeoutMs = 8000 } = {}) => {
  try {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return null;
    }
    if (!("serviceWorker" in navigator) || !("Notification" in window)) {
      return null;
    }
    if (Notification.permission === "denied") {
      return null;
    }

    const messaging = await getMessagingInstance();
    if (!messaging) {
      return null;
    }

    const currentToken = await withTimeout(
      getToken(messaging, {
        vapidKey: "BGWhSFhFVmc2ph5nJCT_BtVwaMjMrYlK4ZPBQMPCo9Wj1-XiPvfBWl-ZeeaylpLJ8mUK4RnA-NbV7XgZ2AMCCmM"
      }),
      timeoutMs
    );

    return currentToken || null;
  } catch (err) {
    console.warn("Notification token registration skipped.", err);
    return null;
  }
};
