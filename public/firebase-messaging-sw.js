importScripts('https://www.gstatic.com/firebasejs/9.2.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.2.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyARwHyh0QX1omIEqz92RWM4x6NyOlZxhJM",
  authDomain: "assaa-e3a6c.firebaseapp.com",
  databaseURL: "https://assaa-e3a6c.firebaseio.com",
  projectId: "assaa-e3a6c",
  storageBucket: "assaa-e3a6c.firebasestorage.app",
  messagingSenderId: "78511408937",
  appId: "1:78511408937:web:2bd8feb4aa895c75f2d938"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});