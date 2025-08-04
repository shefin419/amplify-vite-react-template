import { initializeApp } from 'firebase/app';
import {
  getMessaging,
  getToken,
  onMessage,
  Messaging
} from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyCzL5FjaYD2jgYCB_USv_K8qtVGHqQEya0",
  authDomain: "push-notify-53b8c.firebaseapp.com",
  projectId: "push-notify-53b8c",
  storageBucket: "push-notify-53b8c.appspot.com",
  messagingSenderId: "625713046754",
  appId: "1:625713046754:web:6c00bbd6b0846d34f2268e"
};

const app = initializeApp(firebaseConfig);

// ✅ Only get messaging if the environment supports it
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
    vapidKey: 'BMuk1RB7NmKW0MbFaD_vr1gWGJvFq5Dpa7XVVOqa_mjc8ALL4Pj9v8uXsiO4dGMfnSzYd72HZIwQCi5zLYVDTfU'
  })
    .then((currentToken) => {
      if (currentToken) {
        // console.log('FCM Token:', currentToken);
        localStorage.setItem('fcmToken', currentToken);
      } else {
        console.warn('No registration token available.');
      }
      return currentToken;
    })
    .catch((err) => {
      console.error('An error occurred while retrieving token.', err);
    });
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
