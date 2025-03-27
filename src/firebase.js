import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

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
const messaging = getMessaging(app);

export const requestForToken = async () => {
  try {
    const currentToken = await getToken(messaging, { 
      vapidKey: "BGWhSFhFVmc2ph5nJCT_BtVwaMjMrYlK4ZPBQMPCo9Wj1-XiPvfBWl-ZeeaylpLJ8mUK4RnA-NbV7XgZ2AMCCmM" 
    });
    if (currentToken) {
      console.log('current token for client: ', currentToken);
      return currentToken;
    } else {
      console.log('No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (err) {
    console.log('An error occurred while retrieving token. ', err);
    return null;
  }
};

// export const onMessageListener = () =>
//   new Promise((resolve) => {
//     onMessage(messaging, (payload) => {
//       console.log("Message received. ", payload);
//       resolve(payload);
//     });
//   });

export { messaging };