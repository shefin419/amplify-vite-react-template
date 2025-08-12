import { initializeApp } from 'firebase/app';
import {
  getMessaging,
  getToken,
  onMessage,
  Messaging
} from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyDHccvEes3cl5ju4z_mQzjpXLBDqonfqkw",
  authDomain: "fb-facereko-notify.firebaseapp.com",
  projectId: "fb-facereko-notify",
  storageBucket: "fb-facereko-notify.firebasestorage.app",
  messagingSenderId: "899924612948",
  appId: "1:899924612948:web:55c6a9fb4945f37b56dac1",
  measurementId: "G-5WQ42Q2XCQ"
};

const app = initializeApp(firebaseConfig);

//✅ Only get messaging if the environment supports it
function isMessagingSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'Notification' in window &&
    'PushManager' in window &&
    window.isSecureContext
  );
}

let messaging: Messaging | null = null;

if (isMessagingSupported()) {
  try {
    messaging = getMessaging(app);
  } catch (err) {
    console.error("Failed to initialize messaging:", err);
  }
}

export const requestForToken = () => {
  if (!messaging) {
    console.warn("Messaging not supported in this environment.");
    return Promise.resolve(null);
  }

  return getToken(messaging, {
    vapidKey: 'BO8C9aGkN9RkQAoZMz1Hl5lt6ElsQP6epyBIE6VuRiHRAfzhPNPA4Pd5_w5B90DMUowX3qh7bZCH7g2LvD_5CUE'
  })
    .then((currentToken) => {
      if (currentToken) {
        console.log('FCM Token:', currentToken);
        localStorage.setItem('fcmToken', currentToken);
      } else {
        console.warn('No registration token available.');
      }
      return currentToken;
    })
    .catch((err) => {
      console.error('An error occurred while retrieving token.', err);
    } );
};

export const onMessageListener = () => {
  if (!messaging) {
    console.warn("Messaging not supported in this environment.");
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    onMessage(messaging!, (payload) => {
      resolve(payload);
    });
  });
};
